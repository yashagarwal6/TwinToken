import { Constants } from "./utils/Constants.js";
import { SoundEffects, AmbientMusicSystem } from "./systems/AudioSystem.js";
import { Clock } from "./core/Clock.js";
import { InputManager } from "./core/InputManager.js";
import { GameState } from "./core/GameState.js";
import { LevelManager } from "./levels/LevelManager.js";
import { VerticalSliceLevels } from "./levels/VerticalSliceData.js";
import { CampaignLevels } from "./levels/CampaignData.js";
import { EchoSystem } from "./mechanics/EchoSystem.js";
import { RiftSystem } from "./mechanics/RiftSystem.js";
import { HUD } from "./ui/HUD.js";
import { HintSystem } from "./ui/HintSystem.js";
import { AutopilotPlayer } from "./ui/AutopilotPlayer.js";
import { Menus } from "./ui/Menus.js";
import { ScoreSystem } from "./systems/ScoreSystem.js";
import { SaveSystem } from "./systems/SaveSystem.js";
import { Helpers } from "./utils/Helpers.js";

export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.sounds = new SoundEffects();
        this.music = new AmbientMusicSystem();
        this.musicBtn = document.getElementById('music-btn');
        if (this.musicBtn) {
            this.musicBtn.textContent = this.music.getStatusString();
            this.musicBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.target.blur();
                const status = this.music.cycleVolume();
                this.musicBtn.textContent = status;
            });
        }

        // Start ambient music on user's first input/click (conforms to browser autoplay policies)
        const startAudioOnInteraction = () => {
            if (!this.music.muted && !this.music.isPlaying) {
                this.music.start();
            }
            window.removeEventListener('keydown', startAudioOnInteraction);
            window.removeEventListener('click', startAudioOnInteraction);
        };
        window.addEventListener('keydown', startAudioOnInteraction);
        window.addEventListener('click', startAudioOnInteraction);

        this.input = new InputManager();
        this.state = new GameState();
        this.state.inputManager = this.input;

        // Load Campaign Levels (50 levels)
        this.levelManager = new LevelManager(this.state, CampaignLevels);
        this.echoSystem = new EchoSystem(this.state, this.sounds);
        this.riftSystem = new RiftSystem(this.state, this.sounds);

        this.hud = new HUD(this.state);
        this.hintSystem = new HintSystem(this.state);
        this.autopilot = new AutopilotPlayer(this.state);

        this.menus = new Menus(
            this.state,
            this.levelManager,
            this.sounds,
            () => this.onNextLevel(),
            () => this.onRetryLevel()
        );

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = Constants.CANVAS_WIDTH / rect.width;
            const scaleY = Constants.CANVAS_HEIGHT / rect.height;
            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;
            this.menus.handleClick(mouseX, mouseY);
        });

        this.clock = new Clock(
            (dt, tick) => this.update(dt, tick),
            (isPaused) => this.render(isPaused),
            (isBlurPaused) => this.handleBlurPause(isBlurPaused)
        );

        // Load first level
        this.levelManager.loadLevelByIndex(0);
        this.clock.start();
    }

    handleBlurPause(isPaused) {
        this.state.tabPaused = isPaused;
    }

    onNextLevel() {
        const hasNext = this.levelManager.nextLevel();
        if (!hasNext) {
            // Replay from start if finished
            this.levelManager.loadLevelByIndex(0);
        }
    }

    onRetryLevel() {
        this.levelManager.restart();
    }

    update(dt, tick) {
        this.state.currentTick = tick;
        let inputs = this.input.poll();

        // 1. Menu interception
        if (this.menus.update(inputs)) {
            return;
        }

        // 2. Toggle Autopilot with [P]
        if (this.input.justPressed('autopilot')) {
            if (this.autopilot.active) {
                this.autopilot.stop();
            } else {
                this.autopilot.start();
            }
        }

        // Toggle Music volume with [M]
        if (this.input.justPressed('music')) {
            const status = this.music.cycleVolume();
            if (this.musicBtn) {
                this.musicBtn.textContent = status;
            }
        }

        // 3. Autopilot input override (§9)
        inputs = this.autopilot.update(inputs);

        // 3. Hint System
        this.hintSystem.update(inputs);
        if (this.hintSystem.isOpen) {
            return; // Pause game physics while reading hint modal
        }

        // 4. Instant Reset with R (§3: free, instant, no animation)
        if (inputs.restart || this.state.shouldReset) {
            this.state.resetAttempt();
            this.sounds.play('reset');
            return;
        }

        // 5. Esc Pause / Menu
        if (this.input.justPressed('pause') && !this.echoSystem.isTrimming) {
            this.menus.toggleLevelSelect();
            return;
        }

        // 6. ECHO Mechanic Ability
        if (this.state.level && this.state.level.mechanic === 'echo') {
            if (this.echoSystem.isTrimming) {
                this.echoSystem.updateTrim(inputs, this.input);
                return; // Pause game while scrubbing trim window
            }

            const abilityJustPressed = this.input.justPressed('ability') || (inputs.ability && !this.prevSimAbility);
            this.prevSimAbility = !!inputs.ability;

            if (abilityJustPressed) {
                this.echoSystem.triggerAbility();
            }

            if (this.input.rawKeys['KeyT'] && !this.input.previousInputs['KeyT']) {
                this.echoSystem.startTrim();
                return;
            }
        } else {
            this.prevSimAbility = false;
        }

        // Track level elapsed time (in seconds)
        this.state.levelElapsedTime += dt;

        // 7. Update Mechanics
        if (this.state.level.mechanic === 'echo') {
            this.echoSystem.update(dt);
        } else if (this.state.level.mechanic === 'rift') {
            this.riftSystem.update(dt, inputs);
        }

        // 8. Update Interactables (Plates, Doors, Hazards)
        for (let i = 0; i < this.state.interactables.length; i++) {
            this.state.interactables[i].update(this.state, this.sounds);
        }

        // 9. Update Player
        if (this.state.player && !this.state.levelCompleted) {
            const solids = this.state.getSolids();
            this.state.player.update(dt, inputs, solids, this.sounds);

            // Record input history
            this.state.playerInputHistory.push({ ...inputs });

            // 10. Check Goal Reached
            if (this.state.goal && Helpers.checkAABB(this.state.player, this.state.goal)) {
                this.state.levelCompleted = true;
                this.sounds.play('goal');

                // Calculate Score & Stars (§7)
                const scoreResult = ScoreSystem.calculate(
                    this.state.level.parTime || 30,
                    this.state.levelElapsedTime,
                    this.state.deaths,
                    this.state.hintsViewedStage,
                    this.state.autopilotUsed
                );

                // Persist Progress (§20, §25 #4)
                SaveSystem.recordLevelCompletion(
                    this.state.level.id,
                    this.levelManager.currentIndex,
                    scoreResult.score,
                    scoreResult.stars,
                    this.state.levelElapsedTime
                );

                // Show Level Complete Screen
                this.menus.showLevelComplete(scoreResult);
            }
        }
    }

    render(isPaused) {
        // Clear background
        this.ctx.fillStyle = Constants.COLORS.BG;
        this.ctx.fillRect(0, 0, Constants.CANVAS_WIDTH, Constants.CANVAS_HEIGHT);

        // Subtle background grid
        this.ctx.strokeStyle = Constants.COLORS.BG_GRID;
        this.ctx.lineWidth = 1;
        for (let x = 0; x < Constants.CANVAS_WIDTH; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, Constants.CANVAS_HEIGHT);
            this.ctx.stroke();
        }
        for (let y = 0; y < Constants.CANVAS_HEIGHT; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(Constants.CANVAS_WIDTH, y);
            this.ctx.stroke();
        }

        // Draw static solids
        for (let i = 0; i < this.state.solids.length; i++) {
            const s = this.state.solids[i];
            this.ctx.fillStyle = Constants.COLORS.SOLID;
            this.ctx.fillRect(s.x, s.y, s.width, s.height);
            this.ctx.strokeStyle = Constants.COLORS.SOLID_BORDER;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(s.x, s.y, s.width, s.height);
        }

        // Draw Interactables
        for (let i = 0; i < this.state.interactables.length; i++) {
            this.state.interactables[i].render(this.ctx);
        }

        // Draw Mechanics
        if (this.state.level) {
            if (this.state.level.mechanic === 'echo') {
                this.echoSystem.render(this.ctx);
            } else if (this.state.level.mechanic === 'rift') {
                this.riftSystem.render(this.ctx);
            }
        }

        // Draw Player
        if (this.state.player) {
            this.state.player.render(this.ctx);
        }

        // Draw HUD
        this.hud.render(this.ctx);

        // Draw Autopilot banner
        this.autopilot.render(this.ctx);

        // Draw Hints modal
        this.hintSystem.render(this.ctx);

        // Draw Menus (Level Complete / Level Select)
        this.menus.render(this.ctx);

        // Blur Pause Overlay (§25 #5)
        if (this.state.tabPaused && !this.menus.levelCompleteResult && !this.hintSystem.isOpen) {
            this.ctx.fillStyle = 'rgba(11, 12, 16, 0.75)';
            this.ctx.fillRect(0, 0, Constants.CANVAS_WIDTH, Constants.CANVAS_HEIGHT);
            this.ctx.fillStyle = '#eceff4';
            this.ctx.font = 'bold 22px -apple-system, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED (WINDOW OUT OF FOCUS)', 400, 300);
            this.ctx.font = '14px -apple-system, sans-serif';
            this.ctx.fillText('Click to resume', 400, 330);
            this.ctx.textAlign = 'left';
        }
    }
}

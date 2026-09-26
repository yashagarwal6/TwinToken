import { Constants } from "../utils/Constants.js";
import { SaveSystem } from "../systems/SaveSystem.js";

export class Menus {
    constructor(gameState, levelManager, sounds, onNextLevel, onRetry) {
        this.state = gameState;
        this.levelManager = levelManager;
        this.sounds = sounds;
        this.onNextLevel = onNextLevel;
        this.onRetry = onRetry;

        this.levelSelectOpen = false;
        this.levelCompleteResult = null; // score calculation result
        this.selectedMenuIndex = 0;
    }

    showLevelComplete(result) {
        this.levelCompleteResult = result;
    }

    hideLevelComplete() {
        this.levelCompleteResult = null;
    }

    toggleLevelSelect() {
        this.levelSelectOpen = !this.levelSelectOpen;
        if (this.levelSelectOpen) {
            this.selectedMenuIndex = this.levelManager.currentIndex;
        }
    }

    handleClick(mouseX, mouseY) {
        if (!this.levelSelectOpen) return false;

        const cols = 10;
        const cellW = 56;
        const cellH = 36;
        const startX = 85;
        const startY = 130;

        for (let i = 0; i < this.levelManager.levels.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = startX + col * (cellW + 6);
            const y = startY + row * (cellH + 8);

            if (mouseX >= x && mouseX <= x + cellW && mouseY >= y && mouseY <= y + cellH) {
                this.selectedMenuIndex = i;
                this.tryLoadSelectedLevel();
                return true;
            }
        }
        return false;
    }

    tryLoadSelectedLevel() {
        const levels = this.levelManager.levels;
        const index = this.selectedMenuIndex;
        if (index < 0 || index >= levels.length) return;

        const save = SaveSystem.load();
        const lvl = levels[index];
        const isCompleted = save.levelProgress && save.levelProgress[lvl.id] && save.levelProgress[lvl.id].completed;
        const isAccessible = (index <= save.unlockedIndex) || isCompleted;

        if (isAccessible) {
            this.levelManager.loadLevelByIndex(index);
            this.levelSelectOpen = false;
            if (this.sounds) this.sounds.play('jump');
        } else {
            if (this.sounds) this.sounds.play('reset');
        }
    }

    update(input) {
        // 1. Level Complete Screen Controls
        if (this.levelCompleteResult) {
            if (this.state.inputManager && (this.state.inputManager.justPressed('jump') || this.state.inputManager.justPressed('interact') || this.state.inputManager.rawKeys['Enter'])) {
                this.hideLevelComplete();
                if (this.onNextLevel) this.onNextLevel();
            } else if (this.state.inputManager && this.state.inputManager.justPressed('restart')) {
                this.hideLevelComplete();
                if (this.onRetry) this.onRetry();
            }
            return true; // consumes input
        }

        // 2. Level Select Menu Controls
        if (this.levelSelectOpen) {
            const levels = this.levelManager.levels;
            const im = this.state.inputManager;

            // Close with Esc
            if (im && im.justPressed('pause')) {
                this.levelSelectOpen = false;
                return true;
            }

            // Navigate Left / Right
            if (im && im.justPressed('left')) {
                if (this.selectedMenuIndex % 10 > 0) {
                    this.selectedMenuIndex--;
                }
            }
            if (im && im.justPressed('right')) {
                if (this.selectedMenuIndex % 10 < 9 && this.selectedMenuIndex + 1 < levels.length) {
                    this.selectedMenuIndex++;
                }
            }

            // Navigate Up / Down
            if (im && (im.justPressed('up') || im.rawKeys['KeyW'] && !im.previousInputs.up)) {
                if (this.selectedMenuIndex >= 10) {
                    this.selectedMenuIndex -= 10;
                }
            }
            if (im && (im.justPressed('down') || im.rawKeys['KeyS'] && !im.previousInputs.down)) {
                if (this.selectedMenuIndex + 10 < levels.length) {
                    this.selectedMenuIndex += 10;
                }
            }

            // Select & Play Level with Enter, Space, or E
            if (im && (im.justPressed('interact') || im.justPressed('jump') || im.rawKeys['Enter'])) {
                this.tryLoadSelectedLevel();
            }

            return true;
        }

        return false;
    }

    render(ctx) {
        if (this.levelCompleteResult) {
            this.renderLevelComplete(ctx);
        } else if (this.levelSelectOpen) {
            this.renderLevelSelect(ctx);
        }
    }

    renderLevelComplete(ctx) {
        const res = this.levelCompleteResult;
        
        ctx.fillStyle = 'rgba(11, 12, 16, 0.92)';
        ctx.fillRect(150, 100, 500, 400);
        ctx.strokeStyle = Constants.COLORS.UI_ACCENT;
        ctx.lineWidth = 2;
        ctx.strokeRect(150, 100, 500, 400);

        ctx.textAlign = 'center';
        
        ctx.fillStyle = Constants.COLORS.UI_TEXT;
        ctx.font = 'bold 24px -apple-system, sans-serif';
        ctx.fillText('LEVEL COMPLETED!', 400, 150);

        ctx.font = '14px monospace';
        ctx.fillStyle = '#88c0d0';
        ctx.fillText(`Level: ${this.state.level ? this.state.level.id : ''}`, 400, 175);

        // Stars Display (★★★)
        ctx.font = '36px -apple-system, sans-serif';
        let starStr = '';
        for (let i = 1; i <= 3; i++) {
            starStr += (i <= res.stars) ? '★ ' : '☆ ';
        }
        ctx.fillStyle = '#ebcb8b';
        ctx.fillText(starStr.trim(), 400, 225);

        // Score
        ctx.font = 'bold 32px monospace';
        ctx.fillStyle = '#eceff4';
        ctx.fillText(`${res.score} PTS`, 400, 270);

        ctx.font = '13px monospace';
        ctx.fillStyle = '#d8dee9';
        const timeSec = (this.state.levelElapsedTime || 0).toFixed(1);
        const parSec = this.state.level.parTime ? this.state.level.parTime.toFixed(1) : '--';
        ctx.fillText(`Time: ${timeSec}s (Par: ${parSec}s)   •   Restarts: ${this.state.deaths}`, 400, 310);

        if (res.breakdown.autopilot) {
            ctx.fillStyle = '#b48ead';
            ctx.fillText('AUTOPILOT USED — Progression granted, Score set to 0', 400, 340);
        } else if (res.breakdown.hintCapped) {
            ctx.fillStyle = '#ebcb8b';
            ctx.fillText('HINT USED — Score capped at 50%', 400, 340);
        }

        ctx.fillStyle = '#eceff4';
        ctx.font = '14px -apple-system, sans-serif';
        ctx.fillText('[Space / Enter] Next Level     •     [R] Retry Level', 400, 430);

        ctx.textAlign = 'left';
    }

    renderLevelSelect(ctx) {
        ctx.fillStyle = 'rgba(11, 12, 16, 0.96)';
        ctx.fillRect(40, 40, 720, 520);
        ctx.strokeStyle = Constants.COLORS.UI_ACCENT;
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 40, 720, 520);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#eceff4';
        ctx.font = 'bold 22px -apple-system, sans-serif';
        ctx.fillText('CAMPAIGN LEVEL SELECT', 400, 75);

        ctx.font = '12px -apple-system, sans-serif';
        ctx.fillStyle = '#88c0d0';
        ctx.fillText('Select and replay any completed or unlocked level', 400, 96);

        const save = SaveSystem.load();
        const levels = this.levelManager.levels;
        const cols = 10;
        const cellW = 56;
        const cellH = 36;
        const startX = 85;
        const startY = 120;

        for (let i = 0; i < levels.length; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = startX + col * (cellW + 6);
            const y = startY + row * (cellH + 8);

            const lvl = levels[i];
            const isSelected = (i === this.selectedMenuIndex);
            const isCurrent = (i === this.levelManager.currentIndex);

            const prog = save.levelProgress && save.levelProgress[lvl.id];
            const isCompleted = prog && prog.completed;
            const isUnlocked = (i <= save.unlockedIndex) || isCompleted;

            // Box Background
            if (!isUnlocked) {
                ctx.fillStyle = '#1e222b';
            } else if (lvl.mechanic === 'echo') {
                ctx.fillStyle = isCurrent ? '#434c5e' : '#2e3440';
            } else {
                ctx.fillStyle = isCurrent ? '#4c566a' : '#3b4252';
            }
            ctx.fillRect(x, y, cellW, cellH);

            // Border
            if (isSelected) {
                ctx.strokeStyle = '#ebcb8b'; // Gold focus outline
                ctx.lineWidth = 2.5;
            } else if (isCurrent) {
                ctx.strokeStyle = '#88c0d0';
                ctx.lineWidth = 2;
            } else if (!isUnlocked) {
                ctx.strokeStyle = '#3b4252';
                ctx.lineWidth = 1;
            } else {
                ctx.strokeStyle = lvl.mechanic === 'echo' ? '#5e81ac' : '#b48ead';
                ctx.lineWidth = 1;
            }
            ctx.strokeRect(x, y, cellW, cellH);

            // Label
            ctx.textAlign = 'center';
            if (!isUnlocked) {
                ctx.fillStyle = '#4c566a';
                ctx.font = '11px monospace';
                ctx.fillText(`L${lvl.id}`, x + cellW / 2, y + 16);
                ctx.font = '10px monospace';
                ctx.fillText('🔒', x + cellW / 2, y + 29);
            } else {
                ctx.fillStyle = isSelected ? '#ebcb8b' : (isCurrent ? '#88c0d0' : '#eceff4');
                ctx.font = 'bold 11px monospace';
                ctx.fillText(`L${lvl.id}`, x + cellW / 2, y + 16);

                ctx.font = '10px monospace';
                if (isCompleted && prog.stars) {
                    ctx.fillStyle = '#ebcb8b';
                    ctx.fillText('★'.repeat(prog.stars), x + cellW / 2, y + 29);
                } else {
                    ctx.fillStyle = lvl.mechanic === 'echo' ? '#81a1c1' : '#b48ead';
                    ctx.fillText(lvl.mechanic === 'echo' ? 'ECHO' : 'RIFT', x + cellW / 2, y + 29);
                }
            }
        }

        // Selected Level Info Bar at bottom
        const selLvl = levels[this.selectedMenuIndex];
        if (selLvl) {
            const prog = save.levelProgress && save.levelProgress[selLvl.id];
            const isCompleted = prog && prog.completed;
            const isUnlocked = (this.selectedMenuIndex <= save.unlockedIndex) || isCompleted;

            ctx.fillStyle = '#2e3440';
            ctx.fillRect(85, 410, 614, 50);
            ctx.strokeStyle = '#4c566a';
            ctx.lineWidth = 1;
            ctx.strokeRect(85, 410, 614, 50);

            ctx.textAlign = 'left';
            ctx.fillStyle = '#eceff4';
            ctx.font = 'bold 13px -apple-system, sans-serif';
            ctx.fillText(`SELECTED: LEVEL ${selLvl.id} — ${selLvl.mechanic.toUpperCase()}`, 105, 430);

            ctx.font = '12px monospace';
            ctx.fillStyle = isUnlocked ? '#a3be8c' : '#bf616a';
            const statusText = isCompleted ? `COMPLETED (${prog.score} PTS, ${prog.stars} STARS, BEST: ${prog.bestTime.toFixed(1)}s)` : (isUnlocked ? "UNLOCKED — Ready to Play" : "LOCKED — Complete previous levels to unlock");
            ctx.fillText(`Status: ${statusText}`, 105, 448);
        }

        // Instructions Footer
        ctx.textAlign = 'center';
        ctx.fillStyle = '#d8dee9';
        ctx.font = '12px monospace';
        ctx.fillText('[Arrow Keys / WASD / Click] Select   •   [Enter / Space] Play Level   •   [Esc] Resume', 400, 500);
        ctx.textAlign = 'left';
    }
}

import { Constants } from "../utils/Constants.js";
import { Echo } from "../entities/Echo.js";
import { Player } from "../entities/Player.js";

export class EchoSystem {
    constructor(gameState, sounds) {
        this.state = gameState;
        this.sounds = sounds;
        
        this.isTrimming = false;
        this.trimCutoffTick = 0;
        this.maxTrimCutoff = 0;
        this.minTrimCutoff = 0;
        this.feedbackMessage = "";
        this.feedbackTimer = 0;
        this.previewPlayer = new Player(0, 0);
    }

    // Direct, instant commit on Q press
    triggerAbility() {
        if (!this.state.level || this.state.level.mechanic !== 'echo') return;

        const maxEchoes = this.state.level.maxEchoes || Constants.DEFAULT_MAX_ECHOES;
        if (this.state.echoes.length >= maxEchoes) {
            this.feedbackMessage = `ECHO BUDGET FULL (${this.state.echoes.length}/${maxEchoes}) — Press [R] to Reset`;
            this.feedbackTimer = 120;
            if (this.sounds) this.sounds.play('reset');
            return;
        }

        const historyLen = this.state.playerInputHistory.length;
        if (historyLen < 1) {
            this.feedbackMessage = "Move before committing an Echo!";
            this.feedbackTimer = 90;
            return;
        }

        // Commit Echo at current frame
        const slicedInputs = this.state.playerInputHistory.slice();
        const echoId = this.state.echoes.length + 1;
        const lifetime = this.state.level.echoLifetime || 'loop';

        const echo = new Echo(
            echoId,
            slicedInputs,
            this.state.level.playerStart.x,
            this.state.level.playerStart.y,
            lifetime
        );

        this.state.echoes.push(echo);
        this.feedbackMessage = `✓ ECHO #${echoId} COMMITTED (${this.state.echoes.length}/${maxEchoes})`;
        this.feedbackTimer = 90;
        if (this.sounds) this.sounds.play('echo_commit');
    }

    startTrim() {
        if (!this.state.level || this.state.level.mechanic !== 'echo') return;
        const maxEchoes = this.state.level.maxEchoes || Constants.DEFAULT_MAX_ECHOES;
        if (this.state.echoes.length >= maxEchoes) {
            this.feedbackMessage = `ECHO BUDGET FULL (${this.state.echoes.length}/${maxEchoes}) — Press [R] to Reset`;
            this.feedbackTimer = 120;
            if (this.sounds) this.sounds.play('reset');
            return;
        }

        const historyLen = this.state.playerInputHistory.length;
        if (historyLen < 2) return;

        this.isTrimming = true;
        this.maxTrimCutoff = historyLen - 1;
        this.minTrimCutoff = Math.max(0, this.maxTrimCutoff - Constants.TRIM_WINDOW_MAX_TICKS);
        this.trimCutoffTick = this.maxTrimCutoff;
    }

    updateTrim(input, inputManager) {
        if (input.left && this.trimCutoffTick > this.minTrimCutoff) {
            this.trimCutoffTick = Math.max(this.minTrimCutoff, this.trimCutoffTick - 2);
        }
        if (input.right && this.trimCutoffTick < this.maxTrimCutoff) {
            this.trimCutoffTick = Math.min(this.maxTrimCutoff, this.trimCutoffTick + 2);
        }

        if (input.pause) {
            this.isTrimming = false;
            return;
        }

        // Confirm commit with Space, Enter, or E
        if (inputManager && (inputManager.justPressed('jump') || inputManager.justPressed('interact') || inputManager.rawKeys['Enter'])) {
            this.commitEcho();
        }
    }

    commitEcho() {
        this.isTrimming = false;

        const slicedInputs = this.state.playerInputHistory.slice(0, this.trimCutoffTick + 1);
        const echoId = this.state.echoes.length + 1;
        const lifetime = this.state.level.echoLifetime || 'loop';

        const echo = new Echo(
            echoId,
            slicedInputs,
            this.state.level.playerStart.x,
            this.state.level.playerStart.y,
            lifetime
        );

        this.state.echoes.push(echo);
        this.feedbackMessage = `✓ ECHO #${echoId} COMMITTED (${this.state.echoes.length}/${this.state.level.maxEchoes || 1})`;
        this.feedbackTimer = 90;
        if (this.sounds) this.sounds.play('echo_commit');
    }

    update(dt) {
        if (this.feedbackTimer > 0) {
            this.feedbackTimer--;
        }

        const baseSolids = [...this.state.solids];
        for (let i = 0; i < this.state.interactables.length; i++) {
            const item = this.state.interactables[i];
            if (item.type === 'door' && !item.isOpen) {
                baseSolids.push(item);
            }
        }

        const currentSolids = [...baseSolids];

        for (let i = 0; i < this.state.echoes.length; i++) {
            const echo = this.state.echoes[i];
            echo.update(dt, currentSolids);
            currentSolids.push(echo.getAABB());
        }
    }

    render(ctx) {
        // Render committed Echoes
        for (let i = 0; i < this.state.echoes.length; i++) {
            this.state.echoes[i].render(ctx);
        }

        // Render Feedback Banner if active
        if (this.feedbackTimer > 0) {
            ctx.fillStyle = 'rgba(18, 19, 24, 0.9)';
            ctx.fillRect(200, 70, 400, 30);
            ctx.strokeStyle = this.feedbackMessage.includes('FULL') ? '#bf616a' : '#88c0d0';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(200, 70, 400, 30);

            ctx.fillStyle = this.feedbackMessage.includes('FULL') ? '#bf616a' : '#eceff4';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.feedbackMessage, 400, 90);
            ctx.textAlign = 'left';
        }

        // Render Trim Window UI if active
        if (this.isTrimming) {
            this.renderTrimUI(ctx);
        }
    }

    getPreviewPositionAtCutoff() {
        const startX = this.state.level.playerStart.x;
        const startY = this.state.level.playerStart.y;
        this.previewPlayer.reset(startX, startY);

        const baseSolids = [...this.state.solids];
        for (let i = 0; i < this.state.interactables.length; i++) {
            const item = this.state.interactables[i];
            if (item.type === 'door' && !item.isOpen) baseSolids.push(item);
        }

        const dt = Constants.TICK_DT;
        for (let t = 0; t <= this.trimCutoffTick; t++) {
            const inp = this.state.playerInputHistory[t] || { left: false, right: false, jump: false };
            this.previewPlayer.update(dt, inp, baseSolids, null);
        }
        return { x: this.previewPlayer.x, y: this.previewPlayer.y };
    }

    renderTrimUI(ctx) {
        const prevPos = this.getPreviewPositionAtCutoff();
        ctx.fillStyle = 'rgba(136, 192, 208, 0.4)';
        ctx.fillRect(prevPos.x, prevPos.y, Constants.PLAYER_WIDTH, Constants.PLAYER_HEIGHT);
        ctx.strokeStyle = '#88c0d0';
        ctx.lineWidth = 2;
        ctx.strokeRect(prevPos.x, prevPos.y, Constants.PLAYER_WIDTH, Constants.PLAYER_HEIGHT);

        ctx.fillStyle = 'rgba(18, 19, 24, 0.92)';
        ctx.fillRect(150, 40, 500, 75);
        ctx.strokeStyle = Constants.COLORS.UI_ACCENT;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(150, 40, 500, 75);

        ctx.fillStyle = '#eceff4';
        ctx.font = 'bold 15px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TRIM ECHO RECORDING (±2s Window)', 400, 65);

        ctx.font = '12px -apple-system, sans-serif';
        ctx.fillStyle = '#d8dee9';
        ctx.fillText('← / → Scrub Cutoff Point   •   [Space] / [Enter] Commit   •   [Esc] Cancel', 400, 85);

        const barX = 200;
        const barY = 95;
        const barW = 400;
        const barH = 8;
        ctx.fillStyle = '#2e3440';
        ctx.fillRect(barX, barY, barW, barH);

        const range = Math.max(1, this.maxTrimCutoff - this.minTrimCutoff);
        const progress = (this.trimCutoffTick - this.minTrimCutoff) / range;
        
        ctx.fillStyle = '#88c0d0';
        ctx.fillRect(barX, barY, barW * progress, barH);

        ctx.fillStyle = '#eceff4';
        ctx.fillRect(barX + barW * progress - 3, barY - 4, 6, barH + 8);

        ctx.textAlign = 'left';
    }
}

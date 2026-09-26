import { Constants } from "../utils/Constants.js";

export class HintSystem {
    constructor(gameState) {
        this.state = gameState;
        this.isOpen = false;
    }

    toggle() {
        this.isOpen = !this.isOpen;
    }

    revealNextStage() {
        if (!this.state.level || !this.state.level.hints) return;
        if (this.state.hintsViewedStage < 3 && this.state.hintsViewedStage < this.state.level.hints.length) {
            this.state.hintsViewedStage++;
        }
    }

    update(input) {
        if (input.hint && this.state.inputManager && this.state.inputManager.justPressed('hint')) {
            this.toggle();
        }

        // If open, space or interact reveals next stage, Esc closes
        if (this.isOpen) {
            if (this.state.inputManager && this.state.inputManager.justPressed('interact')) {
                this.revealNextStage();
            }
            if (this.state.inputManager && this.state.inputManager.justPressed('pause')) {
                this.isOpen = false;
            }
        }
    }

    render(ctx) {
        if (!this.isOpen || !this.state.level) return;

        // Modal backdrop
        ctx.fillStyle = 'rgba(11, 12, 16, 0.88)';
        ctx.fillRect(100, 100, 600, 400);
        ctx.strokeStyle = Constants.COLORS.UI_ACCENT;
        ctx.lineWidth = 2;
        ctx.strokeRect(100, 100, 600, 400);

        // Header
        ctx.fillStyle = Constants.COLORS.UI_TEXT;
        ctx.font = 'bold 20px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`HINTS: Level ${this.state.level.id}`, 400, 140);

        // Penalty Notice (§7: states hint penalty before player commits)
        ctx.font = '12px -apple-system, sans-serif';
        ctx.fillStyle = '#ebcb8b';
        ctx.fillText('⚠ NOTE: Viewing any hint caps the level score at 50% maximum.', 400, 165);

        const hints = this.state.level.hints || [];
        const currentStage = this.state.hintsViewedStage;

        for (let s = 1; s <= 3; s++) {
            const boxY = 190 + (s - 1) * 65;
            const isRevealed = (s <= currentStage);

            ctx.fillStyle = isRevealed ? '#2e3440' : '#1a1c24';
            ctx.fillRect(130, boxY, 540, 52);
            ctx.strokeStyle = isRevealed ? '#88c0d0' : '#434c5e';
            ctx.lineWidth = 1;
            ctx.strokeRect(130, boxY, 540, 52);

            ctx.textAlign = 'left';
            ctx.font = 'bold 12px monospace';
            ctx.fillStyle = isRevealed ? '#88c0d0' : '#65737e';
            const stageLabel = s === 1 ? 'STAGE 1 (Conceptual)' : (s === 2 ? 'STAGE 2 (Specific)' : 'STAGE 3 (Near-Solution)');
            ctx.fillText(`${stageLabel}:`, 145, boxY + 20);

            ctx.font = '13px -apple-system, sans-serif';
            ctx.fillStyle = isRevealed ? '#eceff4' : '#4c566a';
            const text = isRevealed ? (hints[s - 1] || 'No hint authored.') : '[ Locked — Press [E] to reveal ]';
            ctx.fillText(text, 145, boxY + 40);
        }

        // Instructions Footer
        ctx.textAlign = 'center';
        ctx.font = '13px monospace';
        ctx.fillStyle = '#d8dee9';
        if (currentStage < Math.min(3, hints.length)) {
            ctx.fillText('[E] Reveal Next Hint Stage   •   [H] / [Esc] Close', 400, 470);
        } else {
            ctx.fillText('All hint stages revealed   •   [H] / [Esc] Close', 400, 470);
        }

        ctx.textAlign = 'left';
    }
}

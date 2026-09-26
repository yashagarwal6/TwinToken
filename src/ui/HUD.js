import { Constants } from "../utils/Constants.js";

export class HUD {
    constructor(gameState) {
        this.state = gameState;
    }

    render(ctx) {
        if (!this.state.level) return;

        const level = this.state.level;
        const isEcho = level.mechanic === 'echo';

        // Top Left: Level info & Mechanic
        ctx.fillStyle = Constants.COLORS.UI_TEXT;
        ctx.font = 'bold 16px -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`LEVEL: ${level.id}`, 24, 32);

        // Mechanic Badge
        const badgeColor = isEcho ? '#5e81ac' : '#b48ead';
        const badgeText = isEcho ? 'ECHO (CLONE)' : 'RIFT (TIME)';
        
        ctx.fillStyle = badgeColor;
        ctx.fillRect(150, 18, 120, 20);
        ctx.fillStyle = '#eceff4';
        ctx.font = 'bold 11px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, 210, 32);

        // Echo budget or Rift target info
        ctx.textAlign = 'left';
        if (isEcho) {
            const used = this.state.echoes.length;
            const max = level.maxEchoes || 1;
            ctx.fillStyle = used >= max ? '#bf616a' : '#a3be8c';
            ctx.font = '13px monospace';
            ctx.fillText(`ECHO BUDGET: ${used}/${max}`, 290, 32);
        } else {
            ctx.fillStyle = '#b48ead';
            ctx.font = '13px monospace';
            const targetCount = this.state.riftObjects ? this.state.riftObjects.length : 0;
            ctx.fillText(`TARGETS: ${targetCount} ([Q] Hold to Scrub, [E] Cycle)`, 290, 32);
        }

        // Top Right: Timer & Par Time
        ctx.textAlign = 'right';
        ctx.fillStyle = Constants.COLORS.UI_TEXT;
        ctx.font = '13px monospace';
        const elapsedSec = (this.state.levelElapsedTime || 0).toFixed(1);
        const parSec = level.parTime ? level.parTime.toFixed(1) : '--';
        ctx.fillText(`TIME: ${elapsedSec}s / PAR: ${parSec}s`, Constants.CANVAS_WIDTH - 24, 32);

        // Irreversible Point-of-No-Return Warning Cue (§25 #2)
        if (level.metadata && level.metadata.isPointOfNoReturn) {
            ctx.fillStyle = Constants.COLORS.WARNING_IRREVERSIBLE;
            ctx.font = 'bold 12px -apple-system, sans-serif';
            ctx.fillText('⚠ IRREVERSIBLE CHOICE POINT — COMMIT CANNOT BE UNDONE', Constants.CANVAS_WIDTH - 24, 52);
        }

        // Goal Beacon / Gate
        if (this.state.goal) {
            const g = this.state.goal;
            // Pulsing glow
            const pulse = (Math.sin(this.state.currentTick * 0.08) + 1) * 0.5;
            ctx.fillStyle = `rgba(236, 239, 244, ${0.15 + pulse * 0.15})`;
            ctx.fillRect(g.x - 4, g.y - 4, g.width + 8, g.height + 8);

            // Goal frame
            ctx.fillStyle = '#ebcb8b';
            ctx.fillRect(g.x, g.y, g.width, g.height);
            ctx.strokeStyle = '#d08770';
            ctx.lineWidth = 2;
            ctx.strokeRect(g.x, g.y, g.width, g.height);

            // Goal text
            ctx.fillStyle = '#2e3440';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('EXIT', g.x + g.width / 2, g.y + g.height / 2 + 3);
        }

        ctx.textAlign = 'left';
    }
}

import { Constants } from "../utils/Constants.js";

export class RiftObject {
    constructor(id, x, y, width, height, rewindFloor = 0, dependsOn = null) {
        this.id = id;
        this.startX = x;
        this.startY = y;
        this.width = width;
        this.height = height;
        
        this.x = x;
        this.y = y;
        this.rewindFloor = rewindFloor; // Minimum tick/frame that can be rewound to
        this.dependsOn = dependsOn;     // Authored dependency ID (causality lever)
        
        this.isSolid = true;
        this.isScrubbing = false;
        this.hasBeenRewound = false;
        
        // History of recorded states: [ { tick, x, y, customState }, ... ]
        this.history = [];
        this.initialHistory = []; // Pre-authored history if object started in motion
    }

    setInitialHistory(history) {
        this.initialHistory = [...history];
        this.history = [...history];
        if (history.length > 0) {
            const last = history[history.length - 1];
            this.x = last.x;
            this.y = last.y;
        }
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.isScrubbing = false;
        this.hasBeenRewound = false;
        this.history = [...this.initialHistory];
        if (this.initialHistory.length > 0) {
            const last = this.initialHistory[this.initialHistory.length - 1];
            this.x = last.x;
            this.y = last.y;
        }
    }

    recordState(tick) {
        if (!this.isScrubbing) {
            this.history.push({
                tick: tick,
                x: this.x,
                y: this.y
            });
        }
    }

    // Scrub backward by N ticks down to rewindFloor
    scrubBackward(ticks = 1) {
        for (let i = 0; i < ticks; i++) {
            if (this.history.length <= 1) break;
            const top = this.history[this.history.length - 1];
            if (top.tick <= this.rewindFloor) {
                break; // Rewind floor limit reached
            }
            this.history.pop();
            this.hasBeenRewound = true;
            const prev = this.history[this.history.length - 1];
            this.x = prev.x;
            this.y = prev.y;
        }
    }

    // Normal forward simulation step (overridden by sub-types)
    updateNormal(dt, tick, gameState) {
        // Base implementation does nothing
    }

    update(dt, tick, gameState) {
        if (!this.isScrubbing) {
            this.updateNormal(dt, tick, gameState);
            this.recordState(tick);
        }
    }

    render(ctx, isSelected) {
        // Violet time-aura outline when selected (§5)
        if (isSelected) {
            ctx.strokeStyle = Constants.COLORS.RIFT_AURA;
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 3]);
            ctx.strokeRect(this.x - 3, this.y - 3, this.width + 6, this.height + 6);
            ctx.setLineDash([]);

            // Selection indicator badge
            ctx.fillStyle = Constants.COLORS.RIFT_AURA;
            ctx.font = '10px monospace';
            ctx.fillText(`[RIFT: ${this.id}]`, this.x, this.y - 6);
        }
    }
}

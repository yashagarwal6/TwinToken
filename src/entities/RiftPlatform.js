import { RiftObject } from "./RiftObject.js";
import { Constants } from "../utils/Constants.js";

export class RiftPlatform extends RiftObject {
    constructor(id, x, y, width, height, targetX, targetY, speed = 80, rewindFloor = 0, dependsOn = null) {
        super(id, x, y, width, height, rewindFloor, dependsOn);
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = speed;
        this.movingTowardsTarget = true;
    }

    reset() {
        super.reset();
        this.movingTowardsTarget = true;
    }

    updateNormal(dt, tick, gameState) {
        // Causality chain check (§5): if dependsOn is authored, check dependency condition
        if (this.dependsOn) {
            const dep = gameState.riftObjects.find(obj => obj.id === this.dependsOn);
            if (dep && !dep.hasBeenRewound) {
                return; // Blocked by causality chain until dep is rewound
            }
        }

        const prevX = this.x;
        const prevY = this.y;

        const destX = this.movingTowardsTarget ? this.targetX : this.startX;
        const destY = this.movingTowardsTarget ? this.targetY : this.startY;

        const dx = destX - this.x;
        const dy = destY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.5) {
            const step = this.speed * dt;
            if (step >= dist) {
                this.x = destX;
                this.y = destY;
                this.movingTowardsTarget = !this.movingTowardsTarget;
            } else {
                this.x += (dx / dist) * step;
                this.y += (dy / dist) * step;
            }
        } else {
            this.movingTowardsTarget = !this.movingTowardsTarget;
        }

        const deltaX = this.x - prevX;
        const deltaY = this.y - prevY;

        // Carry player if standing on top of platform
        if (gameState.player) {
            const p = gameState.player;
            // Check if player feet are resting on top surface of platform
            const onTop = (Math.abs((p.y + p.height) - prevY) <= 2) &&
                          (p.x + p.width > this.x && p.x < this.x + this.width);
            if (onTop) {
                p.x += deltaX;
                p.y += deltaY;
            }
        }

        // Carry any Echoes standing on platform
        for (let i = 0; i < gameState.echoes.length; i++) {
            const echo = gameState.echoes[i];
            const onTop = (Math.abs((echo.y + echo.height) - prevY) <= 2) &&
                          (echo.x + echo.width > this.x && echo.x < this.x + this.width);
            if (onTop) {
                echo.x += deltaX;
                echo.y += deltaY;
            }
        }
    }

    render(ctx, isSelected) {
        // Platform Body
        ctx.fillStyle = Constants.COLORS.RIFT_OBJECT;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Tech outline
        ctx.strokeStyle = '#d08770';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Internal time-glyph line
        ctx.strokeStyle = 'rgba(236, 239, 244, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x + 4, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width - 4, this.y + this.height / 2);
        ctx.stroke();

        super.render(ctx, isSelected);
    }
}

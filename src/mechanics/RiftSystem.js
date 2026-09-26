import { Constants } from "../utils/Constants.js";

export class RiftSystem {
    constructor(gameState, sounds) {
        this.state = gameState;
        this.sounds = sounds;
        this.selectedTargetIndex = 0;
        this.qHoldDuration = 0;
        this.statusMessage = "";
        this.statusTimer = 0;
    }

    cycleTarget() {
        if (!this.state.riftObjects || this.state.riftObjects.length === 0) return;
        
        const prev = this.getSelectedTarget();
        if (prev) prev.isScrubbing = false;

        this.selectedTargetIndex = (this.selectedTargetIndex + 1) % this.state.riftObjects.length;
        const newTarget = this.getSelectedTarget();
        this.statusMessage = `TARGET: ${newTarget ? newTarget.id : 'None'} (Hold [Q] to Rewind)`;
        this.statusTimer = 60;
        if (this.sounds) this.sounds.play('plate_press');
    }

    getSelectedTarget() {
        if (!this.state.riftObjects || this.state.riftObjects.length === 0) return null;
        if (this.selectedTargetIndex >= this.state.riftObjects.length) {
            this.selectedTargetIndex = 0;
        }
        return this.state.riftObjects[this.selectedTargetIndex];
    }

    update(dt, input) {
        if (!this.state.level || this.state.level.mechanic !== 'rift') return;
        if (!this.state.riftObjects || this.state.riftObjects.length === 0) return;

        if (this.statusTimer > 0) this.statusTimer--;

        // Cycle target with E (Interact)
        const interactJustPressed = (this.state.inputManager && this.state.inputManager.justPressed('interact')) || (input.interact && !this.prevSimInteract);
        this.prevSimInteract = !!input.interact;

        if (interactJustPressed) {
            this.cycleTarget();
        }

        const target = this.getSelectedTarget();

        // Check Q ability key (Scrub backward)
        if (input.ability) {
            this.qHoldDuration++;
            if (target) {
                target.isScrubbing = true;
                target.scrubBackward(Constants.RIFT_SCRUB_SPEED);
                this.statusMessage = `◄◄ REWINDING [${target.id}] (Release [Q] to Lock)`;
                this.statusTimer = 20;

                if (this.sounds && (this.state.currentTick % 4 === 0)) {
                    this.sounds.play('rift_scrub');
                }
            }
        } else {
            // Key released -> triggers the "Lock" action (§4: commit scrubbed state & resume normal simulation)
            if (this.qHoldDuration > 0) {
                if (target) {
                    this.statusMessage = `✓ LOCKED [${target.id}] — Resuming simulation`;
                    this.statusTimer = 60;
                }
                this.qHoldDuration = 0;
            }

            if (target) {
                target.isScrubbing = false;
            }
        }

        // Update all RiftObjects
        for (let i = 0; i < this.state.riftObjects.length; i++) {
            this.state.riftObjects[i].update(dt, this.state.currentTick, this.state);
        }
    }

    render(ctx) {
        if (!this.state.level || this.state.level.mechanic !== 'rift') return;

        const currentTarget = this.getSelectedTarget();

        for (let i = 0; i < this.state.riftObjects.length; i++) {
            const obj = this.state.riftObjects[i];
            const isSelected = (obj === currentTarget);
            obj.render(ctx, isSelected);

            if (isSelected && obj.isScrubbing) {
                ctx.fillStyle = Constants.COLORS.RIFT_AURA;
                ctx.font = 'bold 12px monospace';
                ctx.fillText('◄◄ REWINDING', obj.x, obj.y - 18);
            }
        }

        // Status banner
        if (this.statusTimer > 0) {
            ctx.fillStyle = 'rgba(18, 19, 24, 0.9)';
            ctx.fillRect(200, 70, 400, 28);
            ctx.strokeStyle = '#b48ead';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(200, 70, 400, 28);

            ctx.fillStyle = '#b48ead';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.statusMessage, 400, 88);
            ctx.textAlign = 'left';
        }
    }
}

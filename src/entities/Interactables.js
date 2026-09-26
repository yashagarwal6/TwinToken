import { Constants } from "../utils/Constants.js";
import { CollisionSystem } from "../core/CollisionSystem.js";

export class Plate {
    constructor(id, x, y, width = 36, height = 10) {
        this.id = id;
        this.type = 'plate';
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isPressed = false;
        this.wasPressed = false;
    }

    reset() {
        this.isPressed = false;
        this.wasPressed = false;
    }

    update(gameState, sounds = null) {
        this.wasPressed = this.isPressed;
        this.isPressed = false;

        const aabb = { x: this.x, y: this.y - 2, width: this.width, height: this.height + 2 };

        // Check if player is on plate
        if (gameState.player && CollisionSystem.check(gameState.player, aabb)) {
            this.isPressed = true;
        }

        // Check if any Echo is on plate
        if (!this.isPressed) {
            for (let i = 0; i < gameState.echoes.length; i++) {
                const echo = gameState.echoes[i];
                if (CollisionSystem.check(echo, aabb)) {
                    this.isPressed = true;
                    break;
                }
            }
        }

        if (!this.wasPressed && this.isPressed && sounds) {
            sounds.play('plate_press');
        }
    }

    render(ctx) {
        ctx.fillStyle = this.isPressed ? Constants.COLORS.PLATE_PRESSED : Constants.COLORS.PLATE_UNPRESSED;
        // Plate compresses slightly when pressed
        const renderHeight = this.isPressed ? (this.height - 3) : this.height;
        const renderY = this.isPressed ? (this.y + 3) : this.y;
        ctx.fillRect(this.x, renderY, this.width, renderHeight);

        ctx.strokeStyle = '#2e3440';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, renderY, this.width, renderHeight);
    }
}

export class ToggleSwitch {
    constructor(id, x, y, width = 20, height = 28) {
        this.id = id;
        this.type = 'switch';
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isToggled = false;
        this.hasBeenFlipped = false;
        this.wasTouched = false;
    }

    reset() {
        this.isToggled = false;
        this.hasBeenFlipped = false;
        this.wasTouched = false;
    }

    update(gameState, sounds = null) {
        const aabb = { x: this.x - 2, y: this.y - 2, width: this.width + 4, height: this.height + 4 };
        let isTouched = false;

        if (gameState.player && CollisionSystem.check(gameState.player, aabb)) {
            isTouched = true;
        }

        if (!isTouched) {
            for (let i = 0; i < gameState.echoes.length; i++) {
                if (CollisionSystem.check(gameState.echoes[i], aabb)) {
                    isTouched = true;
                    break;
                }
            }
        }

        // Toggle on entry
        if (isTouched && !this.wasTouched) {
            this.isToggled = !this.isToggled;
            this.hasBeenFlipped = true;
            if (sounds) sounds.play('plate_press');
        }

        this.wasTouched = isTouched;
    }

    render(ctx) {
        // Switch body
        ctx.fillStyle = '#2e3440';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#4c566a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Indicator LED
        ctx.fillStyle = this.isToggled ? '#a3be8c' : '#bf616a';
        ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, 8);

        // Lever position
        ctx.fillStyle = '#eceff4';
        const leverY = this.isToggled ? (this.y + 16) : (this.y + 20);
        ctx.fillRect(this.x + 6, leverY, this.width - 12, 6);
    }
}

export class Door {
    constructor(id, x, y, width = 18, height = 80, plateIds = [], inverted = false) {
        this.id = id;
        this.type = 'door';
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.plateIds = plateIds; // array of IDs required
        this.inverted = inverted; // if true, opens when conditions are NOT satisfied
        this.isOpen = false;
        this.wasOpen = false;
    }

    reset() {
        this.isOpen = false;
        this.wasOpen = false;
    }

    update(gameState, sounds = null) {
        this.wasOpen = this.isOpen;
        let allSatisfied = true;

        if (this.plateIds.length > 0) {
            for (let i = 0; i < this.plateIds.length; i++) {
                const targetId = this.plateIds[i];
                const item = gameState.interactables.find(it => it.id === targetId);
                if (item) {
                    if (item.type === 'switch') {
                        if (!item.isToggled) allSatisfied = false;
                    } else if (item.type === 'plate') {
                        if (!item.isPressed) allSatisfied = false;
                    }
                } else {
                    allSatisfied = false;
                }
                if (!allSatisfied) break;
            }
        } else {
            allSatisfied = false;
        }

        this.isOpen = this.inverted ? !allSatisfied : allSatisfied;

        if (!this.wasOpen && this.isOpen && sounds) {
            sounds.play('door_open');
        }
    }

    render(ctx) {
        if (this.isOpen) {
            // Door open: transparent ghost barrier
            ctx.fillStyle = Constants.COLORS.DOOR_OPEN;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = 'rgba(235, 203, 139, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        } else {
            // Door closed: solid barrier
            ctx.fillStyle = Constants.COLORS.DOOR_CLOSED;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#d08770';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);

            // Door hash lines
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            for (let dy = 10; dy < this.height; dy += 12) {
                ctx.beginPath();
                ctx.moveTo(this.x + 2, this.y + dy);
                ctx.lineTo(this.x + this.width - 2, this.y + dy);
                ctx.stroke();
            }
        }
    }
}

export class Hazard {
    constructor(id, x, y, width, height) {
        this.id = id;
        this.type = 'hazard';
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.absorbedByEcho = false;
    }

    reset() {
        this.absorbedByEcho = false;
    }

    update(gameState, sounds = null) {
        if (this.absorbedByEcho) return;

        // Check if player touched hazard
        if (gameState.player && CollisionSystem.check(gameState.player, this)) {
            gameState.shouldReset = true;
            if (sounds) sounds.play('reset');
            return;
        }

        // Check if an Echo stepped into hazard (sacrificial Echo per §11)
        for (let i = 0; i < gameState.echoes.length; i++) {
            const echo = gameState.echoes[i];
            if (CollisionSystem.check(echo, this)) {
                // If it's a sacrificial barrier, hazard is blocked or Echo absorbs hit
                this.absorbedByEcho = true;
                break;
            }
        }
    }

    render(ctx) {
        ctx.fillStyle = this.absorbedByEcho ? 'rgba(191, 97, 106, 0.25)' : '#bf616a';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Danger spikes styling
        if (!this.absorbedByEcho) {
            ctx.strokeStyle = '#eceff4';
            ctx.lineWidth = 1.5;
            const spikeW = 8;
            for (let sx = this.x; sx < this.x + this.width; sx += spikeW) {
                ctx.beginPath();
                ctx.moveTo(sx, this.y + this.height);
                ctx.lineTo(sx + spikeW / 2, this.y);
                ctx.lineTo(sx + spikeW, this.y + this.height);
                ctx.stroke();
            }
        }
    }
}

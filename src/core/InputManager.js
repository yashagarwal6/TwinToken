export class InputManager {
    constructor() {
        this.rawKeys = {};
        this.currentInputs = this.getEmptyInput();
        this.previousInputs = this.getEmptyInput();
        this.keyHoldTicks = {};

        window.addEventListener('keydown', (e) => {
            // Prevent scrolling on space / arrow keys
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
            this.rawKeys[e.code] = true;
            if (e.key) {
                this.rawKeys[e.key.toLowerCase()] = true;
                this.rawKeys[e.key.toUpperCase()] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.rawKeys[e.code] = false;
            if (e.key) {
                this.rawKeys[e.key.toLowerCase()] = false;
                this.rawKeys[e.key.toUpperCase()] = false;
            }
        });
    }

    getEmptyInput() {
        return {
            left: false,
            right: false,
            jump: false,
            interact: false,
            ability: false,
            restart: false,
            pause: false,
            hint: false,
            autopilot: false,
            music: false,
            up: false,
            down: false
        };
    }

    // Called once per fixed tick
    poll() {
        Object.assign(this.previousInputs, this.currentInputs);

        this.currentInputs.left = !!(this.rawKeys['KeyA'] || this.rawKeys['a'] || this.rawKeys['ArrowLeft']);
        this.currentInputs.right = !!(this.rawKeys['KeyD'] || this.rawKeys['d'] || this.rawKeys['ArrowRight']);
        this.currentInputs.up = !!(this.rawKeys['KeyW'] || this.rawKeys['w'] || this.rawKeys['ArrowUp']);
        this.currentInputs.down = !!(this.rawKeys['KeyS'] || this.rawKeys['s'] || this.rawKeys['ArrowDown']);
        this.currentInputs.jump = !!(this.rawKeys['Space'] || this.rawKeys['KeyW'] || this.rawKeys['w'] || this.rawKeys['ArrowUp']);
        this.currentInputs.interact = !!(this.rawKeys['KeyE'] || this.rawKeys['e']);
        this.currentInputs.ability = !!(this.rawKeys['KeyQ'] || this.rawKeys['q']);
        this.currentInputs.restart = !!(this.rawKeys['KeyR'] || this.rawKeys['r']);
        this.currentInputs.pause = !!this.rawKeys['Escape'];
        this.currentInputs.hint = !!(this.rawKeys['KeyH'] || this.rawKeys['h']);
        this.currentInputs.autopilot = !!(this.rawKeys['KeyP'] || this.rawKeys['p'] || this.rawKeys['P']);
        this.currentInputs.music = !!(this.rawKeys['KeyM'] || this.rawKeys['m'] || this.rawKeys['M']);

        // Track key hold duration in ticks (useful for Q tap vs hold)
        for (let key in this.currentInputs) {
            if (this.currentInputs[key]) {
                this.keyHoldTicks[key] = (this.keyHoldTicks[key] || 0) + 1;
            } else {
                this.keyHoldTicks[key] = 0;
            }
        }

        return { ...this.currentInputs };
    }

    justPressed(action) {
        return this.currentInputs[action] && !this.previousInputs[action];
    }

    justReleased(action) {
        return !this.currentInputs[action] && this.previousInputs[action];
    }

    isDown(action) {
        return !!this.currentInputs[action];
    }

    getHoldDuration(action) {
        return this.keyHoldTicks[action] || 0;
    }
}

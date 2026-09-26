import { Constants } from "../utils/Constants.js";

export class Clock {
    constructor(updateFn, renderFn, onBlurPauseFn) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        this.onBlurPauseFn = onBlurPauseFn;
        
        this.dt = Constants.TICK_DT;
        this.accumulator = 0;
        this.lastTime = 0;
        this.tickCount = 0;
        
        this.running = false;
        this.paused = false;
        this.animationFrameId = null;

        // §25 Handoff Note #5: Explicit tab-focus pause/resume behavior
        window.addEventListener('blur', () => {
            this.paused = true;
            if (this.onBlurPauseFn) this.onBlurPauseFn(true);
        });

        window.addEventListener('focus', () => {
            // When returning, reset lastTime so accumulator doesn't burst
            this.lastTime = performance.now();
        });
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    togglePause() {
        this.paused = !this.paused;
        if (!this.paused) {
            this.lastTime = performance.now();
        }
        return this.paused;
    }

    loop(time) {
        if (!this.running) return;

        let frameTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        // Prevent accumulator explosion (spiral of death) if tab freezes
        if (frameTime > Constants.MAX_ACCUMULATOR) {
            frameTime = Constants.MAX_ACCUMULATOR;
        }

        if (!this.paused) {
            this.accumulator += frameTime;

            while (this.accumulator >= this.dt) {
                this.updateFn(this.dt, this.tickCount);
                this.tickCount++;
                this.accumulator -= this.dt;
            }
        }

        this.renderFn(this.paused);

        this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
    }
}

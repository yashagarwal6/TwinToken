import { Constants } from "../utils/Constants.js";
import { CollisionSystem } from "../core/CollisionSystem.js";

export class Echo {
    constructor(id, inputs, startX, startY, lifetime = 'loop') {
        this.id = id;
        this.inputs = inputs; // Array of discrete input objects [0 .. length - 1]
        this.startX = startX;
        this.startY = startY;
        this.lifetime = lifetime; // 'loop' or 'once'
        
        this.width = Constants.PLAYER_WIDTH;
        this.height = Constants.PLAYER_HEIGHT;
        
        this.reset();
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.facing = 1;
        this.currentFrame = 0;
        this.frozen = false;
        this.coyoteCounter = 0;
        this.jumpBufferCounter = 0;
    }

    getAABB() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    // Step deterministic physics with recorded input for this frame
    update(dt, priorSolids) {
        if (this.frozen) {
            return;
        }

        // Check if playback sequence reached the end
        if (this.currentFrame >= this.inputs.length) {
            if (this.lifetime === 'once') {
                // Freeze solid in final pose
                this.frozen = true;
                return;
            } else {
                // Loop sequence
                this.reset();
            }
        }

        const input = this.inputs[this.currentFrame] || { left: false, right: false, jump: false, interact: false };
        
        // Horizontal
        let moveDir = 0;
        if (input.left) moveDir -= 1;
        if (input.right) moveDir += 1;
        if (moveDir !== 0) this.facing = moveDir;

        this.vx = moveDir * Constants.MOVE_SPEED;

        // Jump logic
        if (this.isGrounded) {
            this.coyoteCounter = Constants.COYOTE_TICKS;
        } else if (this.coyoteCounter > 0) {
            this.coyoteCounter--;
        }

        if (input.jump) {
            this.jumpBufferCounter = Constants.JUMP_BUFFER_TICKS;
        } else if (this.jumpBufferCounter > 0) {
            this.jumpBufferCounter--;
        }

        if (this.jumpBufferCounter > 0 && this.coyoteCounter > 0) {
            this.vy = -Constants.JUMP_FORCE;
            this.coyoteCounter = 0;
            this.jumpBufferCounter = 0;
            this.isGrounded = false;
        }

        // Gravity
        this.vy += Constants.GRAVITY * dt;
        if (this.vy > Constants.TERMINAL_VELOCITY) {
            this.vy = Constants.TERMINAL_VELOCITY;
        }

        this.isGrounded = false;

        // X move & collision against prior solids
        this.x += this.vx * dt;
        CollisionSystem.resolveSolids(this, priorSolids);

        // Y move & collision against prior solids
        this.y += this.vy * dt;
        CollisionSystem.resolveSolids(this, priorSolids);

        // Screen boundary clamp
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        } else if (this.x + this.width > Constants.CANVAS_WIDTH) {
            this.x = Constants.CANVAS_WIDTH - this.width;
            this.vx = 0;
        }

        this.currentFrame++;
    }

    render(ctx) {
        // Semi-transparent phantom clone styling
        ctx.fillStyle = this.frozen ? Constants.COLORS.ECHO_FROZEN : Constants.COLORS.ECHO;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Distinct outline
        ctx.strokeStyle = this.frozen ? '#81a1c1' : '#88c0d0';
        ctx.lineWidth = 1.5;
        ctx.setLineDash(this.frozen ? [] : [4, 2]);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.setLineDash([]);

        // Eye indicator
        ctx.fillStyle = '#eceff4';
        let eyeW = 5;
        let eyeH = 5;
        let eyeX = this.facing === 1 ? (this.x + this.width - eyeW - 3) : (this.x + 3);
        let eyeY = this.y + 7;
        ctx.fillRect(eyeX, eyeY, eyeW, eyeH);

        // ID tag for clarity when multiple Echoes exist
        ctx.fillStyle = 'rgba(236, 239, 244, 0.8)';
        ctx.font = '10px monospace';
        ctx.fillText(`E${this.id}`, this.x + 3, this.y - 3);
    }
}

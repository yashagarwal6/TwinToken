import { Constants } from "../utils/Constants.js";
import { CollisionSystem } from "../core/CollisionSystem.js";

export class Player {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.width = Constants.PLAYER_WIDTH;
        this.height = Constants.PLAYER_HEIGHT;
        
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.facing = 1; // 1 = right, -1 = left
        
        // Fair input tolerance buffers (no reflex punishment)
        this.coyoteCounter = 0;
        this.jumpBufferCounter = 0;
    }

    reset(x = this.startX, y = this.startY) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.isGrounded = false;
        this.facing = 1;
        this.coyoteCounter = 0;
        this.jumpBufferCounter = 0;
    }

    // Step physics with fixed dt and discrete input
    update(dt, input, solids, sounds = null) {
        // Horizontal intent
        let moveDir = 0;
        if (input.left) moveDir -= 1;
        if (input.right) moveDir += 1;

        if (moveDir !== 0) {
            this.facing = moveDir;
        }

        this.vx = moveDir * Constants.MOVE_SPEED;

        // Coyote time & Jump buffer
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

        // Execute jump if buffered and coyote valid
        if (this.jumpBufferCounter > 0 && this.coyoteCounter > 0) {
            this.vy = -Constants.JUMP_FORCE;
            this.coyoteCounter = 0;
            this.jumpBufferCounter = 0;
            this.isGrounded = false;
            if (sounds) sounds.play('jump');
        }

        // Apply gravity
        this.vy += Constants.GRAVITY * dt;
        if (this.vy > Constants.TERMINAL_VELOCITY) {
            this.vy = Constants.TERMINAL_VELOCITY;
        }

        let wasGrounded = this.isGrounded;
        this.isGrounded = false;

        // X movement & collision
        this.x += this.vx * dt;
        CollisionSystem.resolveSolids(this, solids);

        // Y movement & collision
        this.y += this.vy * dt;
        CollisionSystem.resolveSolids(this, solids);

        // Landing sound
        if (!wasGrounded && this.isGrounded && sounds) {
            sounds.play('land');
        }

        // Level bounds clamp
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        } else if (this.x + this.width > Constants.CANVAS_WIDTH) {
            this.x = Constants.CANVAS_WIDTH - this.width;
            this.vx = 0;
        }
    }

    render(ctx) {
        // Player Body
        ctx.fillStyle = Constants.COLORS.PLAYER;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Border / Accent
        ctx.strokeStyle = '#5e81ac';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Visor / Eye (shows orientation)
        ctx.fillStyle = Constants.COLORS.PLAYER_EYE;
        let eyeW = 6;
        let eyeH = 6;
        let eyeX = this.facing === 1 ? (this.x + this.width - eyeW - 3) : (this.x + 3);
        let eyeY = this.y + 7;
        ctx.fillRect(eyeX, eyeY, eyeW, eyeH);
    }
}

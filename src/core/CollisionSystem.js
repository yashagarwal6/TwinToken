import { Helpers } from "../utils/Helpers.js";

export class CollisionSystem {
    static check(a, b) {
        return Helpers.checkAABB(a, b);
    }

    // Resolves entity against a solid AABB box.
    // Entity must have { x, y, width, height, vx, vy, isGrounded }
    // Solid must have { x, y, width, height }
    static resolveEntityAgainstSolid(entity, solid) {
        if (!this.check(entity, solid)) {
            return false;
        }

        // Calculate overlaps
        let overlapLeft = (entity.x + entity.width) - solid.x;
        let overlapRight = (solid.x + solid.width) - entity.x;
        let overlapTop = (entity.y + entity.height) - solid.y;
        let overlapBottom = (solid.y + solid.height) - entity.y;

        // Find smallest separation
        let minX = overlapLeft < overlapRight ? overlapLeft : -overlapRight;
        let minY = overlapTop < overlapBottom ? overlapTop : -overlapBottom;

        let absX = Math.abs(minX);
        let absY = Math.abs(minY);

        // Platformer Landing Heuristic:
        // If falling downward and entity was mostly above the surface, prioritize vertical landing
        if (entity.vy >= 0 && overlapTop <= Math.max(16, entity.vy * 0.05 + 8) && absX > 4) {
            entity.y -= overlapTop;
            entity.vy = 0;
            entity.isGrounded = true;
            return true;
        }

        // Standard minimum penetration resolution
        if (absX < absY) {
            entity.x -= minX;
            entity.vx = 0;
        } else {
            entity.y -= minY;
            entity.vy = 0;
            if (minY > 0) {
                entity.isGrounded = true;
            }
        }
        return true;
    }

    static resolveSolids(entity, solids) {
        if (!solids || !solids.length) return;
        for (let i = 0; i < solids.length; i++) {
            this.resolveEntityAgainstSolid(entity, solids[i]);
        }
    }
}

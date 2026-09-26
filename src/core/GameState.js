export class GameState {
    constructor() {
        this.level = null;
        this.levelIndex = 0;
        this.player = null;
        
        // Entity collections
        this.solids = [];
        this.interactables = [];
        this.riftObjects = [];
        this.echoes = [];
        this.goal = null;

        // Recording & Simulation Ticks
        this.currentTick = 0;
        this.playerInputHistory = []; // [ {left, right, jump, interact, ability}, ... ]

        // Metrics for Scoring (§7)
        this.levelElapsedTime = 0;
        this.deaths = 0;
        this.hintsViewedStage = 0;
        this.autopilotUsed = false;
        
        // State Flags
        this.levelCompleted = false;
        this.shouldReset = false;
        this.reducedMotion = false; // §25 #6
        this.tabPaused = false;
    }

    // Dynamic solids array (static solids + closed doors + solid rift objects + echoes)
    getSolids() {
        const result = [...this.solids];

        // Active Rift Objects that act as solids (e.g. moving platforms)
        for (let i = 0; i < this.riftObjects.length; i++) {
            const ro = this.riftObjects[i];
            if (ro.isSolid) {
                result.push(ro);
            }
        }

        // Doors (only solid when closed)
        for (let i = 0; i < this.interactables.length; i++) {
            const item = this.interactables[i];
            if (item.type === 'door' && !item.isOpen) {
                result.push(item);
            }
        }

        // Echoes (Echoes are solid to player and each other per §4)
        for (let i = 0; i < this.echoes.length; i++) {
            const echo = this.echoes[i];
            result.push(echo.getAABB());
        }

        return result;
    }

    resetAttempt() {
        if (this.player && this.level) {
            this.player.reset(this.level.playerStart.x, this.level.playerStart.y);
        }
        this.shouldReset = false;
        this.currentTick = 0;
        this.playerInputHistory = [];
        this.echoes = []; // §4: reset clears all Echoes
        this.levelCompleted = false;
        this.deaths++;

        // Reset interactables
        for (let i = 0; i < this.interactables.length; i++) {
            this.interactables[i].reset();
        }

        // Reset Rift objects to initial state and history
        for (let i = 0; i < this.riftObjects.length; i++) {
            this.riftObjects[i].reset();
        }
    }
}

import { LevelLoader } from "./LevelLoader.js";

export class LevelManager {
    constructor(gameState, allLevels = []) {
        this.state = gameState;
        this.levels = allLevels;
        this.currentIndex = 0;
    }

    setLevels(levels) {
        this.levels = levels;
    }

    getCurrentLevel() {
        return this.levels[this.currentIndex] || null;
    }

    loadLevelByIndex(index) {
        if (index < 0 || index >= this.levels.length) {
            return false;
        }
        this.currentIndex = index;
        const levelData = this.levels[this.currentIndex];
        LevelLoader.loadLevel(this.state, levelData);
        return true;
    }

    restart() {
        this.state.resetAttempt();
    }

    nextLevel() {
        if (this.currentIndex + 1 < this.levels.length) {
            return this.loadLevelByIndex(this.currentIndex + 1);
        }
        return false; // Campaign completed
    }
}

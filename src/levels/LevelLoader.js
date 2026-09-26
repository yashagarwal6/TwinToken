import { Player } from "../entities/Player.js";
import { Plate, Door, Hazard, ToggleSwitch } from "../entities/Interactables.js";
import { RiftPlatform } from "../entities/RiftPlatform.js";
import { Helpers } from "../utils/Helpers.js";

export class LevelLoader {
    static loadLevel(gameState, levelData) {
        if (!levelData) return false;

        // Reset game state collections
        gameState.level = levelData;
        gameState.solids = [];
        gameState.interactables = [];
        gameState.riftObjects = [];
        gameState.echoes = [];
        gameState.playerInputHistory = [];
        gameState.currentTick = 0;
        gameState.levelElapsedTime = 0;
        gameState.deaths = 0;
        gameState.hintsViewedStage = 0;
        gameState.autopilotUsed = false;
        gameState.levelCompleted = false;
        gameState.shouldReset = false;

        // Player & Goal
        gameState.player = new Player(levelData.playerStart.x, levelData.playerStart.y);
        gameState.goal = {
            x: levelData.goal.x,
            y: levelData.goal.y,
            width: levelData.goal.width || 36,
            height: levelData.goal.height || 44
        };

        // Construct objects
        if (levelData.objects && Array.isArray(levelData.objects)) {
            for (let i = 0; i < levelData.objects.length; i++) {
                const def = levelData.objects[i];
                switch (def.type) {
                    case 'solid':
                        gameState.solids.push({
                            x: def.x,
                            y: def.y,
                            width: def.w,
                            height: def.h
                        });
                        break;
                    case 'plate':
                        gameState.interactables.push(new Plate(def.id, def.x, def.y, def.w, def.h));
                        break;
                    case 'switch':
                        gameState.interactables.push(new ToggleSwitch(def.id, def.x, def.y, def.w, def.h));
                        break;
                    case 'door':
                        gameState.interactables.push(new Door(def.id, def.x, def.y, def.w, def.h, def.plateIds || [], !!def.inverted));
                        break;
                    case 'hazard':
                        gameState.interactables.push(new Hazard(def.id, def.x, def.y, def.w, def.h));
                        break;
                    case 'rift_platform': {
                        let rewindFloor = 0;
                        let dependsOn = def.dependsOn || null;
                        
                        if (levelData.rewindTargets) {
                            const rt = levelData.rewindTargets.find(t => t.id === def.id);
                            if (rt) {
                                if (rt.rewindFloor !== undefined) rewindFloor = rt.rewindFloor;
                                if (rt.dependsOn !== undefined) dependsOn = rt.dependsOn;
                            }
                        }

                        const plat = new RiftPlatform(
                            def.id,
                            def.x,
                            def.y,
                            def.w,
                            def.h,
                            def.tx !== undefined ? def.tx : def.x,
                            def.ty !== undefined ? def.ty : def.y,
                            def.speed || 80,
                            rewindFloor,
                            dependsOn
                        );

                        if (def.initialHistory) {
                            plat.setInitialHistory(def.initialHistory);
                        }

                        gameState.riftObjects.push(plat);
                        break;
                    }
                }
            }
        }

        // Compute geometry hash for §25 #3 Autopilot validator
        levelData._geometryHash = Helpers.hashGeometry(levelData.objects);

        return true;
    }
}

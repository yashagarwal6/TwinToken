import { Helpers } from "../utils/Helpers.js";
import { Constants } from "../utils/Constants.js";
import { GameState } from "../core/GameState.js";
import { LevelLoader } from "./LevelLoader.js";
import { EchoSystem } from "../mechanics/EchoSystem.js";
import { RiftSystem } from "../mechanics/RiftSystem.js";

export class LevelValidator {
    // Validate a level against all static rules from §15, §6, and §25
    static validateLevel(levelData) {
        const issues = [];

        // 1. Mechanic Purity Check (§6)
        if (levelData.mechanic === 'echo') {
            if (levelData.rewindTargets && levelData.rewindTargets.length > 0) {
                issues.push(`Purity violation: ECHO level ${levelData.id} contains rewindTargets.`);
            }
            const hasRiftObj = (levelData.objects || []).some(o => o.type === 'rift_platform');
            if (hasRiftObj) {
                issues.push(`Purity violation: ECHO level ${levelData.id} contains rift_platform object.`);
            }
        } else if (levelData.mechanic === 'rift') {
            if (levelData.maxEchoes && levelData.maxEchoes > 0) {
                issues.push(`Purity violation: RIFT level ${levelData.id} has maxEchoes > 0.`);
            }
        } else {
            issues.push(`Invalid mechanic "${levelData.mechanic}" on level ${levelData.id}. Must be "echo" or "rift".`);
        }

        // 2. Boundary and Goal Sanity Check
        if (!levelData.playerStart || levelData.playerStart.x < 0 || levelData.playerStart.x > Constants.CANVAS_WIDTH) {
            issues.push(`Player start position out of bounds on level ${levelData.id}.`);
        }
        if (!levelData.goal || levelData.goal.x < 0 || levelData.goal.x > Constants.CANVAS_WIDTH) {
            issues.push(`Goal position out of bounds on level ${levelData.id}.`);
        }

        // 3. Hints Sanity Check (§8)
        if (!levelData.hints || levelData.hints.length < 3) {
            issues.push(`Level ${levelData.id} must have at least 3 stages of hints.`);
        }

        // 4. Autopilot Geometry Validation (§25 #3)
        const currentHash = Helpers.hashGeometry(levelData.objects || []);
        if (levelData._autopilotGeoHash !== undefined && levelData._autopilotGeoHash !== currentHash) {
            issues.push(`STALE AUTOPILOT WARNING: Geometry changed for level ${levelData.id} since autopilot was captured!`);
        }

        return {
            valid: issues.length === 0,
            issues: issues,
            currentHash: currentHash
        };
    }

    // Solvability check via headless deterministic simulation of autopilotReplay
    static testAutopilotSolvability(levelData) {
        if (!levelData.autopilotReplay || levelData.autopilotReplay.length === 0) {
            return { tested: false, solved: false, reason: "No autopilot replay recorded yet." };
        }

        const state = new GameState();
        LevelLoader.loadLevel(state, levelData);
        const echoSystem = new EchoSystem(state, null);
        const riftSystem = new RiftSystem(state, null);
        const dt = Constants.TICK_DT;

        let goalReached = false;

        for (let t = 0; t < levelData.autopilotReplay.length; t++) {
            state.currentTick = t;
            const input = levelData.autopilotReplay[t] || { left: false, right: false, jump: false, interact: false, ability: false };

            // Echo mechanics
            if (levelData.mechanic === 'echo') {
                if (input.ability && state.echoes.length < (levelData.maxEchoes || 1)) {
                    // Headless commit at current tick
                    const echo = new (state.echoes.constructor)(
                        state.echoes.length + 1,
                        state.playerInputHistory.slice(),
                        levelData.playerStart.x,
                        levelData.playerStart.y,
                        levelData.echoLifetime || 'loop'
                    );
                    state.echoes.push(echo);
                }
                echoSystem.update(dt);
            }

            // Rift mechanics
            if (levelData.mechanic === 'rift') {
                riftSystem.update(dt, input);
            }

            // Update interactables (plates, doors, hazards)
            for (let i = 0; i < state.interactables.length; i++) {
                state.interactables[i].update(state, null);
            }

            // Player physics update
            const solids = state.getSolids();
            state.player.update(dt, input, solids, null);
            state.playerInputHistory.push({ ...input });

            // Check goal
            if (Helpers.checkAABB(state.player, state.goal)) {
                goalReached = true;
                break;
            }

            if (state.shouldReset) {
                return { tested: true, solved: false, reason: `Attempt caused level failure/reset at tick ${t}` };
            }
        }

        return {
            tested: true,
            solved: goalReached,
            ticks: levelData.autopilotReplay.length
        };
    }
}

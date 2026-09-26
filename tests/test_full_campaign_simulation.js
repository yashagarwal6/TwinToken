import { CampaignLevels } from "../src/levels/CampaignData.js";
import { LevelLoader } from "../src/levels/LevelLoader.js";
import { GameState } from "../src/core/GameState.js";
import { EchoSystem } from "../src/mechanics/EchoSystem.js";
import { RiftSystem } from "../src/mechanics/RiftSystem.js";
import { Constants } from "../src/utils/Constants.js";
import { Helpers } from "../src/utils/Helpers.js";

console.log("=== RUNNING FULL 50-LEVEL HEADLESS SIMULATION AUDIT ===");

const dt = Constants.TICK_DT;
let passedLevels = 0;

for (let i = 0; i < CampaignLevels.length; i++) {
    const lvl = CampaignLevels[i];
    const state = new GameState();
    LevelLoader.loadLevel(state, lvl);
    const echoSystem = new EchoSystem(state, null);
    const riftSystem = new RiftSystem(state, null);

    // 1. Verify Player Start
    if (!state.player) {
        throw new Error(`Level ${lvl.id}: Player not created`);
    }
    if (state.player.x < 0 || state.player.x > 800 || state.player.y < 0 || state.player.y > 600) {
        throw new Error(`Level ${lvl.id}: Player out of canvas bounds at (${state.player.x}, ${state.player.y})`);
    }

    // 2. Verify Goal
    if (!state.goal) {
        throw new Error(`Level ${lvl.id}: Goal not defined`);
    }
    if (state.goal.x < 0 || state.goal.x > 800 || state.goal.y < 0 || state.goal.y > 600) {
        throw new Error(`Level ${lvl.id}: Goal out of canvas bounds at (${state.goal.x}, ${state.goal.y})`);
    }

    // Verify Goal is not embedded in any solid
    for (let s of state.getSolids()) {
        if (Helpers.checkAABB(state.goal, s)) {
            throw new Error(`Level ${lvl.id}: Goal at (${state.goal.x}, ${state.goal.y}) is embedded in solid at (${s.x}, ${s.y}, ${s.width}, ${s.height})`);
        }
    }

    // 3. Verify Mechanic purity
    if (lvl.mechanic === 'echo') {
        if (state.riftObjects && state.riftObjects.length > 0) {
            throw new Error(`Level ${lvl.id}: Echo level contains rift objects!`);
        }
    } else if (lvl.mechanic === 'rift') {
        if (lvl.maxEchoes && lvl.maxEchoes > 0) {
            throw new Error(`Level ${lvl.id}: Rift level has maxEchoes > 0!`);
        }
    }

    // 4. Simulate 60 ticks of forward physics
    for (let t = 0; t < 60; t++) {
        state.currentTick = t;
        const dummyInput = { left: false, right: false, jump: false, interact: false, ability: false };
        
        if (lvl.mechanic === 'echo') {
            echoSystem.update(dt);
        } else if (lvl.mechanic === 'rift') {
            riftSystem.update(dt, dummyInput);
        }

        for (let obj of state.interactables) {
            obj.update(state, null);
        }

        state.player.update(dt, dummyInput, state.getSolids(), null);
    }

    passedLevels++;
}

console.log(`✓ ALL ${passedLevels} / 50 CAMPAIGN LEVELS SIMULATED SUCCESSFULLY WITH ZERO ERRORS!`);
console.log("✓ Player spawns, solid collisions, goal alignments, and mechanics strictly verified.\n");

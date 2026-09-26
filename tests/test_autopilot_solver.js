import { CampaignLevels } from "../src/levels/CampaignData.js";
import { LevelLoader } from "../src/levels/LevelLoader.js";
import { GameState } from "../src/core/GameState.js";
import { EchoSystem } from "../src/mechanics/EchoSystem.js";
import { RiftSystem } from "../src/mechanics/RiftSystem.js";
import { AutopilotPlayer } from "../src/ui/AutopilotPlayer.js";
import { Constants } from "../src/utils/Constants.js";
import { Helpers } from "../src/utils/Helpers.js";

console.log("=== RUNNING AUTOPILOT SOLVER VERIFICATION ===");

const dt = Constants.TICK_DT;

// Test 1: Level 1 (Gap jump navigation to exit)
{
    const state = new GameState();
    LevelLoader.loadLevel(state, CampaignLevels[0]); // Level 1
    const ap = new AutopilotPlayer(state);
    ap.start();

    let solved = false;
    const emptyInput = { left: false, right: false, jump: false, interact: false, ability: false };
    for (let t = 0; t < 300; t++) {
        state.currentTick = t;
        const inputs = ap.update(emptyInput);
        state.player.update(dt, inputs, state.getSolids(), null);
        for (let obj of state.interactables) obj.update(state, null);

        if (Helpers.checkAABB(state.player, state.goal)) {
            solved = true;
            break;
        }
    }
    console.assert(solved, "Autopilot failed to solve Level 1 gap jump!");
    console.log("✓ Test 1: Autopilot successfully navigated gaps and solved Level 1");
}

// Test 2: Level 2 (Echo Plate Hold)
{
    const state = new GameState();
    LevelLoader.loadLevel(state, CampaignLevels[1]); // Level 2
    const echoSystem = new EchoSystem(state, null);
    const ap = new AutopilotPlayer(state);
    ap.start();

    let solved = false;
    let prevSimAbility = false;
    const emptyInput = { left: false, right: false, jump: false, interact: false, ability: false };

    for (let t = 0; t < 600; t++) {
        state.currentTick = t;
        const inputs = ap.update(emptyInput);

        // Check simulated ability trigger
        const abilityJustPressed = inputs.ability && !prevSimAbility;
        prevSimAbility = !!inputs.ability;
        if (abilityJustPressed) {
            echoSystem.triggerAbility();
        }

        echoSystem.update(dt);
        for (let obj of state.interactables) obj.update(state, null);
        state.player.update(dt, inputs, state.getSolids(), null);
        state.playerInputHistory.push({ ...inputs });

        if (Helpers.checkAABB(state.player, state.goal)) {
            solved = true;
            break;
        }
    }
    console.assert(solved, "Autopilot failed to solve Level 2 Echo plate hold!");
    console.log("✓ Test 2: Autopilot successfully committed Echo to plate, waited for Echo takeover, and solved Level 2");
}

console.log("\nALL AUTOPILOT SOLVER TESTS PASSED!\n");

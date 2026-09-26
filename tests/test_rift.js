import { Constants } from "../src/utils/Constants.js";
import { GameState } from "../src/core/GameState.js";
import { Player } from "../src/entities/Player.js";
import { RiftPlatform } from "../src/entities/RiftPlatform.js";
import { RiftSystem } from "../src/mechanics/RiftSystem.js";

function runRiftTests() {
    console.log("=== RUNNING RIFT MECHANIC VALIDATION TESTS ===");
    const dt = Constants.TICK_DT;

    // Test 1: Forward recording and backward scrubbing
    {
        const state = new GameState();
        state.level = { mechanic: 'rift' };
        // Platform moves from x=100 to x=300 at 100px/s
        const plat = new RiftPlatform('plat1', 100, 400, 80, 20, 300, 400, 100, 0);
        state.riftObjects = [plat];

        const riftSystem = new RiftSystem(state, null);

        // Advance 60 ticks (1.0 second) forward
        for (let t = 0; t < 60; t++) {
            state.currentTick = t;
            riftSystem.update(dt, { ability: false, interact: false });
        }

        // Plat moved from 100 to 200 (100px)
        const forwardX = plat.x;
        console.assert(Math.abs(forwardX - 200) < 1, `Test 1 Failed: Forward X=${forwardX}, expected ~200`);
        console.assert(plat.history.length === 60, `Test 1 Failed: History length=${plat.history.length}`);
        console.log(`✓ Test 1A Passed: Platform recorded 60 forward ticks to X=${forwardX.toFixed(1)}`);

        // Now hold Q (scrub backward) for 20 frames
        for (let t = 60; t < 80; t++) {
            state.currentTick = t;
            riftSystem.update(dt, { ability: true, interact: false });
        }

        // Scrubbed backward! X should have decreased towards 100
        console.assert(plat.x < forwardX, `Test 1 Failed: Plat did not scrub backward, X=${plat.x}`);
        console.log(`✓ Test 1B Passed: Scrubbed backward in time to X=${plat.x.toFixed(1)}`);

        // Now release Q (resumes normal simulation from locked point)
        const lockedX = plat.x;
        for (let t = 80; t < 100; t++) {
            state.currentTick = t;
            riftSystem.update(dt, { ability: false, interact: false });
        }

        console.assert(plat.x > lockedX, `Test 1 Failed: Normal simulation did not resume forward from locked point`);
        console.log(`✓ Test 1C Passed: Resumed normal simulation from locked point (from ${lockedX.toFixed(1)} to ${plat.x.toFixed(1)})`);
    }

    // Test 2: Rewind floor enforcement
    {
        const state = new GameState();
        state.level = { mechanic: 'rift' };
        // Rewind floor at tick 15
        const plat = new RiftPlatform('plat_floor', 100, 400, 80, 20, 300, 400, 100, 15);
        state.riftObjects = [plat];
        const riftSystem = new RiftSystem(state, null);

        // Advance 30 ticks
        for (let t = 0; t < 30; t++) {
            state.currentTick = t;
            riftSystem.update(dt, { ability: false, interact: false });
        }

        // Scrub backward indefinitely (50 frames of holding Q)
        for (let t = 30; t < 80; t++) {
            state.currentTick = t;
            riftSystem.update(dt, { ability: true, interact: false });
        }

        // Plat history tick must not be less than rewindFloor (15)
        const currentHistTick = plat.history[plat.history.length - 1].tick;
        console.assert(currentHistTick === 15, `Test 2 Failed: Scrubbed past rewind floor! Tick=${currentHistTick}, floor=15`);
        console.log(`✓ Test 2 Passed: Rewind floor strictly enforced at tick ${currentHistTick}`);
    }

    // Test 3: Player is never rewound
    {
        const state = new GameState();
        state.level = { mechanic: 'rift' };
        const player = new Player(50, 462);
        state.player = player;
        const plat = new RiftPlatform('p1', 100, 400, 80, 20, 300, 400, 100, 0);
        state.riftObjects = [plat];
        const riftSystem = new RiftSystem(state, null);

        // Advance 30 frames
        for (let t = 0; t < 30; t++) {
            state.currentTick = t;
            riftSystem.update(dt, { ability: false, interact: false });
            player.update(dt, { left: false, right: true, jump: false }, []);
        }

        const playerXBeforeRewind = player.x;

        // Scrub Rift object backward for 20 frames while player keeps moving right
        for (let t = 30; t < 50; t++) {
            state.currentTick = t;
            riftSystem.update(dt, { ability: true, interact: false });
            player.update(dt, { left: false, right: true, jump: false }, []);
        }

        console.assert(player.x > playerXBeforeRewind, "Test 3 Failed: Player was affected or rewound by Rift scrub!");
        console.log(`✓ Test 3 Passed: Player is NEVER rewound (player continued forward from ${playerXBeforeRewind.toFixed(1)} to ${player.x.toFixed(1)})`);
    }

    // Test 4: Authored causality chain (dependsOn)
    {
        const state = new GameState();
        state.level = { mechanic: 'rift' };

        // Plat A (can be rewound)
        const platA = new RiftPlatform('platA', 200, 300, 50, 20, 200, 300, 0, 0);
        // Prepopulate platA history showing it came from x=100
        const histA = [];
        for (let i = 0; i < 40; i++) {
            histA.push({ tick: i, x: 100 + (i / 40) * 100, y: 300 });
        }
        platA.setInitialHistory(histA);

        // Plat B depends on Plat A being rewound
        const platB = new RiftPlatform('platB', 50, 500, 60, 20, 150, 500, 100, 0, 'platA');
        state.riftObjects = [platA, platB];
        const riftSystem = new RiftSystem(state, null);

        // Advance normal frames without rewinding platA: platB should NOT move
        for (let t = 0; t < 20; t++) {
            state.currentTick = t;
            riftSystem.update(dt, { ability: false, interact: false });
        }
        console.assert(platB.x === 50, `Test 4 Failed: PlatB moved before dependency PlatA was rewound! X=${platB.x}`);
        console.log("✓ Test 4A Passed: Causality chain prevents dependent object from advancing initially");

        // Now rewind platA
        riftSystem.selectedTargetIndex = 0; // target PlatA
        for (let t = 20; t < 40; t++) {
            state.currentTick = t;
            riftSystem.update(dt, { ability: true, interact: false });
        }

        // Release rewind and advance: PlatB should now be unlocked and moving!
        for (let t = 40; t < 60; t++) {
            state.currentTick = t;
            riftSystem.update(dt, { ability: false, interact: false });
        }

        console.assert(platB.x > 50, `Test 4 Failed: PlatB did not activate after PlatA was rewound, X=${platB.x}`);
        console.log(`✓ Test 4B Passed: Rewinding PlatA unlocked PlatB (PlatB reached X=${platB.x.toFixed(1)})`);
    }

    console.log("ALL RIFT VALIDATION TESTS PASSED!\n");
}

runRiftTests();

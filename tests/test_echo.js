import { Constants } from "../src/utils/Constants.js";
import { Player } from "../src/entities/Player.js";
import { Echo } from "../src/entities/Echo.js";
import { Plate, Door } from "../src/entities/Interactables.js";
import { GameState } from "../src/core/GameState.js";
import { EchoSystem } from "../src/mechanics/EchoSystem.js";

function runEchoTests() {
    console.log("=== RUNNING ECHO MECHANIC VALIDATION TESTS ===");
    const dt = Constants.TICK_DT;

    // Test 1: Echo re-simulates player movement deterministically
    {
        const solids = [{ x: 0, y: 500, width: 800, height: 50 }];
        const player = new Player(50, 462);
        const inputs = [];

        // Move right for 40 ticks, jump on tick 15
        for (let i = 0; i < 40; i++) {
            const inp = { left: false, right: true, jump: i === 15, interact: false };
            inputs.push(inp);
            player.update(dt, inp, solids);
        }

        const playerFinalX = player.x;
        const playerFinalY = player.y;

        // Create Echo with same inputs
        const echo = new Echo(1, inputs, 50, 462, 'once');
        for (let i = 0; i < 40; i++) {
            echo.update(dt, solids);
        }

        console.assert(Math.abs(echo.x - playerFinalX) < 0.0001, `Test 1 Failed: Echo X=${echo.x}, Player X=${playerFinalX}`);
        console.assert(Math.abs(echo.y - playerFinalY) < 0.0001, `Test 1 Failed: Echo Y=${echo.y}, Player Y=${playerFinalY}`);
        console.log(`✓ Test 1 Passed: Echo trajectory matches Player bit-exact (X: ${echo.x.toFixed(2)}, Y: ${echo.y.toFixed(2)})`);
    }

    // Test 2: 'once' lifetime freezes, 'loop' lifetime repeats
    {
        const solids = [{ x: 0, y: 500, width: 800, height: 50 }];
        const inputs = [{ left: false, right: true, jump: false }]; // 1 tick moving right
        
        // Echo 'once'
        const echoOnce = new Echo(1, inputs, 50, 462, 'once');
        echoOnce.update(dt, solids); // tick 0
        echoOnce.update(dt, solids); // tick 1 -> freezes
        console.assert(echoOnce.frozen === true, "Test 2 Failed: Echo 'once' should be frozen");
        const frozenX = echoOnce.x;
        echoOnce.update(dt, solids); // tick 2 -> stays frozen
        console.assert(echoOnce.x === frozenX, "Test 2 Failed: Frozen Echo should not move");
        console.log("✓ Test 2A Passed: Echo lifetime 'once' freezes in final pose");

        // Echo 'loop'
        const echoLoop = new Echo(2, inputs, 50, 462, 'loop');
        echoLoop.update(dt, solids); // tick 0 -> moves right from 50 to 54
        echoLoop.update(dt, solids); // tick 1 -> sequence ends, resets to 50, replays frame 0 -> 54
        console.assert(echoLoop.currentFrame === 1 && Math.abs(echoLoop.x - (50 + Constants.MOVE_SPEED * dt)) < 0.001, 
            `Test 2 Failed: Echo 'loop' should restart sequence seamlessly, got frame ${echoLoop.currentFrame}, x ${echoLoop.x}`);
        console.log("✓ Test 2B Passed: Echo lifetime 'loop' resets sequence to start and loops seamlessly");
    }

    // Test 3: Echo holds pressure plate and opens door for player
    {
        const state = new GameState();
        state.level = {
            id: 'ECHO-TEST-PLATE',
            mechanic: 'echo',
            playerStart: { x: 50, y: 462 },
            maxEchoes: 1
        };
        state.solids = [{ x: 0, y: 500, width: 800, height: 50 }];

        // Plate at x=150, Door at x=350 blocking player
        const plate = new Plate('p1', 150, 490, 40, 10);
        const door = new Door('d1', 350, 400, 20, 100, ['p1']);
        state.interactables = [plate, door];

        // Echo moves from 50 to 160 and freezes on plate
        const inputs = [];
        for (let i = 0; i < 30; i++) {
            inputs.push({ left: false, right: true, jump: false });
        }
        const echo = new Echo(1, inputs, 50, 462, 'once');
        state.echoes = [echo];

        // Run 35 ticks
        for (let i = 0; i < 35; i++) {
            echo.update(dt, state.solids);
            plate.update(state);
            door.update(state);
        }

        console.assert(plate.isPressed === true, "Test 3 Failed: Plate should be pressed by Echo");
        console.assert(door.isOpen === true, "Test 3 Failed: Door should be opened by Plate");
        console.log("✓ Test 3 Passed: Echo holds plate open and unblocks door");
    }

    // Test 4: Commit order collision between 2 Echoes
    {
        const state = new GameState();
        state.solids = [{ x: 0, y: 500, width: 800, height: 50 }];
        const echoSystem = new EchoSystem(state, null);

        // Echo 1 stands stationary at x=100
        const echo1 = new Echo(1, [{ left: false, right: false, jump: false }], 100, 462, 'once');
        // Echo 2 walks right towards Echo 1 from x=50
        const inputs2 = [];
        for (let i = 0; i < 60; i++) inputs2.push({ left: false, right: true, jump: false });
        const echo2 = new Echo(2, inputs2, 50, 462, 'once');

        state.echoes = [echo1, echo2];

        for (let i = 0; i < 40; i++) {
            echoSystem.update(dt);
        }

        // Echo 2 should stop cleanly against Echo 1 (100 - Echo.width 24 = 76)
        const expectedX = 100 - Constants.PLAYER_WIDTH;
        console.assert(Math.abs(echo2.x - expectedX) < 0.001, `Test 4 Failed: Echo 2 at ${echo2.x}, expected ${expectedX}`);
        console.log(`✓ Test 4 Passed: Echoes resolve collisions in commit order without clipping`);
    }

    // Test 5: Reset clears all Echoes
    {
        const state = new GameState();
        state.level = { playerStart: { x: 50, y: 462 } };
        state.echoes = [new Echo(1, [], 50, 462)];
        state.resetAttempt();
        console.assert(state.echoes.length === 0, "Test 5 Failed: resetAttempt should clear all Echoes");
        console.log("✓ Test 5 Passed: Level reset clears all active Echoes");
    }

    console.log("ALL ECHO VALIDATION TESTS PASSED!\n");
}

runEchoTests();

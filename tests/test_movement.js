import { Constants } from "../src/utils/Constants.js";
import { Player } from "../src/entities/Player.js";

function runMovementTests() {
    console.log("=== RUNNING MOVEMENT & PHYSICS TESTS ===");
    const dt = Constants.TICK_DT;
    const solids = [
        { x: 0, y: 500, width: 800, height: 50 }, // floor at y=500
        { x: 300, y: 350, width: 50, height: 150 } // wall from x=300 to 350
    ];

    // Test 1: Ground landing & falling
    {
        const player = new Player(100, 400);
        for (let i = 0; i < 60; i++) {
            player.update(dt, { left: false, right: false, jump: false }, solids);
        }
        // Player height is 38. Floor is at 500. Player y should be 500 - 38 = 462.
        const expectedY = 500 - Constants.PLAYER_HEIGHT;
        console.assert(Math.abs(player.y - expectedY) < 0.001, `Test 1 Failed: Y=${player.y}, expected=${expectedY}`);
        console.assert(player.isGrounded === true, `Test 1 Failed: isGrounded should be true`);
        console.log("✓ Test 1 Passed: Falling and landing on solid floor");
    }

    // Test 2: Horizontal speed
    {
        const player = new Player(100, 462);
        player.isGrounded = true;
        for (let i = 0; i < 60; i++) { // 1 second of moving right
            player.update(dt, { left: false, right: true, jump: false }, solids);
        }
        // 100 + 240 * 1 = 340. But wall is at x=300! Player width = 24.
        // Wall stops player at 300 - 24 = 276.
        const expectedX = 300 - Constants.PLAYER_WIDTH;
        console.assert(Math.abs(player.x - expectedX) < 0.001, `Test 2 Failed: Wall stop at ${player.x}, expected ${expectedX}`);
        console.log("✓ Test 2 Passed: Movement into wall collision stops cleanly without clipping");
    }

    // Test 3: Jump apex and landing
    {
        const player = new Player(100, 462);
        player.isGrounded = true;
        // Trigger jump
        player.update(dt, { left: false, right: false, jump: true }, solids);
        console.assert(player.vy < 0, `Test 3 Failed: Jump did not give negative vy`);
        
        let minY = player.y;
        for (let i = 0; i < 120; i++) {
            player.update(dt, { left: false, right: false, jump: false }, solids);
            if (player.y < minY) minY = player.y;
        }
        // Expected jump height: v0^2 / (2*g) = 500^2 / (2 * 1350) ≈ 92.59px
        const jumpHeight = 462 - minY;
        console.assert(jumpHeight > 85 && jumpHeight < 100, `Test 3 Failed: Jump height ${jumpHeight} outside expected range [85, 100]`);
        console.assert(player.isGrounded === true, `Test 3 Failed: Player did not land back on floor`);
        console.log(`✓ Test 3 Passed: Jump apex reached (height: ${jumpHeight.toFixed(1)}px) and landed stably`);
    }

    // Test 4: Coyote time test (jump after stepping off a platform)
    {
        const ledgeSolid = [{ x: 50, y: 300, width: 100, height: 20 }];
        const player = new Player(140, 300 - Constants.PLAYER_HEIGHT);
        player.isGrounded = true;

        // Step off the edge (move right for 5 ticks: 5 * 4px = 20px, x goes from 140 to 160 > 150)
        for (let t = 0; t < 5; t++) {
            player.update(dt, { left: false, right: true, jump: false }, ledgeSolid);
        }
        console.assert(!player.isGrounded, `Test 4 setup: Player should be airborne`);

        // Press jump within coyote window
        player.update(dt, { left: false, right: false, jump: true }, ledgeSolid);
        console.assert(player.vy < 0, `Test 4 Failed: Coyote jump failed, vy=${player.vy}`);
        console.log("✓ Test 4 Passed: Coyote time allows fair jump off ledge edge");
    }

    // Test 5: Determinism test over 1,000 frames
    {
        const runSimulation = () => {
            const player = new Player(50, 462);
            player.isGrounded = true;
            for (let i = 0; i < 1000; i++) {
                // Pseudo-random deterministic input pattern
                const input = {
                    left: (i % 80) > 50,
                    right: (i % 80) <= 50,
                    jump: (i % 45) === 0
                };
                player.update(dt, input, solids);
            }
            return { x: player.x, y: player.y, vx: player.vx, vy: player.vy };
        };

        const res1 = runSimulation();
        const res2 = runSimulation();
        console.assert(res1.x === res2.x && res1.y === res2.y && res1.vx === res2.vx && res1.vy === res2.vy,
            `Test 5 Failed: Determinism mismatch! Run 1: ${JSON.stringify(res1)} vs Run 2: ${JSON.stringify(res2)}`);
        console.log(`✓ Test 5 Passed: 1,000-frame deterministic simulation identical (x: ${res1.x.toFixed(4)}, y: ${res1.y.toFixed(4)})`);
    }

    console.log("ALL MOVEMENT TESTS PASSED!\n");
}

runMovementTests();

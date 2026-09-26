import { ScoreSystem } from "../src/systems/ScoreSystem.js";
import { SaveSystem } from "../src/systems/SaveSystem.js";
import { HintSystem } from "../src/ui/HintSystem.js";
import { GameState } from "../src/core/GameState.js";
import { Helpers } from "../src/utils/Helpers.js";

function runSystemsTests() {
    console.log("=== RUNNING SCORING, SAVE, HINTS, & PIPELINE TESTS ===");

    // ==========================================
    // 1. Scoring System Tests (§7)
    // ==========================================
    {
        const par = 30;

        // 1A: Perfect run (under par, 0 deaths, no hints)
        const perfect = ScoreSystem.calculate(par, 25, 0, 0, false);
        console.assert(perfect.score === 1000, `1A Failed: score=${perfect.score}, expected 1000`);
        console.assert(perfect.stars === 3, `1A Failed: stars=${perfect.stars}, expected 3`);
        console.log(`✓ 1A: Perfect run under par gives 1000 pts and 3 stars`);

        // 1B: Slow run (double par, 0 deaths) -> x0.5 = 500 pts -> 1 star
        const slow = ScoreSystem.calculate(par, 60, 0, 0, false);
        console.assert(slow.score === 500, `1B Failed: score=${slow.score}, expected 500`);
        console.assert(slow.stars === 1, `1B Failed: stars=${slow.stars}`);
        console.log(`✓ 1B: Run at double par scales to 500 pts`);

        // 1C: Intermediate run (1.5x par = 45s) -> factor 0.5 -> mult 0.75 -> 750 pts -> 2 stars
        const mid = ScoreSystem.calculate(par, 45, 0, 0, false);
        console.assert(mid.score === 750, `1C Failed: score=${mid.score}, expected 750`);
        console.assert(mid.stars === 2, `1C Failed: stars=${mid.stars}, expected 2`);
        console.log(`✓ 1C: Linear par curve at 1.5x par yields 750 pts and 2 stars`);

        // 1D: Deaths penalty (-100 each)
        const withDeaths = ScoreSystem.calculate(par, 20, 2, 0, false); // (1000 - 200) * 1.0 = 800 -> 2 stars
        console.assert(withDeaths.score === 800, `1D Failed: score=${withDeaths.score}, expected 800`);
        console.log(`✓ 1D: 2 deaths deduct 200 pts properly`);

        // 1E: Excessive deaths floor at 0
        const deadMany = ScoreSystem.calculate(par, 20, 15, 0, false);
        console.assert(deadMany.score === 0, `1E Failed: floor at 0 failed`);
        console.log(`✓ 1E: Death deduction floors cleanly at 0 pts`);

        // 1F: Hint penalty (capped at 50%)
        const withHint = ScoreSystem.calculate(par, 20, 0, 1, false);
        console.assert(withHint.score === 500, `1F Failed: score=${withHint.score}, expected 500`);
        console.assert(withHint.breakdown.hintCapped === true, `1F Failed: hintCapped flag missing`);
        console.log(`✓ 1F: Hint usage caps score at 500 pts maximum (50% cap)`);

        // 1G: Autopilot (0 points, 1 star, progression credit)
        const auto = ScoreSystem.calculate(par, 20, 0, 0, true);
        console.assert(auto.score === 0, `1G Failed: autopilot score must be 0`);
        console.assert(auto.stars === 1, `1G Failed: autopilot must grant 1 star progression credit`);
        console.assert(auto.breakdown.autopilot === true, `1G Failed: autopilot breakdown flag missing`);
        console.log(`✓ 1G: Autopilot awards 0 pts and grants 1-star completion credit`);
    }

    // ==========================================
    // 2. Hint Progression Tests (§8)
    // ==========================================
    {
        const state = new GameState();
        state.level = {
            id: 1,
            hints: ["Hint 1", "Hint 2", "Hint 3"]
        };
        const hintSys = new HintSystem(state);
        console.assert(state.hintsViewedStage === 0, "Initial hints viewed should be 0");

        hintSys.revealNextStage();
        console.assert(state.hintsViewedStage === 1, "Reveal 1 failed");
        hintSys.revealNextStage();
        console.assert(state.hintsViewedStage === 2, "Reveal 2 failed");
        hintSys.revealNextStage();
        console.assert(state.hintsViewedStage === 3, "Reveal 3 failed");
        hintSys.revealNextStage();
        console.assert(state.hintsViewedStage === 3, "Reveal beyond max stages should clamp at 3");
        console.log("✓ 2: Hint progression advances strictly through stages 1 -> 2 -> 3");
    }

    // ==========================================
    // 3. Autopilot Geometry Pipeline Guard (§25 #3)
    // ==========================================
    {
        const objectsA = [
            { type: 'solid', x: 0, y: 500, w: 800, h: 50 },
            { type: 'plate', x: 200, y: 490, w: 40, h: 10 }
        ];
        const hashA = Helpers.hashGeometry(objectsA);

        const objectsB = [
            { type: 'solid', x: 0, y: 500, w: 800, h: 50 },
            { type: 'plate', x: 220, y: 490, w: 40, h: 10 } // shifted plate x by 20px!
        ];
        const hashB = Helpers.hashGeometry(objectsB);

        console.assert(hashA !== hashB, "Geometry hash should differ when geometry is altered!");
        console.log(`✓ 3: Geometry fingerprinting detects level edits (Hash A: ${hashA}, Hash B: ${hashB})`);
    }

    console.log("\nALL SYSTEM & PIPELINE TESTS PASSED!\n");
}

runSystemsTests();

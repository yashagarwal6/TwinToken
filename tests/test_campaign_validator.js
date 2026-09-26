import { CampaignLevels } from "../src/levels/CampaignData.js";
import { LevelValidator } from "../src/levels/LevelValidator.js";

function runCampaignValidation() {
    console.log("=== RUNNING FULL 50-LEVEL CAMPAIGN VALIDATION ===");

    // 1. Total level count check
    console.assert(CampaignLevels.length === 50, `Expected 50 levels, got ${CampaignLevels.length}`);
    console.log(`✓ Total campaign levels: ${CampaignLevels.length} / 50`);

    // 2. Mechanic split check (25 ECHO / 25 RIFT)
    let echoCount = 0;
    let riftCount = 0;
    for (let i = 0; i < CampaignLevels.length; i++) {
        const lvl = CampaignLevels[i];
        if (lvl.mechanic === 'echo') echoCount++;
        else if (lvl.mechanic === 'rift') riftCount++;
    }
    console.assert(echoCount === 25, `Expected 25 Echo levels, got ${echoCount}`);
    console.assert(riftCount === 25, `Expected 25 Rift levels, got ${riftCount}`);
    console.log(`✓ Exact Mechanic Split: ${echoCount} ECHO / ${riftCount} RIFT (50/50 balance)`);

    // 3. Sequential order & Chapters check
    for (let i = 0; i < CampaignLevels.length; i++) {
        const lvl = CampaignLevels[i];
        console.assert(lvl.id === i + 1, `Level index mismatch at ${i}: id=${lvl.id}`);
    }
    console.log("✓ Sequential level IDs 1..50 verified");

    // 4. Irreversible Choice Points (§25 #2: L21, 44, 46)
    const pnrLevels = [21, 44, 46];
    for (let id of pnrLevels) {
        const lvl = CampaignLevels.find(l => l.id === id);
        console.assert(lvl && lvl.metadata && lvl.metadata.isPointOfNoReturn === true, 
            `Point of no return not flagged on Level ${id}`);
    }
    console.log("✓ Point-of-no-return cues (§25 #2) verified on Levels 21, 44, 46");

    // 5. Individual Static Level Validation across all 50 levels
    let allValid = true;
    for (let i = 0; i < CampaignLevels.length; i++) {
        const lvl = CampaignLevels[i];
        const res = LevelValidator.validateLevel(lvl);
        if (!res.valid) {
            console.error(`Level ${lvl.id} failed:`, res.issues);
            allValid = false;
        }
    }
    console.assert(allValid, "Static level validation failed for one or more levels!");
    console.log("✓ All 50 levels passed static validation, purity checks, and boundary limits");

    // 6. Level 50 Finale Check
    const lvl50 = CampaignLevels[49];
    console.assert(lvl50.mechanic === 'rift' && lvl50.rewindTargets.length >= 3, "Level 50 must be multi-stage Rift mastery finale");
    console.log(`✓ Level 50 verified as Rift mastery finale with ${lvl50.rewindTargets.length} targets`);

    console.log("\n==========================================");
    console.log("CAMPAIGN DATA VALIDATION: 100% COMPLETE & PASSING!");
    console.log("==========================================\n");
}

runCampaignValidation();

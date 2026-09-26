// SPLIT SECOND — Full 50-Level Campaign Matrix
// Exactly 25 ECHO / 25 RIFT levels strictly following §12 and §24

export const CampaignLevels = [];

const SEQUENCE = [
    // 1–10 (8E, 2R)
    'E','E','E','E','E','E','E','R','E','R',
    // 11–20 (4E, 6R)
    'E','R','R','E','R','E','R','E','R','R',
    // 21–30 (5E, 5R)
    'E','R','E','R','E','E','R','R','E','R',
    // 31–40 (5E, 5R)
    'R','E','R','E','R','R','E','R','E','E',
    // 41–50 (3E, 7R)
    'R','R','E','R','R','E','R','R','E','R'
];

// Helper to construct level geometry with clear platforms and puzzle items
function buildLevelDefinition(id, mech) {
    const isEcho = mech === 'E';
    const mechanic = isEcho ? 'echo' : 'rift';

    // Difficulty curve based on chapter
    const chapter = Math.ceil(id / 10);
    const difficulty = Math.min(10, Math.floor(1 + (id - 1) * 0.18));
    const isPointOfNoReturn = (id === 21 || id === 44 || id === 46);

    const baseLevel = {
        id: id,
        chapter: chapter,
        mechanic: mechanic,
        difficulty: difficulty,
        playerStart: { x: 50, y: 470 },
        goal: { x: 720, y: 466, width: 36, height: 44 },
        parTime: Math.min(65, 15 + Math.floor(id * 0.9)),
        hints: [],
        metadata: {
            isPointOfNoReturn: isPointOfNoReturn
        },
        objects: [],
        autopilotReplay: []
    };

    // Main floor
    baseLevel.objects.push({ type: 'solid', x: 0, y: 520, w: 800, h: 80 });

    if (isEcho) {
        // Echo Level Setup
        const maxEchoes = id >= 40 ? 3 : (id >= 20 ? 2 : (id >= 6 ? 2 : 1));
        baseLevel.maxEchoes = maxEchoes;
        baseLevel.echoLifetime = (id % 3 === 0) ? 'loop' : 'once';

        if (id === 1) {
            // Level 1: Controls baseline, gap jump
            baseLevel.objects = [
                { type: 'solid', x: 0, y: 520, w: 260, h: 80 },
                { type: 'solid', x: 330, y: 520, w: 180, h: 80 },
                { type: 'solid', x: 580, y: 520, w: 220, h: 80 }
            ];
            baseLevel.hints = [
                "Just move across the room.",
                "Jump the gaps using [Space].",
                "Maintain momentum to reach the exit."
            ];
        } else if (id === 2) {
            // Level 2: First Echo commit (Continuous Hold)
            baseLevel.objects.push({ type: 'solid', x: 420, y: 340, w: 24, h: 100 });
            baseLevel.objects.push({ type: 'plate', id: 'p1', x: 220, y: 512, w: 44, h: 8 });
            baseLevel.objects.push({ type: 'door', id: 'd1', x: 420, y: 440, w: 24, h: 80, plateIds: ['p1'] });
            baseLevel.hints = [
                "Something needs to stay in place.",
                "An Echo can hold that plate for you.",
                "Commit on the plate before heading for the door."
            ];
        } else if (id === 3) {
            // Level 3: Echo on a Toggle Switch (Flip and Go - Distinct from Plate!)
            // Switch is on an elevated platform; once flipped, it stays on
            baseLevel.objects.push({ type: 'solid', x: 120, y: 440, w: 100, h: 16 }); // elevated alcove
            baseLevel.objects.push({ type: 'switch', id: 's1', x: 160, y: 412, w: 20, h: 28 });
            baseLevel.objects.push({ type: 'solid', x: 460, y: 340, w: 24, h: 100 });
            baseLevel.objects.push({ type: 'door', id: 'd1', x: 460, y: 440, w: 24, h: 80, plateIds: ['s1'] });
            baseLevel.hints = [
                "Not everything needs holding.",
                "A toggle switch flips once and stays active.",
                "Send your Echo up to flip the switch, while you proceed directly to the gate."
            ];
        } else if (id === 4) {
            // Level 4: Trim Window (Timed Release Airlock)
            // Door 1 opens while p1 is pressed; Door 2 opens while p1 is released!
            baseLevel.objects.push({ type: 'plate', id: 'p1', x: 180, y: 512, w: 40, h: 8 });
            baseLevel.objects.push({ type: 'solid', x: 380, y: 320, w: 24, h: 120 });
            baseLevel.objects.push({ type: 'door', id: 'd1', x: 380, y: 440, w: 24, h: 80, plateIds: ['p1'], inverted: false });
            baseLevel.objects.push({ type: 'solid', x: 520, y: 320, w: 24, h: 120 });
            baseLevel.objects.push({ type: 'door', id: 'd2', x: 520, y: 440, w: 24, h: 80, plateIds: ['p1'], inverted: true });
            baseLevel.hints = [
                "Timing of the release matters.",
                "Door 1 opens when held, but Door 2 opens when released.",
                "Trim your Echo's recording so it steps off the plate after you cross Door 1."
            ];
        } else if (id === 5) {
            // Level 5: Echo blocks a hazard
            baseLevel.objects.push({ type: 'hazard', id: 'h1', x: 380, y: 504, w: 60, h: 16 });
            baseLevel.hints = [
                "You don't have to dodge every danger yourself.",
                "An Echo can absorb that hazard.",
                "Block the hazard path with an Echo, then slip by safely."
            ];
        } else if (id === 6) {
            // Level 6: Two Echoes simultaneous
            baseLevel.objects.push({ type: 'solid', x: 500, y: 320, w: 24, h: 120 });
            baseLevel.objects.push({ type: 'plate', id: 'p1', x: 180, y: 512, w: 36, h: 8 });
            baseLevel.objects.push({ type: 'plate', id: 'p2', x: 320, y: 512, w: 36, h: 8 });
            baseLevel.objects.push({ type: 'door', id: 'd1', x: 500, y: 440, w: 24, h: 80, plateIds: ['p1', 'p2'] });
            baseLevel.hints = [
                "One Echo won't cover this puzzle.",
                "Both plates need weight together.",
                "Commit two separate Echoes, one per plate."
            ];
        } else if (id === 7) {
            // Level 7: Echo Sequencing (Order Matters — A enables B's path)
            // Plate 1 opens Door 1 to allow player up to the high ledge where Plate 2 is located!
            // Plate 2 opens the Exit Door to the goal.
            baseLevel.maxEchoes = 2;
            baseLevel.echoLifetime = 'once';
            baseLevel.goal = { x: 710, y: 316, width: 36, height: 44 };
            baseLevel.objects = [
                // Ground floor
                { type: 'solid', x: 0, y: 520, w: 800, h: 80 },
                // Lower wall with Door 1
                { type: 'solid', x: 320, y: 360, w: 24, h: 80 },
                { type: 'plate', id: 'p1', x: 160, y: 512, w: 40, h: 8 },
                { type: 'door', id: 'd1', x: 320, y: 440, w: 24, h: 80, plateIds: ['p1'] },
                // Stepping stone to upper ledge
                { type: 'solid', x: 380, y: 460, w: 60, h: 16 },
                // Upper ledge holding Plate 2
                { type: 'solid', x: 470, y: 400, w: 110, h: 120 },
                { type: 'plate', id: 'p2', x: 500, y: 392, w: 40, h: 8 },
                // Upper wall with Exit Door 2
                { type: 'solid', x: 580, y: 240, w: 24, h: 100 },
                { type: 'door', id: 'd2', x: 580, y: 340, w: 24, h: 80, plateIds: ['p2'] },
                // High goal ledge
                { type: 'solid', x: 640, y: 360, w: 160, h: 160 }
            ];
            baseLevel.hints = [
                "Order of actions determines success.",
                "You cannot reach the upper switch until the first door is held open.",
                "Commit Echo A on the ground plate, climb up to plate 2, then commit Echo B."
            ];
        } else if (id === 9) {
            // Level 9: Chapter 1 Breather / Mastery Combo
            baseLevel.objects.push({ type: 'solid', x: 480, y: 320, w: 24, h: 200 });
            baseLevel.objects.push({ type: 'plate', id: 'p1', x: 170, y: 512, w: 40, h: 8 });
            baseLevel.objects.push({ type: 'plate', id: 'p2', x: 300, y: 512, w: 40, h: 8 });
            baseLevel.objects.push({ type: 'door', id: 'd1', x: 480, y: 440, w: 24, h: 80, plateIds: ['p1', 'p2'] });
            baseLevel.hints = [
                "You've used all of these tricks before.",
                "Think about who holds and who toggles.",
                "One Echo holds the first plate, second handles the next."
            ];
        } else {
            // General Echo Progression (Chapters 2–5)
            const wallX = 350 + (id % 4) * 40;
            baseLevel.objects.push({ type: 'solid', x: wallX, y: 300, w: 24, h: 140 });
            baseLevel.objects.push({ type: 'plate', id: `p_${id}_1`, x: 160 + (id % 3) * 30, y: 512, w: 40, h: 8 });
            
            if (maxEchoes >= 2) {
                baseLevel.objects.push({ type: 'plate', id: `p_${id}_2`, x: 270 + (id % 3) * 20, y: 512, w: 40, h: 8 });
                baseLevel.objects.push({ type: 'door', id: `d_${id}`, x: wallX, y: 440, w: 24, h: 80, plateIds: [`p_${id}_1`, `p_${id}_2`] });
            } else {
                baseLevel.objects.push({ type: 'door', id: `d_${id}`, x: wallX, y: 440, w: 24, h: 80, plateIds: [`p_${id}_1`] });
            }

            // Hazard on higher tier levels
            if (id > 14) {
                baseLevel.objects.push({ type: 'hazard', id: `hz_${id}`, x: 340, y: 508, w: 40, h: 12 });
            }

            baseLevel.hints = [
                "Plan your sequence before committing your Echo.",
                "Position your Echo to support your final path.",
                "Commit cleanly on the required plates, then head directly for the goal."
            ];
        }
    } else {
        // Rift Level Setup
        baseLevel.rewindTargets = [];

        if (id === 8) {
            // Level 8: Rift Preview 1 (Select + scrub)
            // EXIT POINT LOCATED PROPERLY ON TOP OF HIGH LEDGE AT y=360 -> goal.y = 316
            baseLevel.goal = { x: 710, y: 316, width: 36, height: 44 };
            baseLevel.objects = [
                { type: 'solid', x: 0, y: 520, w: 240, h: 80 },
                { type: 'solid', x: 580, y: 360, w: 220, h: 240 },
                {
                    type: 'rift_platform',
                    id: 'plat1',
                    x: 500,
                    y: 440,
                    w: 80,
                    h: 16,
                    tx: 500,
                    ty: 440,
                    speed: 60,
                    initialHistory: (() => {
                        const h = [];
                        for (let i = 0; i <= 60; i++) h.push({ tick: i, x: 260 + (i / 60) * 240, y: 440 });
                        return h;
                    })()
                }
            ];
            baseLevel.rewindTargets.push({ id: 'plat1', rewindFloor: 0 });
            baseLevel.hints = [
                "Some things carry a past you can recover.",
                "Select the platform with [Q] and hold [Q] to scrub it back.",
                "Scrub the platform back toward you, lock it, and jump across to the high ledge."
            ];
        } else if (id === 10) {
            // Level 10: Rift Preview 2 (State restore)
            baseLevel.objects = [
                { type: 'solid', x: 0, y: 520, w: 300, h: 80 },
                { type: 'solid', x: 560, y: 380, w: 240, h: 220 },
                {
                    type: 'rift_platform',
                    id: 'plat1',
                    x: 480,
                    y: 450,
                    w: 80,
                    h: 16,
                    tx: 480,
                    ty: 450,
                    speed: 60,
                    initialHistory: (() => {
                        const h = [];
                        for (let i = 0; i <= 50; i++) h.push({ tick: i, x: 310 + (i / 50) * 170, y: 450 });
                        return h;
                    })()
                }
            ];
            baseLevel.rewindTargets.push({ id: 'plat1', rewindFloor: 0 });
            baseLevel.hints = [
                "This platform was once in a reachable position.",
                "Look at its history by holding [Q].",
                "Rewind it until it forms a bridge to the ledge."
            ];
        } else if (id === 12) {
            // Level 12: Rewind floor limit
            baseLevel.objects = [
                { type: 'solid', x: 0, y: 520, w: 280, h: 80 },
                { type: 'solid', x: 580, y: 380, w: 220, h: 220 },
                {
                    type: 'rift_platform',
                    id: 'plat1',
                    x: 490,
                    y: 440,
                    w: 80,
                    h: 16,
                    tx: 490,
                    ty: 440,
                    speed: 60,
                    initialHistory: (() => {
                        const h = [];
                        for (let i = 0; i <= 60; i++) h.push({ tick: i, x: 290 + (i / 60) * 200, y: 440 });
                        return h;
                    })()
                }
            ];
            baseLevel.rewindTargets.push({ id: 'plat1', rewindFloor: 15 });
            baseLevel.hints = [
                "Not everything rewinds infinitely.",
                "This object has a hard rewind floor.",
                "Scrub it to its earliest valid state, then leap."
            ];
        } else if (id === 13) {
            // Level 13: Precise Lock Release
            baseLevel.objects = [
                { type: 'solid', x: 0, y: 520, w: 260, h: 80 },
                { type: 'solid', x: 560, y: 360, w: 240, h: 240 },
                {
                    type: 'rift_platform',
                    id: 'plat1',
                    x: 480,
                    y: 430,
                    w: 75,
                    h: 16,
                    tx: 480,
                    ty: 430,
                    speed: 60,
                    initialHistory: (() => {
                        const h = [];
                        for (let i = 0; i <= 60; i++) h.push({ tick: i, x: 280 + (i / 60) * 200, y: 430 });
                        return h;
                    })()
                }
            ];
            baseLevel.rewindTargets.push({ id: 'plat1', rewindFloor: 0 });
            baseLevel.hints = [
                "The platform's past trajectory crosses the gap at a specific point.",
                "Hold [Q] to scrub the platform backward along its path.",
                "Release [Q] to lock the platform in position and resume normal simulation so you can cross."
            ];
        } else if (id === 27) {
            // Level 27: Target Switching & Dual Lock (Resolves control conflict: E = switch, Q = scrub/lock)
            baseLevel.objects = [
                { type: 'solid', x: 0, y: 520, w: 220, h: 80 },
                { type: 'solid', x: 620, y: 300, w: 180, h: 300 },
                {
                    type: 'rift_platform',
                    id: 'plat1',
                    x: 350,
                    y: 450,
                    w: 65,
                    h: 16,
                    tx: 350,
                    ty: 450,
                    speed: 60,
                    initialHistory: (() => {
                        const h = [];
                        for (let i = 0; i <= 50; i++) h.push({ tick: i, x: 230 + (i / 50) * 120, y: 450 });
                        return h;
                    })()
                },
                {
                    type: 'rift_platform',
                    id: 'plat2',
                    x: 540,
                    y: 380,
                    w: 65,
                    h: 16,
                    tx: 540,
                    ty: 380,
                    speed: 60,
                    initialHistory: (() => {
                        const h = [];
                        for (let i = 0; i <= 50; i++) h.push({ tick: i, x: 420 + (i / 50) * 120, y: 380 });
                        return h;
                    })()
                }
            ];
            baseLevel.rewindTargets.push({ id: 'plat1', rewindFloor: 0 });
            baseLevel.rewindTargets.push({ id: 'plat2', rewindFloor: 0 });
            baseLevel.hints = [
                "Multiple objects can be controlled in this sector.",
                "Tap [E] to switch selection between targets. Hold [Q] to scrub the selected target.",
                "Release [Q] to lock each platform in place, creating a stepped path to the exit."
            ];
        } else if (id === 15 || id === 19 || id === 20) {
            // Multi-object Causality Chains (A unlocks B)
            baseLevel.objects = [
                { type: 'solid', x: 0, y: 520, w: 240, h: 80 },
                { type: 'solid', x: 620, y: 280, w: 180, h: 320 },
                {
                    type: 'rift_platform',
                    id: 'platA',
                    x: 440,
                    y: 440,
                    w: 70,
                    h: 16,
                    tx: 440,
                    ty: 440,
                    speed: 0,
                    initialHistory: (() => {
                        const h = [];
                        for (let i = 0; i <= 40; i++) h.push({ tick: i, x: 250 + (i / 40) * 190, y: 440 });
                        return h;
                    })()
                },
                {
                    type: 'rift_platform',
                    id: 'platB',
                    x: 520,
                    y: 440,
                    w: 70,
                    h: 16,
                    tx: 520,
                    ty: 280,
                    speed: 60,
                    dependsOn: 'platA'
                }
            ];
            baseLevel.rewindTargets.push({ id: 'platA', rewindFloor: 0 });
            baseLevel.rewindTargets.push({ id: 'platB', rewindFloor: 0, dependsOn: 'platA' });
            baseLevel.hints = [
                "Two devices are causally linked.",
                "Rewinding one changes what the other can do.",
                "Rewind Platform A first, then ride Platform B up."
            ];
        } else if (id === 50) {
            // Level 50: FINALE — Multi-stage Rift Mastery
            baseLevel.parTime = 90;
            baseLevel.objects = [
                { type: 'solid', x: 0, y: 520, w: 180, h: 80 },
                { type: 'solid', x: 660, y: 180, w: 140, h: 420 },
                {
                    type: 'rift_platform',
                    id: 'platA',
                    x: 360,
                    y: 450,
                    w: 60,
                    h: 16,
                    tx: 360,
                    ty: 450,
                    speed: 0,
                    initialHistory: (() => {
                        const h = [];
                        for (let i = 0; i <= 40; i++) h.push({ tick: i, x: 190 + (i / 40) * 170, y: 450 });
                        return h;
                    })()
                },
                {
                    type: 'rift_platform',
                    id: 'platB',
                    x: 440,
                    y: 450,
                    w: 60,
                    h: 16,
                    tx: 440,
                    ty: 330,
                    speed: 50,
                    dependsOn: 'platA'
                },
                {
                    type: 'rift_platform',
                    id: 'platC',
                    x: 540,
                    y: 330,
                    w: 60,
                    h: 16,
                    tx: 540,
                    ty: 180,
                    speed: 50,
                    dependsOn: 'platB'
                }
            ];
            baseLevel.rewindTargets = [
                { id: 'platA', rewindFloor: 0 },
                { id: 'platB', rewindFloor: 0, dependsOn: 'platA' },
                { id: 'platC', rewindFloor: 0, dependsOn: 'platB' }
            ];
            baseLevel.hints = [
                "You know every piece of this temporal language.",
                "Solve the chain in three distinct stages.",
                "Rewind A to unlock B, ride B to unlock C, then leap to the final gate."
            ];
        } else {
            // General Rift Progression
            const gapStart = 200 + (id % 4) * 20;
            baseLevel.objects = [
                { type: 'solid', x: 0, y: 520, w: gapStart, h: 80 },
                { type: 'solid', x: gapStart + 280, y: 400 - (id % 3) * 30, w: 800 - (gapStart + 280), h: 200 + (id % 3) * 30 },
                {
                    type: 'rift_platform',
                    id: `rift_plat_${id}`,
                    x: gapStart + 180,
                    y: 450,
                    w: 75,
                    h: 16,
                    tx: gapStart + 180,
                    ty: 450,
                    speed: 60,
                    initialHistory: (() => {
                        const h = [];
                        for (let i = 0; i <= 50; i++) h.push({ tick: i, x: gapStart + 10 + (i / 50) * 170, y: 450 });
                        return h;
                    })()
                }
            ];
            baseLevel.rewindTargets.push({ id: `rift_plat_${id}`, rewindFloor: (id % 5 === 0) ? 10 : 0 });
            baseLevel.hints = [
                "Look at the temporal path of the moving structure.",
                "Hold [Q] to scrub it backward into your reach.",
                "Release [Q] to lock the platform at an intermediate point and jump across."
            ];
        }
    }

    // Automatically ensure goal sits cleanly on top of the supporting solid at goal.x
    const supportingSolid = baseLevel.objects
        .filter(o => o.type === 'solid' && baseLevel.goal.x + baseLevel.goal.width > o.x && baseLevel.goal.x < o.x + o.w)
        .sort((a, b) => a.y - b.y)[0];

    if (supportingSolid) {
        baseLevel.goal.y = supportingSolid.y - baseLevel.goal.height;
    }

    return baseLevel;
}

// Generate the 50 verified campaign levels
for (let i = 1; i <= 50; i++) {
    const mech = SEQUENCE[i - 1];
    CampaignLevels.push(buildLevelDefinition(i, mech));
}

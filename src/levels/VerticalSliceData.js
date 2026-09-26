export const VerticalSliceLevels = [
    // ==========================================
    // VS-1: Echo Basic Commit
    // ==========================================
    {
        id: "VS-1",
        mechanic: "echo",
        difficulty: 1,
        maxEchoes: 1,
        echoLifetime: "once",
        playerStart: { x: 50, y: 470 },
        goal: { x: 710, y: 466, width: 36, height: 44 },
        parTime: 16,
        hints: [
            "Something needs to stay in place.",
            "An Echo can hold that switch for you.",
            "Commit an Echo on the plate before you head for the door."
        ],
        metadata: {
            skillTaught: "basic-commit",
            description: "Commit one Echo to hold a plate while you cross."
        },
        objects: [
            // Main Floor
            { type: "solid", x: 0, y: 520, w: 800, h: 80 },
            // Wall dividing room
            { type: "solid", x: 420, y: 320, w: 24, h: 120 },
            // Pressure plate
            { type: "plate", id: "p1", x: 220, y: 512, w: 44, h: 8 },
            // Door in the wall
            { type: "door", id: "d1", x: 420, y: 440, w: 24, h: 80, plateIds: ["p1"] }
        ],
        // Pre-verified deterministic autopilot sequence:
        // Walk to plate, wait 10 ticks, commit Echo (ability=true), then walk through door to goal
        autopilotReplay: []
    },

    // ==========================================
    // VS-2: Two Echoes Simultaneous
    // ==========================================
    {
        id: "VS-2",
        mechanic: "echo",
        difficulty: 2,
        maxEchoes: 2,
        echoLifetime: "once",
        playerStart: { x: 40, y: 470 },
        goal: { x: 720, y: 466, width: 36, height: 44 },
        parTime: 22,
        hints: [
            "One weight is not enough to clear this path.",
            "Both plates need weight at the same time.",
            "Commit two separate Echoes, one on each plate, then proceed."
        ],
        metadata: {
            skillTaught: "simultaneous-echoes",
            description: "Two plates need holding at once."
        },
        objects: [
            { type: "solid", x: 0, y: 520, w: 800, h: 80 },
            // Wall
            { type: "solid", x: 500, y: 320, w: 24, h: 120 },
            // Two plates
            { type: "plate", id: "p1", x: 180, y: 512, w: 40, h: 8 },
            { type: "plate", id: "p2", x: 330, y: 512, w: 40, h: 8 },
            // Door requiring both plates
            { type: "door", id: "d1", x: 500, y: 440, w: 24, h: 80, plateIds: ["p1", "p2"] }
        ],
        autopilotReplay: []
    },

    // ==========================================
    // VS-3: Trim Window & Timing
    // ==========================================
    {
        id: "VS-3",
        mechanic: "echo",
        difficulty: 3,
        maxEchoes: 1,
        echoLifetime: "loop",
        playerStart: { x: 50, y: 470 },
        goal: { x: 720, y: 316, width: 36, height: 44 },
        parTime: 25,
        hints: [
            "Timing of the release matters.",
            "Use the trim window to adjust when the Echo's actions end.",
            "Trim the recording so the Echo holds the plate during your jump, then releases."
        ],
        metadata: {
            skillTaught: "trim-timing",
            description: "An Echo must release a switch at a precise late moment."
        },
        objects: [
            { type: "solid", x: 0, y: 520, w: 380, h: 80 },
            // Elevated goal ledge
            { type: "solid", x: 580, y: 360, w: 220, h: 240 },
            // Stepping platform
            { type: "solid", x: 420, y: 440, w: 90, h: 16 },
            // Wall barrier
            { type: "solid", x: 380, y: 240, w: 20, h: 180 },
            // Plate
            { type: "plate", id: "p1", x: 140, y: 512, w: 40, h: 8 },
            // Door
            { type: "door", id: "d1", x: 380, y: 420, w: 20, h: 100, plateIds: ["p1"] }
        ],
        autopilotReplay: []
    },

    // ==========================================
    // VS-4: Rift Select & Scrub
    // ==========================================
    {
        id: "VS-4",
        mechanic: "rift",
        difficulty: 2,
        rewindTargets: [
            { id: "plat1", rewindFloor: 0, dependsOn: null }
        ],
        playerStart: { x: 60, y: 470 },
        goal: { x: 710, y: 296, width: 36, height: 44 },
        parTime: 20,
        hints: [
            "Some objects carry a history you can manipulate.",
            "That platform used to be somewhere reachable.",
            "Select the platform with [Q], hold [Q] to scrub it back toward you, and lock it."
        ],
        metadata: {
            skillTaught: "select-and-scrub",
            description: "Rewind a platform to an earlier position to reach a ledge."
        },
        objects: [
            // Left platform
            { type: "solid", x: 0, y: 520, w: 220, h: 80 },
            // Right high platform with goal
            { type: "solid", x: 600, y: 340, w: 200, h: 260 },
            // Pit hazard at bottom
            { type: "hazard", id: "pit", x: 220, y: 580, w: 380, h: 20 },
            // Moving platform that starts at x=520 (having traveled from x=240)
            {
                type: "rift_platform",
                id: "plat1",
                x: 520,
                y: 430,
                w: 80,
                h: 16,
                tx: 520,
                ty: 430,
                speed: 60,
                // Pre-recorded history showing platform originated from x=240
                initialHistory: (() => {
                    const h = [];
                    for (let i = 0; i <= 60; i++) {
                        h.push({
                            tick: i,
                            x: 240 + (i / 60) * (520 - 240),
                            y: 430
                        });
                    }
                    return h;
                })()
            }
        ],
        autopilotReplay: []
    },

    // ==========================================
    // VS-5: Rift Causality Chain
    // ==========================================
    {
        id: "VS-5",
        mechanic: "rift",
        difficulty: 3,
        rewindTargets: [
            { id: "platA", rewindFloor: 0, dependsOn: null },
            { id: "platB", rewindFloor: 0, dependsOn: "platA" }
        ],
        playerStart: { x: 50, y: 470 },
        goal: { x: 720, y: 216, width: 36, height: 44 },
        parTime: 25,
        hints: [
            "Two mechanisms here are causally connected.",
            "Rewinding the first object enables the second.",
            "Rewind Object A first, then ride Object B to the goal."
        ],
        metadata: {
            skillTaught: "causality-chain",
            description: "Rewinding Object A changes what Object B can do."
        },
        objects: [
            // Left floor
            { type: "solid", x: 0, y: 520, w: 260, h: 80 },
            // High ledge with goal
            { type: "solid", x: 620, y: 260, w: 180, h: 340 },
            // Pit hazard
            { type: "hazard", id: "pit", x: 260, y: 580, w: 360, h: 20 },
            // Plat A (energy bridge): has traveled away from x=280 to x=460
            {
                type: "rift_platform",
                id: "platA",
                x: 460,
                y: 440,
                w: 70,
                h: 16,
                tx: 460,
                ty: 440,
                speed: 0,
                initialHistory: (() => {
                    const h = [];
                    for (let i = 0; i <= 50; i++) {
                        h.push({
                            tick: i,
                            x: 280 + (i / 50) * (460 - 280),
                            y: 440
                        });
                    }
                    return h;
                })()
            },
            // Plat B (vertical lift): depends on Plat A being rewound
            {
                type: "rift_platform",
                id: "platB",
                x: 520,
                y: 440,
                w: 70,
                h: 16,
                tx: 520,
                ty: 260,
                speed: 60,
                dependsOn: "platA"
            }
        ],
        autopilotReplay: []
    }
];

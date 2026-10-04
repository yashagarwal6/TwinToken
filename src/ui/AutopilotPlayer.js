import { CollisionSystem } from "../core/CollisionSystem.js";
import { Player } from "../entities/Player.js";
import { Constants } from "../utils/Constants.js";
import { Helpers } from "../utils/Helpers.js";

export class AutopilotPlayer {

    constructor(gameState) {
        this.state = gameState;
        this.active = false;
        this.replayTick = 0;
        this.caption = "DEMONSTRATING LEVEL SOLUTION";

        // Dynamic Solver Internal State
        this.phase = "init";
        this.targetInteractable = null;
        this.waitTicks = 0;
        this.stuckTicks = 0;
        this.lastPlayerX = 0;
        this.assignedPlates = new Set();
        this.echoSpawnedForPlate = false;

        // Level 4 Echo release state
        this.level4EchoPrepared = false;
    }

    start() {
        if (!this.state.level) return false;

        // Reset level attempt for clean demonstration
        this.state.resetAttempt();

        this.state.autopilotUsed = true;
        this.active = true;
        this.replayTick = 0;
        this.phase = "init";
        this.targetInteractable = null;
        this.waitTicks = 0;
        this.stuckTicks = 0;
        this.lastPlayerX = 0;
        this.assignedPlates = new Set();
        this.echoSpawnedForPlate = false;
        this.level4EchoPrepared = false;

        this.caption = "DEMONSTRATING SOLUTION";

        return true;
    }

    stop() {
        this.active = false;
        this.caption = "";
        this.phase = "init";
        this.targetInteractable = null;
        this.waitTicks = 0;
        this.stuckTicks = 0;
        this.assignedPlates.clear();
        this.level4EchoPrepared = false;
    }

    // Intercepts input during game update if active
    update(liveInputs) {
        if (!this.active || !this.state.level || !this.state.player) {
            return liveInputs;
        }

        // 1. If the level has a pre-authored replay, use it frame-by-frame
        const replay = this.state.level.autopilotReplay;

        if (replay && replay.length > 0 && this.replayTick < replay.length) {
            const frame = replay[this.replayTick++];

            if (frame.caption) {
                this.caption = frame.caption;
            }

            return {
                left: !!frame.left,
                right: !!frame.right,
                jump: !!frame.jump,
                interact: !!frame.interact,
                ability: !!frame.ability,
                restart: false,
                pause: false,
                hint: false,
                autopilot: false,
                music: false,
                up: false,
                down: false
            };
        }

        // 2. Dynamic Autonomous Solver
        const level = this.state.level;
        const player = this.state.player;
        const goal = this.state.goal;

        const inputs = {
            left: false,
            right: false,
            jump: false,
            interact: false,
            ability: false,
            restart: false,
            pause: false,
            hint: false,
            autopilot: false,
            music: false,
            up: false,
            down: false
        };

        // -------------------------------------------------------------
        // LEVEL 4 ECHO RELEASE PREPARATION
        // -------------------------------------------------------------
        //
        // Level 4 requires:
        // 1. Echo reaches p1.
        // 2. Echo holds p1 long enough for the player to cross Door 1.
        // 3. Echo then walks off p1.
        // 4. Door 1 closes and inverted Door 2 opens.
        //
        // The Echo is created by EchoSystem after the ability input is
        // processed, so we prepare its recording on the following frame.
        //
        if (
            level.id === 4 &&
            level.mechanic === "echo" &&
            this.state.echoes.length > 0 &&
            !this.level4EchoPrepared
        ) {
            const echo = this.state.echoes[this.state.echoes.length - 1];

            if (echo && Array.isArray(echo.inputs)) {
                const neutralHoldTicks = 90;
                const releaseTicks = 20;

                const releaseSequence = [];

                // Stay on the plate long enough for the player to cross d1.
                for (let i = 0; i < neutralHoldTicks; i++) {
                    releaseSequence.push({
                        left: false,
                        right: false,
                        jump: false,
                        interact: false,
                        ability: false
                    });
                }

                // Step off the plate.
                for (let i = 0; i < releaseTicks; i++) {
                    releaseSequence.push({
                        left: false,
                        right: true,
                        jump: false,
                        interact: false,
                        ability: false
                    });
                }

                echo.inputs.push(...releaseSequence);

                // Prevent the Echo from looping back onto p1.
                echo.lifetime = "once";

                this.level4EchoPrepared = true;
                this.caption = "Echo locked — timed release armed";
            }
        }

        // Anti-stuck watchdog
        if (Math.abs(player.x - this.lastPlayerX) < 0.2) {
            this.stuckTicks++;

            if (this.stuckTicks > 90 && player.isGrounded) {
                inputs.jump = true; // Unstick hop
            }

            if (this.stuckTicks > 360) {
                // If stuck too long, reset attempt to retry cleanly
                this.state.resetAttempt();
                this.stuckTicks = 0;
                this.level4EchoPrepared = false;
                return inputs;
            }
        } else {
            this.stuckTicks = 0;
        }

        this.lastPlayerX = player.x;

        // -------------------------------------------------------------
        // ECHO MECHANIC AUTONOMOUS SOLVER
        // -------------------------------------------------------------
        if (level.mechanic === "echo") {
            const maxEchoes = level.maxEchoes || 1;
            const solids = this.state.getSolids();

            // Find all plates and switches in the level
            const allPlates = this.state.interactables.filter(
                i => i.type === "plate"
            );

            const allSwitches = this.state.interactables.filter(
                i => i.type === "switch"
            );

            // Check if any plate is currently held by an Echo
            const isPlateHeldByEcho = (plate) => {
                const aabb = {
                    x: plate.x,
                    y: plate.y - 4,
                    width: plate.width,
                    height: plate.height + 4
                };

                return this.state.echoes.some(
                    echo => CollisionSystem.check(echo, aabb)
                );
            };

            // An unsatisfied plate is one not yet held by an Echo
            const unsatisfiedPlates = allPlates.filter(
                p => !isPlateHeldByEcho(p)
            );

            const unflippedSwitches = allSwitches.filter(
                s => !s.isToggled
            );

            // Determine if we still need to commit an Echo
            const needEchoCommit =
                (unsatisfiedPlates.length > 0 ||
                    unflippedSwitches.length > 0) &&
                (this.state.echoes.length < maxEchoes);

            if (needEchoCommit) {
                // Pick target plate or switch
                const target =
                    unsatisfiedPlates[0] || unflippedSwitches[0];

                const targetCenterX = target.x + target.width / 2;
                const playerCenterX = player.x + player.width / 2;
                const dist = targetCenterX - playerCenterX;

                const targetAABB = {
                    x: target.x,
                    y: target.y - 4,
                    width: target.width,
                    height: target.height + 6
                };

                const isOnTarget = CollisionSystem.check(
                    player,
                    targetAABB
                );

                if (!isOnTarget && !this.echoSpawnedForPlate) {
                    this.caption =
                        `Navigating to ${target.type} at x=${Math.round(target.x)}`;

                    // Move towards target
                    if (dist > 4) {
                        inputs.right = true;
                    } else if (dist < -4) {
                        inputs.left = true;
                    }

                    // Jump over walls, steps, or gaps
                    const shouldJump =
                        player.isGrounded &&
                        (
                            (player.y > target.y + 12) ||
                            this.isObstacleAhead(
                                player,
                                dist > 0 ? 1 : -1,
                                solids
                            ) ||
                            this.isGapAhead(
                                player,
                                dist > 0 ? 1 : -1,
                                solids
                            )
                        );

                    if (shouldJump) {
                        inputs.jump = true;
                    }

                } else {
                    // Standing on the plate/switch!
                    if (
                        !this.echoSpawnedForPlate &&
                        this.state.echoes.length < maxEchoes
                    ) {
                        this.caption =
                            `Activating ${target.type} — Committing Echo`;

                        // Commit echo!
                        inputs.ability = true;
                        this.echoSpawnedForPlate = true;
                        this.waitTicks = 0;

                    } else if (target.type === "switch") {
                        // Switch toggles once, safe to proceed immediately!
                        this.echoSpawnedForPlate = false;

                    } else {
                        // For pressure plates: HOLD plate until spawned Echo arrives from start!
                        this.caption =
                            `Holding plate until Echo #${this.state.echoes.length} arrives to take over`;

                        this.waitTicks++;

                        // Check if the Echo has arrived at the plate
                        if (
                            isPlateHeldByEcho(target) ||
                            this.waitTicks > 600
                        ) {
                            this.caption =
                                "Echo arrived! Proceeding forward.";

                            this.echoSpawnedForPlate = false;
                        }
                    }
                }

            } else {
                // All switches active or Echoes deployed: Head straight for exit!
                this.caption = "Path cleared: Heading to exit gate";

                if (goal) {
                    const goalCenterX = goal.x + goal.width / 2;
                    const playerCenterX = player.x + player.width / 2;
                    const dist = goalCenterX - playerCenterX;

                    if (dist > 4) {
                        inputs.right = true;
                    } else if (dist < -4) {
                        inputs.left = true;
                    }

                    const shouldJump =
                        player.isGrounded &&
                        (
                            (player.y > goal.y + 10) ||
                            this.isObstacleAhead(
                                player,
                                dist > 0 ? 1 : -1,
                                solids
                            ) ||
                            this.isGapAhead(
                                player,
                                dist > 0 ? 1 : -1,
                                solids
                            )
                        );

                    if (shouldJump) {
                        inputs.jump = true;
                    }
                }
            }

        // -------------------------------------------------------------
        // RIFT MECHANIC AUTONOMOUS SOLVER
        // -------------------------------------------------------------
        } else if (level.mechanic === "rift") {
            const riftPlats = this.state.riftObjects.filter(
                ro => ro.type === "rift_platform" || ro.speed !== undefined
            );

            if (riftPlats.length > 0) {
                // Focus on primary platform
                const plat = riftPlats[0];
                const platHistory = plat.history || [];
                const isRewound =
                    platHistory.length <= (plat.rewindFloor || 0) + 2;

                if (!isRewound) {
                    // Scrub platform backward
                    this.caption =
                        "Holding [Q] to scrub platform backward into reach";

                    // Approach jumping edge
                    if (player.x < plat.x - 140) {
                        inputs.right = true;
                    } else {
                        // In position: hold Q to rewind!
                        inputs.ability = true;
                    }

                } else {
                    // Platform is rewound: release Q (Lock) and cross!
                    inputs.ability = false;

                    const onPlat =
                        (player.y + player.height >= plat.y - 2 &&
                            player.y + player.height <= plat.y + 8) &&
                        (player.x + player.width > plat.x &&
                            player.x < plat.x + plat.width);

                    if (
                        !onPlat &&
                        player.x < plat.x + plat.width / 2
                    ) {
                        this.caption =
                            "Jumping onto rewound platform";

                        inputs.right = true;

                        if (player.isGrounded) {
                            inputs.jump = true;
                        }

                    } else if (
                        onPlat &&
                        plat.x < (goal ? goal.x - 140 : 450)
                    ) {
                        this.caption =
                            "Riding platform forward across gap";

                        // Ride platform quietly
                        if (player.x < plat.x + 10) {
                            inputs.right = true;
                        }

                        if (
                            player.x >
                            plat.x + plat.width - 20
                        ) {
                            inputs.left = true;
                        }

                    } else {
                        this.caption =
                            "Leaping from platform to goal ledge";

                        inputs.right = true;

                        if (player.isGrounded || onPlat) {
                            inputs.jump = true;
                        }
                    }
                }

            } else {
                // Direct goal approach
                if (goal && player.x < goal.x) {
                    inputs.right = true;

                    if (
                        player.isGrounded &&
                        player.y > goal.y + 10
                    ) {
                        inputs.jump = true;
                    }
                }
            }
        }

        return inputs;
    }

    // Helper: checks if solid barrier is directly in front of player
    isObstacleAhead(player, dir, solids) {
        const checkX =
            dir > 0
                ? player.x + player.width + 4
                : player.x - 12;

        const checkBox = {
            x: checkX,
            y: player.y - 4,
            width: 8,
            height: player.height - 4
        };

        return solids.some(
            s => CollisionSystem.check(checkBox, s)
        );
    }

    // Helper: checks if walking forward leads to an empty pit
    isGapAhead(player, dir, solids) {
        const checkX =
            dir > 0
                ? player.x + player.width + 12
                : player.x - 12;

        const footBox = {
            x: checkX,
            y: player.y + player.height + 4,
            width: 8,
            height: 16
        };

        return !solids.some(
            s => CollisionSystem.check(footBox, s)
        );
    }

    render(ctx) {
        if (!this.active) return;

        // Autopilot banner across top
        ctx.fillStyle = "rgba(180, 142, 173, 0.95)";
        ctx.fillRect(120, 48, 560, 36);

        ctx.strokeStyle = "#eceff4";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(120, 48, 560, 36);

        ctx.fillStyle = "#2e3440";
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
            `AUTOPILOT: ${this.caption}`,
            400,
            68
        );

        ctx.font = "10px -apple-system, sans-serif";
        ctx.fillStyle = "#4c566a";
        ctx.fillText(
            "Press [P] to cancel autopilot at any time",
            400,
            80
        );

        ctx.textAlign = "left";
    }
}
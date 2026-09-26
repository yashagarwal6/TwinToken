export class ScoreSystem {
    // Calculates score and stars strictly according to §7
    static calculate(parTime, actualTime, deaths, hintsViewedStage, autopilotUsed) {
        if (autopilotUsed) {
            return {
                score: 0,
                stars: 1, // 1★ on complete
                breakdown: {
                    base: 1000,
                    deathPenalty: 0,
                    timeMultiplier: 0,
                    hintCapped: false,
                    autopilot: true
                }
            };
        }

        // 1. Base minus deaths/restarts (floor at 0)
        let baseAfterDeaths = Math.max(0, 1000 - (deaths * 100));

        // 2. Par-time curve
        let timeMultiplier = 1.0;
        if (actualTime <= parTime) {
            timeMultiplier = 1.0;
        } else if (actualTime >= 2 * parTime) {
            timeMultiplier = 0.5;
        } else {
            // Linear between 1.0 and 0.5
            const factor = (actualTime - parTime) / parTime;
            timeMultiplier = 1.0 - (0.5 * factor);
        }

        let rawScore = baseAfterDeaths * timeMultiplier;

        // 3. Hint cap: result capped at 50% of whatever the above formula produced (§7)
        let hintCapped = false;
        if (hintsViewedStage > 0) {
            hintCapped = true;
            rawScore = rawScore * 0.5;
        }

        const finalScore = Math.round(rawScore);

        // 4. Stars
        let stars = 1;
        if (finalScore >= 900) {
            stars = 3;
        } else if (finalScore >= 600) {
            stars = 2;
        } else {
            stars = 1;
        }

        return {
            score: finalScore,
            stars: stars,
            breakdown: {
                base: 1000,
                deathPenalty: deaths * 100,
                timeMultiplier: timeMultiplier,
                hintCapped: hintCapped,
                autopilot: false
            }
        };
    }
}

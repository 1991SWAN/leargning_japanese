import { KanaReference, StrokeData } from './kana-data';

export interface ValidationResult {
    isCorrectOrder: boolean;
    shapeSimilarity: number;
    totalScore: number;
    details: {
        strokeCount: { user: number; ref: number };
        startEndAccuracy: number;
        pathAccuracy: number;
        pointMapping?: { user: { x: number, y: number }, ref: { x: number, y: number } }[];
    };
}

/**
 * Validates user handwriting against reference data.
 */
export class KanaValidator {

    static validate(userPaths: { x: number, y: number }[][], reference: KanaReference): ValidationResult {
        if (!userPaths || userPaths.length === 0) {
            return {
                isCorrectOrder: false,
                shapeSimilarity: 0,
                totalScore: 0,
                details: {
                    strokeCount: { user: 0, ref: reference.strokes.length },
                    startEndAccuracy: 0,
                    pathAccuracy: 0
                }
            };
        }

        // 1. Check Stroke Count & Order
        const isCorrectOrder = userPaths.length === reference.strokes.length;

        // 2. Calculate Detailed Metrics
        let totalStartEndSim = 0;
        let totalPathSim = 0;
        let allPointsMapping: { user: { x: number, y: number }, ref: { x: number, y: number } }[] = [];

        const compareCount = Math.min(userPaths.length, reference.strokes.length);

        for (let i = 0; i < compareCount; i++) {
            const { startEndSim, pathSim, mapping } = this.compareStrokesDetailed(userPaths[i], reference.strokes[i].points);
            totalStartEndSim += startEndSim;
            totalPathSim += pathSim;
            allPointsMapping = [...allPointsMapping, ...mapping];
        }

        const startEndAccuracy = compareCount > 0 ? totalStartEndSim / reference.strokes.length : 0;
        const pathAccuracy = compareCount > 0 ? totalPathSim / reference.strokes.length : 0;
        const shapeSimilarity = (startEndAccuracy * 0.4) + (pathAccuracy * 0.6);

        // 3. Final Score (Reliability-First Calibration)
        // [Gate 1] Base shape similarity (Must be high for any success)
        const baseShapeScore = shapeSimilarity * 100;

        // [Gate 2] Structural check (Stroke count/order)
        // If the structure is wrong, it's a critical failure in recall.
        const structureMultiplier = isCorrectOrder ? 1.0 : 0.3;

        // [Final Score Calculation]
        // Reliability check: Even if strokes match, if shape is unrecognizable (< 60%), it's a failure.
        let totalScore = baseShapeScore * structureMultiplier;

        // If shape is very poor, force-cap the score to prevent false positives
        if (shapeSimilarity < 0.6) {
            totalScore = Math.min(totalScore, 30);
        }

        return {
            isCorrectOrder,
            shapeSimilarity,
            totalScore: Math.round(totalScore),
            details: {
                strokeCount: { user: userPaths.length, ref: reference.strokes.length },
                startEndAccuracy,
                pathAccuracy,
                pointMapping: allPointsMapping
            }
        };
    }

    private static compareStrokesDetailed(userPoints: { x: number, y: number }[], refPoints: { x: number, y: number }[]): { startEndSim: number, pathSim: number, mapping: { user: { x: number, y: number }, ref: { x: number, y: number } }[] } {
        if (userPoints.length === 0 || refPoints.length === 0) return { startEndSim: 0, pathSim: 0, mapping: [] };

        const mapping = [
            { user: userPoints[0], ref: refPoints[0] },
            { user: userPoints[userPoints.length - 1], ref: refPoints[refPoints.length - 1] }
        ];

        // Distance check for start and end points
        const startDist = this.getDist(userPoints[0], refPoints[0]);
        const endDist = this.getDist(userPoints[userPoints.length - 1], refPoints[refPoints.length - 1]);
        const startEndSim = (this.distToSim(startDist) + this.distToSim(endDist)) / 2;

        // Check points along the path (with interpolation)
        let midSimSum = 0;
        const steps = 10;
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const uIdx = Math.floor(t * userPoints.length);

            // Interpolate ref points
            const refT = t * (refPoints.length - 1);
            const rIdx = Math.floor(refT);
            const rNextIdx = Math.min(rIdx + 1, refPoints.length - 1);
            const rFraction = refT - rIdx;

            const interpolatedRef = {
                x: refPoints[rIdx].x + (refPoints[rNextIdx].x - refPoints[rIdx].x) * rFraction,
                y: refPoints[rIdx].y + (refPoints[rNextIdx].y - refPoints[rIdx].y) * rFraction
            };

            const dist = this.getDist(userPoints[uIdx], interpolatedRef);
            midSimSum += this.distToSim(dist);
            mapping.push({ user: userPoints[uIdx], ref: interpolatedRef });
        }

        const pathSim = midSimSum / (steps - 1);
        return { startEndSim, pathSim, mapping };
    }

    private static distToSim(dist: number): number {
        // 0 distance = 1.0 similarity
        // 0.1 distance = ~0.78 similarity
        // 0.2 distance = ~0.37 similarity
        // 0.3 distance = ~0.10 similarity (Significant penalty for 30% deviation)
        return Math.exp(-25 * Math.pow(dist, 2));
    }

    private static getDist(p1: { x: number, y: number }, p2: { x: number, y: number }): number {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }
}

import { FSRSState, LearningProgress } from '@/types/learning';

/**
 * FSRS v4 (Free Spaced Repetition Scheduler) Core Engine
 * Reference: https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler
 */

export const DEFAULT_WEIGHTS = [
    0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61
];

export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export interface FSRSReviewResult {
    progress: LearningProgress;
    log: {
        rating: Rating;
        stability: number;
        difficulty: number;
        elapsed_days: number;
        scheduled_days: number;
        review_at: string;
    };
}

/**
 * FSRS v4 복습 주기 계산기
 */
export class FSRSEngine {
    private w: number[];
    private requestRetention: number = 0.9;

    constructor(weights: number[] = DEFAULT_WEIGHTS) {
        this.w = weights;
    }

    /**
     * 초기 항목 학습 (New Item)
     */
    init(rating: Rating): LearningProgress {
        const stability = this.w[rating - 1];
        const difficulty = this.clamp(this.w[4] - (rating - 3) * this.w[5], 1, 10);

        return {
            id: '', // To be filled by database
            user_id: '',
            item_id: '',
            item_type: 'vocabulary',
            stability,
            difficulty,
            elapsed_days: 0,
            scheduled_days: this.calculateInterval(stability),
            lapses: 0,
            state: rating === 1 ? FSRSState.Learning : FSRSState.Review,
            status: stability > 10 ? 'mastered' : 'learning',
            next_review_at: '',
            last_review_at: new Date().toISOString()
        };
    }

    /**
     * 기존 항목 복습 및 상태 업데이트
     */
    review(current: LearningProgress, rating: Rating): LearningProgress {
        const last_review_at = current.last_review_at ? new Date(current.last_review_at) : new Date();
        const now = new Date();
        const elapsed_days = Math.max(0, (now.getTime() - last_review_at.getTime()) / (1000 * 60 * 60 * 24));

        const retrievability = this.calculateRetrievability(current.stability, elapsed_days);

        let newStability: number;
        let newDifficulty: number;
        let newLapses = current.lapses;
        let newState = current.state;

        // Difficulty Update
        newDifficulty = this.clamp(current.difficulty - this.w[6] * (rating - 3), 1, 10);

        if (rating === 1) { // Again (Failure)
            newStability = this.w[11] * Math.pow(newDifficulty, this.w[12]) * Math.pow(current.stability + 1, this.w[13]) * Math.exp(this.w[14] * (1 - retrievability));
            newLapses += 1;
            newState = FSRSState.Relearning;
        } else { // Success
            const successStability = current.stability * (1 + Math.exp(this.w[8]) * (11 - newDifficulty) * Math.pow(current.stability, this.w[9]) * (Math.exp(this.w[10] * (1 - retrievability)) - 1));

            // Hard 가중치 적용 (Hard는 안정성 상승폭이 낮음)
            newStability = rating === 2 ? successStability * this.w[7] : successStability;
            newState = FSRSState.Review;
        }

        const scheduled_days = this.calculateInterval(newStability);

        return {
            ...current,
            stability: newStability,
            difficulty: newDifficulty,
            elapsed_days,
            scheduled_days,
            lapses: newLapses,
            state: newState,
            last_review_at: now.toISOString(),
            status: newStability > 30 ? 'mastered' : (newStability > 10 ? 'reviewing' : 'learning')
        };
    }

    private calculateRetrievability(stability: number, elapsed_days: number): number {
        return Math.pow(1 + elapsed_days / (9 * stability), -1);
    }

    private calculateInterval(stability: number): number {
        const interval = 9 * stability * (1 / this.requestRetention - 1);
        return Math.max(1, Math.round(interval));
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }
}

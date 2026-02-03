import { FSRSState, LearningProgress } from '@/types/learning';
import { FSRSEngine, Rating } from './fsrs';

/**
 * FSRS v4 (Free Spaced Repetition Scheduler) Wrapper
 */

export const calculateFSRS = (
    rating: Rating,
    current: LearningProgress
): LearningProgress => {
    const engine = new FSRSEngine();

    // 신규 항목인 경우 초기화
    if (current.stability === 0 && current.state === FSRSState.New) {
        return engine.init(rating);
    }

    // 기존 항목인 경우 복습 알고리즘 실행
    return engine.review(current, rating);
};

export const getNextReviewDate = (days: number): Date => {
    const date = new Date();
    // 분 단위 정밀도를 위해 ms 단위로 가산
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    return date;
};

/**
 * FSRS 기반 망각 위험도(Retrievability) 계산
 * @param stability 현재 안정도
 * @param lastReviewAt 마지막 복습 시점
 */
export const calculateRetrievability = (stability: number, lastReviewAt: string): number => {
    if (stability === 0) return 0;
    const now = new Date();
    const last = new Date(lastReviewAt);
    const elapsedDays = Math.max(0, (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

    // FSRS v4 Formula: R = (1 + elapsed_days / (9 * stability))^-1
    return Math.pow(1 + elapsedDays / (9 * stability), -1);
};

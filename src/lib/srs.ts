/**
 * Simple SRS (Spaced Repetition System) implementation based on SM-2 algorithm.
 */

export interface SRSData {
    interval: number; // Days until next review
    repetition: number; // Number of successful consecutive repetitions
    ease_factor: number; // Ease factor for calculating interval
}

/**
 * Calculates new SRS data based on user performance.
 * @param quality 0-5 (0: total failure, 5: perfect response)
 * @param currentData Current SRS state
 */
export const calculateSRS = (quality: number, currentData: SRSData): SRSData => {
    let { interval, repetition, ease_factor } = currentData;

    if (quality >= 3) {
        if (repetition === 0) {
            interval = 1;
        } else if (repetition === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * ease_factor);
        }
        repetition += 1;
    } else {
        repetition = 0;
        interval = 1;
    }

    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease_factor < 1.3) ease_factor = 1.3;

    return { interval, repetition, ease_factor };
};

export const getNextReviewDate = (interval: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + interval);
    return date;
};

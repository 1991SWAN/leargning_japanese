/**
 * Calculates the Levenshtein distance between two strings.
 * This is a traditional algorithm for string similarity measurement (non-AI).
 */
export const getLevenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];

    // Clean strings: remove spaces and punctuation
    const cleanA = a.replace(/[\s\p{P}]/gu, '').toLowerCase();
    const cleanB = b.replace(/[\s\p{P}]/gu, '').toLowerCase();

    for (let i = 0; i <= cleanB.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= cleanA.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= cleanB.length; i++) {
        for (let j = 1; j <= cleanA.length; j++) {
            if (cleanB.charAt(i - 1) === cleanA.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[cleanB.length][cleanA.length];
};

export const getSimilarityFeedback = (distance: number, originalLength: number): 'correct' | 'near' | 'wrong' => {
    if (distance === 0) return 'correct';
    if (distance <= 1 || (distance / originalLength) < 0.25) return 'near';
    return 'wrong';
};

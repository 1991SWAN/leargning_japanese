/**
 * Reference data for Kana characters (normalized to 0-1 scale)
 */

export interface StrokeData {
    points: { x: number; y: number }[];
}

export interface KanaReference {
    char: string;
    strokes: StrokeData[];
}

export const KANA_REFERENCE_DATA: Record<string, KanaReference> = {
    'あ': {
        char: 'あ',
        strokes: [
            { points: [{ x: 0.25, y: 0.32 }, { x: 0.75, y: 0.32 }] }, // Stroke 1: Horizontal
            { points: [{ x: 0.5, y: 0.15 }, { x: 0.5, y: 0.65 }] }, // Stroke 2: Vertical
            {
                points: [
                    { x: 0.65, y: 0.4 }, { x: 0.45, y: 0.55 }, { x: 0.35, y: 0.75 },
                    { x: 0.5, y: 0.85 }, { x: 0.75, y: 0.75 }, { x: 0.85, y: 0.6 },
                    { x: 0.7, y: 0.45 }, { x: 0.4, y: 0.45 }
                ]
            }, // Stroke 3: Complex Loop
        ]
    },
    'い': {
        char: 'い',
        strokes: [
            { points: [{ x: 0.3, y: 0.25 }, { x: 0.25, y: 0.5 }, { x: 0.28, y: 0.75 }, { x: 0.35, y: 0.8 }] },
            { points: [{ x: 0.7, y: 0.3 }, { x: 0.75, y: 0.55 }] },
        ]
    },
    'う': {
        char: 'う',
        strokes: [
            { points: [{ x: 0.4, y: 0.15 }, { x: 0.6, y: 0.25 }] },
            { points: [{ x: 0.3, y: 0.45 }, { x: 0.7, y: 0.5 }, { x: 0.65, y: 0.7 }, { x: 0.4, y: 0.85 }] },
        ]
    }
};

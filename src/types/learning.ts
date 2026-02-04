/**
 * 학습 시스템 공통 타입 정의
 */

// JLPT 어휘 타입
export interface Vocabulary {
    id: string;
    kanji: string;
    furigana: string;
    meaning: string;
    jlpt_level: number;
    part_of_speech?: string;
    category?: string;
    tags?: string[];
    examples?: GrammarExample[];
    created_at?: string;
    srs_data?: Partial<LearningProgress> | null;
}

// JLPT 문법 타입
export interface Grammar {
    id: string;
    pattern: string;
    meaning: string;
    connection: string;
    examples?: GrammarExample[]; // Deprecated, kept for legacy compatibility
    grammar_examples?: GrammarExamplesTable[]; // New Relation
    jlpt_level: number;
    conversation_level?: number; // 1(Low) ~ 5(High)
    is_core?: boolean;
    tags?: string[];
}

export interface GrammarExample {
    jp: string;
    ko: string;
    reading?: string;
}

export interface GrammarExamplesTable {
    id: string;
    grammar_id: string;
    japanese: string;
    korean: string;
    english?: string;
    created_at?: string;
}

// AI 채팅 메시지 타입
export interface ChatMessage {
    role: 'user' | 'ai' | 'system';
    content: string;
    timestamp: number;
}

// FSRS 기반 학습 상태 타입
export interface FSRSMastery {
    id: string;
    user_id: string;
    item_type: 'KANA' | 'VOCAB' | 'GRAMMAR';
    item_id: string;
    stability: number;
    difficulty: number;
    reps: number;
    lapses: number;
    state: number; // 0: New, 1: Learning, 2: Review, 3: Relearning
    last_review: string | null;
    next_review: string;
    created_at?: string;
    updated_at?: string;
}

// Deprecated: Old SRS 상태 타입 (SM-2 호환용으로 유지하되 점차 FSRSMastery로 이관)
export interface LearningProgress {
    id: string;
    user_id: string;
    vocabulary_id: string;
    interval: number;
    repetition: number;
    ease_factor: number;
    next_review_at: string;
    last_reviewed_at?: string;
    status: 'learning' | 'reviewing' | 'mastered';
    updated_at?: string;
}

// 대시보드 통계 타입
export interface StudyStats {
    total_learned: number;
    added_today: number;
    streak_days: number;
    mastered_count: number;
}

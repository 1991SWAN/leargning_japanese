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
    examples: GrammarExample[];
    jlpt_level: number;
    tags?: string[];
}

export interface GrammarExample {
    jp: string;
    ko: string;
    reading?: string;
}

// AI 채팅 메시지 타입
export interface ChatMessage {
    role: 'user' | 'ai' | 'system';
    content: string;
    timestamp: number;
}

// SRS 학습 상태 타입
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

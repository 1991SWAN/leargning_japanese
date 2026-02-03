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

// FSRS v4 학습 상태 열거형
export enum FSRSState {
    New = 0,
    Learning = 1,
    Review = 2,
    Relearning = 3
}

// 통합 학습 기록 타입 (FSRS v4 사양)
export interface LearningProgress {
    id: string;
    user_id: string;
    item_id: string; // vocabulary_id, kana_id 등 통합 관리
    item_type: 'vocabulary' | 'kana' | 'grammar';

    // FSRS 핵심 파라미터
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    lapses: number;
    state: FSRSState;

    next_review_at: string;
    last_review_at?: string;

    // UI 표시용 (마스터 상태 등)
    status: 'learning' | 'reviewing' | 'mastered';
    updated_at?: string;
}

// 평가 로그 타입
export interface SRSLog {
    id: string;
    user_id: string;
    item_id: string;
    rating: 1 | 2 | 3 | 4; // Again, Hard, Good, Easy
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    review_at: string;
}

// 대시보드 통계 타입
export interface StudyStats {
    total_learned: number;
    added_today: number;
    streak_days: number;
    mastered_count: number;
}

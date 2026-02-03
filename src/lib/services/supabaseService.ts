import { supabase } from '../supabase';
import { Vocabulary, Grammar, LearningProgress } from '@/types/learning';

/**
 * Vocabulary 관련 데이터 서비스
 */
export const vocabService = {
    /**
     * 오늘의 학습/복습 세션 단어들을 가져옵니다.
     * 복습 대상(due) + 새로운 학습 대상(new)을 조합하여 반환합니다.
     */
    /**
     * 오늘의 학습/복습 세션 단어들을 가져옵니다.
     * 복습 대상(due) + 새로운 학습 대상(new)을 조합하여 반환합니다.
     */
    async getDailyVocab(limit: number = 30): Promise<Vocabulary[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            const { data } = await supabase.from('vocabulary').select('*').limit(limit).order('id');
            return data || [];
        }

        // 통합 learning_records 테이블에서 복습 대상 + 신규 단어 조합 추출
        const { data, error } = await supabase
            .from('vocabulary')
            .select(`
                *,
                learning_records!left (
                    stability,
                    difficulty,
                    lapses,
                    state,
                    next_review_at,
                    status
                )
            `)
            .eq('learning_records.item_type', 'vocabulary')
            .or(`learning_records.is.null,learning_records.next_review_at.lte.${new Date().toISOString()}`)
            .limit(limit);

        if (error) {
            console.error('Error fetching study session:', error);
            return [];
        }

        return data.map((item: any) => ({
            ...item,
            srs_data: item.learning_records?.[0] || null
        }));
    },

    /**
     * SRS 기반 전체 학습 진행률 및 통계를 가져옵니다.
     */
    async getLMSStats() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { total: 0, learned: 0, due_today: 0 };

        const { count: totalCount } = await supabase.from('vocabulary').select('*', { count: 'exact', head: true });
        const { count: learnedCount } = await supabase.from('learning_records').select('*', { count: 'exact', head: true }).eq('status', 'reviewing').eq('item_type', 'vocabulary');
        const { count: dueCount } = await supabase.from('learning_records').select('*', { count: 'exact', head: true }).lte('next_review_at', new Date().toISOString()).eq('item_type', 'vocabulary');

        return {
            total: totalCount || 0,
            learned: learnedCount || 0,
            due_today: dueCount || 0
        };
    },

    /**
     * 단어의 SRS 상태를 업데이트합니다. (Upsert)
     */
    async updateSRS(vocabId: string, srsData: Partial<LearningProgress>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('learning_records')
            .upsert({
                user_id: user.id,
                item_id: vocabId,
                item_type: 'vocabulary',
                ...srsData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,item_id,item_type' })
            .select();

        if (error) throw error;
        return data;
    },

    /**
     * 모든 학습 진행 기록을 가져옵니다. (Mastery Board용)
     */
    async getAllProgress(): Promise<LearningProgress[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('learning_records')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching all progress:', error);
            return [];
        }

        return data as LearningProgress[];
    }
};

/**
 * Grammar 관련 데이터 서비스
 */
export const grammarService = {
    /**
     * 문법 강의 리스트를 가져옵니다.
     */
    async getLessons() {
        const { data, error } = await supabase
            .from('grammar')
            .select('*, grammar_examples(*)')
            .order('jlpt_level', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * 새로운 문법 항목을 추가합니다.
     */
    async addGrammar(pattern: string, level: number, meaning: string, connection: string, examples: any[]) {
        const { data, error } = await supabase
            .from('grammar')
            .insert([{
                pattern,
                jlpt_level: level,
                meaning,
                connection,
                examples
            }])
            .select();

        if (error) throw error;
        return data?.[0];
    }
};

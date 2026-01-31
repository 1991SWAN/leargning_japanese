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
    async getDailyVocab(limit: number = 30): Promise<Vocabulary[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            const { data } = await supabase.from('vocabulary').select('*').limit(limit).order('id');
            return data || [];
        }

        // 복습 대상(due_at <= now) + 새로운 단어(no user_vocab record) 추출
        // 실제로는 RPC 또는 복합 쿼리가 필요함. 여기서는 간단히 join 쿼리 형태 제안
        const { data, error } = await supabase
            .from('vocabulary')
            .select(`
                *,
                user_vocabulary!left (
                    interval,
                    repetition,
                    ease_factor,
                    next_review_at,
                    status
                )
            `)
            .or(`user_vocabulary.is.null,user_vocabulary.next_review_at.lte.${new Date().toISOString()}`)
            .limit(limit);

        if (error) {
            console.error('Error fetching study session:', error);
            return [];
        }

        return data.map((item: any) => ({
            ...item,
            srs_data: item.user_vocabulary?.[0] || null
        }));
    },

    /**
     * SRS 기반 전체 학습 진행률 및 통계를 가져옵니다.
     */
    async getLMSStats() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { total: 0, learned: 0, due_today: 0 };

        const { count: totalCount } = await supabase.from('vocabulary').select('*', { count: 'exact', head: true });
        const { count: learnedCount } = await supabase.from('user_vocabulary').select('*', { count: 'exact', head: true }).eq('status', 'reviewing');
        const { count: dueCount } = await supabase.from('user_vocabulary').select('*', { count: 'exact', head: true }).lte('next_review_at', new Date().toISOString());

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
            .from('user_vocabulary')
            .upsert({
                user_id: user.id,
                vocabulary_id: vocabId,
                ...srsData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,vocabulary_id' })
            .select();

        if (error) throw error;
        return data;
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

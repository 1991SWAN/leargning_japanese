import { useState, useEffect, useCallback } from 'react';
import { vocabService, grammarService } from '../services/supabaseService';
import { SAMPLE_VOCAB } from '@/constants/vocabulary';
import { SAMPLE_GRAMMAR } from '@/constants/grammar';
import { Vocabulary, Grammar } from '@/types/learning';

/**
 * 어휘 데이터를 관리하는 커스텀 훅
 */
export function useVocabulary() {
    const [vocabData, setVocabData] = useState<Vocabulary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            console.log('Fetching vocabulary data...');
            const data = await vocabService.getDailyVocab(30);
            if (data && data.length > 0) {
                setVocabData(data);
                console.log('Vocabulary data fetched from DB:', data.length);
            } else {
                setVocabData(SAMPLE_VOCAB);
                console.log('No vocabulary data in DB, using sample data.');
            }
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch vocabulary:', err);
            setError(err);
            setVocabData(SAMPLE_VOCAB);
        } finally {
            console.log('Vocabulary loading finished.');
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { vocabData, isLoading, error, refresh };
}

/**
 * LMS 통계를 관리하는 커스텀 훅
 */
export function useLMSStats() {
    const [stats, setStats] = useState<{ total: number, learned: number, due_today: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            console.log('Fetching LMS stats...');
            const data = await vocabService.getLMSStats();
            setStats(data);
            console.log('LMS stats fetched:', data);
        } catch (err: any) {
            console.error('Failed to fetch LMS stats:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { stats, isLoading, refresh };
}

/**
 * 문법 데이터를 관리하는 커스텀 훅
 */
export function useGrammar() {
    const [grammarData, setGrammarData] = useState<Grammar[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            console.log('Fetching grammar data...');
            const data = await grammarService.getLessons();
            if (data && data.length > 0) {
                setGrammarData(data as any as Grammar[]);
                console.log('Grammar data fetched from DB:', data.length);
            } else {
                setGrammarData(SAMPLE_GRAMMAR as any as Grammar[]);
                console.log('No grammar data in DB, using sample data.');
            }
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch grammar:', err);
            setError(err);
            setGrammarData(SAMPLE_GRAMMAR as any as Grammar[]);
        } finally {
            console.log('Grammar loading finished.');
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { grammarData, isLoading, error, refresh };
}

/**
 * 모든 학습 진행 데이터를 관리하는 커스텀 훅 (Mastery Board용)
 */
export function useMasteryData() {
    const [progressData, setProgressData] = useState<import('@/types/learning').LearningProgress[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await vocabService.getAllProgress();
            setProgressData(data);
        } catch (err) {
            console.error('Failed to fetch mastery data:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { progressData, isLoading, refresh };
}

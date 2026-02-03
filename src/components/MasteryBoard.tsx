'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LearningProgress, FSRSState, Vocabulary } from '@/types/learning';
import { HIRAGANA, KATAKANA } from '@/constants/kana';

interface MasteryBoardProps {
    progressItems: LearningProgress[];
    vocabList: Vocabulary[];
}

export default function MasteryBoard({ progressItems, vocabList }: MasteryBoardProps) {
    const [filterType, setFilterType] = useState<'all' | 'kana' | 'vocabulary'>('all');

    // Stability based color mapping
    const getStabilityColor = (stability: number) => {
        if (stability >= 30) return 'rgba(34, 211, 238, 1)'; // Cyan-400 (Mastered)
        if (stability >= 7) return 'rgba(129, 140, 248, 1)';  // Indigo-400 (Stable)
        if (stability >= 1) return 'rgba(52, 211, 153, 1)';  // Emerald-400 (Learning)
        return 'rgba(248, 113, 113, 1)';                      // Red-400 (Volatile)
    };

    const getStabilityGlow = (stability: number) => {
        const color = getStabilityColor(stability);
        const opacity = Math.min(0.1 + (stability / 100), 0.4);
        return `0 0 20px ${color.replace('1)', `${opacity})`)}`;
    };

    // Combine data for visualization
    const masteryItems = useMemo(() => {
        const items: { id: string; text: string; stability: number; type: string }[] = [];

        // 1. Process Kana
        HIRAGANA.forEach(k => {
            const prog = progressItems.find(p => p.item_id === k.char && p.item_type === 'kana');
            items.push({
                id: k.char,
                text: k.char,
                stability: prog?.stability || 0,
                type: 'kana'
            });
        });

        KATAKANA.forEach(k => {
            const prog = progressItems.find(p => p.item_id === k.char && p.item_type === 'kana');
            items.push({
                id: k.char,
                text: k.char,
                stability: prog?.stability || 0,
                type: 'kana'
            });
        });

        // 2. Process Vocabulary
        vocabList.forEach(v => {
            const prog = progressItems.find(p => p.item_id === v.id && p.item_type === 'vocabulary');
            if (prog) { // Only show learned vocab
                items.push({
                    id: v.id,
                    text: v.kanji || v.furigana,
                    stability: prog.stability,
                    type: 'vocabulary'
                });
            }
        });

        return items;
    }, [progressItems, vocabList]);

    const filteredItems = useMemo(() => {
        if (filterType === 'all') return masteryItems;
        return masteryItems.filter(i => i.type === filterType);
    }, [masteryItems, filterType]);

    return (
        <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto py-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Mastery Board</h2>
                    <p className="text-gray-400 font-medium">Visualizing your knowledge stability via FSRS intelligence.</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                    {(['all', 'kana', 'vocabulary'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-white text-primary shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="glass-panel p-8 md:p-12 rounded-[40px] border border-white/5 relative overflow-hidden min-h-[600px]">
                {/* Background Decorative Glow */}
                <div className="absolute top-1/4 left-1/4 size-96 bg-primary/10 blur-[150px] -z-10 animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 size-96 bg-secondary/10 blur-[150px] -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

                <div className="flex flex-wrap justify-center gap-4 relative z-10">
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map((item) => (
                            <motion.div
                                key={`${item.type}-${item.id}`}
                                layout
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                whileHover={{ scale: 1.2, zIndex: 50 }}
                                className="relative group"
                            >
                                <div
                                    className="size-12 md:size-16 rounded-2xl flex items-center justify-center jp-text text-xl md:text-2xl font-black cursor-help transition-all duration-500"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                        border: `1px solid ${getStabilityColor(item.stability).replace('1)', '0.2)')}`,
                                        boxShadow: getStabilityGlow(item.stability),
                                        color: item.stability > 0 ? 'white' : 'rgba(255,255,255,0.2)'
                                    }}
                                >
                                    {item.text}
                                </div>

                                {/* Legend Hover Info */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] w-32">
                                    <div className="glass-card p-3 rounded-xl border border-white/10 shadow-2xl text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.type}</p>
                                        <p className="text-xs font-bold text-white mb-2">{item.stability.toFixed(1)} Days</p>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full transition-all duration-1000"
                                                style={{
                                                    width: `${Math.min(item.stability, 100)}%`,
                                                    backgroundColor: getStabilityColor(item.stability)
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="w-2 h-2 bg-background-dark border-r border-b border-white/10 rotate-45 mx-auto -mt-1" />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Legend */}
                <div className="absolute bottom-8 right-8 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-cyan-400" />
                        <span className="text-[10px] font-black text-gray-500 uppercase">Mastered (30d+)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-indigo-400" />
                        <span className="text-[10px] font-black text-gray-500 uppercase">Stable (7d+)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-emerald-400" />
                        <span className="text-[10px] font-black text-gray-500 uppercase">Learning (1d+)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-red-400" />
                        <span className="text-[10px] font-black text-gray-500 uppercase">Volatile (&lt;1d)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

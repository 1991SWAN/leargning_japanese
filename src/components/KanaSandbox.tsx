'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HIRAGANA, KATAKANA } from '../constants/kana';
import { preloadJapanese } from '@/lib/tts';
import RecallStudio from './RecallStudio';

/**
 * KanaSandbox: A "Dummy" version of the Kana Chart tab
 * used for UI experimentation and lab testing.
 */
export default function KanaSandbox() {
    const [activeTab, setActiveTab] = useState<'hiragana' | 'katakana'>('hiragana');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChar, setSelectedChar] = useState<string | null>(null);
    const [studioMode, setStudioMode] = useState<'practice' | 'review'>('practice');
    const [handwritingItems, setHandwritingItems] = useState<{ text: string, reading: string }[]>([]);

    const kanaList = activeTab === 'hiragana' ? HIRAGANA : KATAKANA;

    const handleSelect = (char: string, forcedMode?: 'practice' | 'review') => {
        setSelectedChar(char);
        if (forcedMode) setStudioMode(forcedMode);
        setHandwritingItems(kanaList.map(k => ({ text: k.char, reading: k.romaji })));
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col gap-8 items-center w-full max-w-4xl mx-auto pt-10">
            {/* Main: Kana Explorer Grid (Dummy Version) */}
            <div className="w-full space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-bold dark:text-white">Kana Lab Explorer</h1>
                            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-[8px] font-black uppercase text-primary border border-primary/20">Dummy</span>
                        </div>
                        <p className="text-gray-400">Experimental UI Sandbox for Kana mastery.</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-3">
                        {/* Direct Review Button */}
                        <button
                            onClick={() => {
                                preloadJapanese(kanaList[0].char);
                                handleSelect(kanaList[0].char, 'review');
                            }}
                            className="h-11 px-6 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">psychology_alt</span>
                            Start Recall Review
                        </button>

                        {/* Custom Toggle Switch */}
                        <div className="flex h-11 w-64 items-center justify-center rounded-xl bg-white/5 p-1 border border-white/10">
                            <button
                                onClick={() => setActiveTab('hiragana')}
                                className={`flex grow items-center justify-center rounded-lg px-2 h-full text-sm font-bold transition-all ${activeTab === 'hiragana' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            >
                                Hiragana
                            </button>
                            <button
                                onClick={() => setActiveTab('katakana')}
                                className={`flex grow items-center justify-center rounded-lg px-2 h-full text-sm font-bold transition-all ${activeTab === 'katakana' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            >
                                Katakana
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid Content */}
                <div className="glass-panel rounded-2xl p-6 lg:p-8 shadow-2xl overflow-hidden bg-white/5 relative">
                    {/* Laboratory Background Hint */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                        <span className="material-symbols-outlined text-[300px]">science</span>
                    </div>

                    <div className="grid grid-cols-5 gap-3 md:gap-4 relative z-10">
                        {/* Headers */}
                        {['a', 'i', 'u', 'e', 'o'].map(vowel => (
                            <div key={vowel} className="text-center pb-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
                                {vowel}
                            </div>
                        ))}

                        {kanaList.map((item, index) => (
                            item.char === '' ? (
                                <div key={`empty-${index}`} className="aspect-square"></div>
                            ) : (
                                <motion.div
                                    key={`${activeTab}-${item.char}-${index}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        preloadJapanese(item.char);
                                        handleSelect(item.char, 'practice');
                                    }}
                                    className={`kana-card group relative rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer transition-all border border-white/10 bg-white/5 hover:border-primary/50 text-white`}
                                >
                                    <span className={`text-3xl font-kanji mb-1`}>
                                        {item.char}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase text-gray-500 group-hover:text-primary transition-colors`}>
                                        {item.romaji}
                                    </span>
                                </motion.div>
                            )
                        ))}
                    </div>

                    <div className="mt-8 flex items-center justify-center text-gray-500 text-[10px] font-medium tracking-wide uppercase relative z-10">
                        <span className="material-symbols-outlined text-[14px] mr-2">lab_profile</span>
                        UI Laboratory Mode: Edit freely without affecting production
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <RecallStudio
                    items={handwritingItems}
                    initialText={selectedChar}
                    mode={studioMode}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HIRAGANA, KATAKANA,
  HIRAGANA_DAKUTEN, KATAKANA_DAKUTEN,
  HIRAGANA_YOON, KATAKANA_YOON
} from '../constants/kana';
import { preloadJapanese } from '@/lib/tts';
import CinematicShell from './common/CinematicShell';

interface KanaChartProps {
  activeTab: 'hiragana' | 'katakana';
  onTabChange: (tab: 'hiragana' | 'katakana') => void;
  onSelect: (char: string, mode?: 'practice' | 'review', category?: 'basic' | 'dakuten' | 'yoon') => void;
}

export default function KanaChart({ activeTab, onTabChange, onSelect }: KanaChartProps) {
  const [activeCategory, setActiveCategory] = useState<'basic' | 'dakuten' | 'yoon'>('basic');

  const getKanaList = () => {
    if (activeTab === 'hiragana') {
      if (activeCategory === 'dakuten') return HIRAGANA_DAKUTEN;
      if (activeCategory === 'yoon') return HIRAGANA_YOON;
      return HIRAGANA;
    } else {
      if (activeCategory === 'dakuten') return KATAKANA_DAKUTEN;
      if (activeCategory === 'yoon') return KATAKANA_YOON;
      return KATAKANA;
    }
  };

  const kanaList = getKanaList();

  return (
    <div className="w-full h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key="cinematic-chart"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full h-full min-h-[calc(100vh-100px)]"
        >
          <CinematicShell levelColor="#3b82f6" id="kana-cinematic">
            <div className="max-w-6xl w-full px-4 md:px-6 py-10 md:py-20 flex flex-col gap-8 md:gap-12">
              {/* Header (Cinematic) */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="flex flex-col gap-2">
                  <span className="premium-tag w-fit border-blue-500/30 text-blue-400 bg-blue-500/10">Foundation</span>
                  <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Kana Mastery</h1>
                  <p className="text-white/40 font-medium text-sm md:text-lg">Master the building blocks of Japanese.</p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      preloadJapanese(kanaList[0].char);
                      onSelect(kanaList[0].char, 'review', activeCategory);
                    }}
                    className="px-6 md:px-8 py-3 md:py-4 rounded-2xl bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-[0_0_30px_rgba(59,130,246,0.5)] font-display flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">psychology_alt</span>
                    Start Recall Review
                  </button>
                </div>
              </div>

              {/* Main Explorer Card */}
              <div className="glass-panel border-white/10 rounded-3xl md:rounded-[48px] p-6 md:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
                {/* Sub-header inside card */}
                <div className="flex flex-col xl:flex-row xl:items-center gap-6 mb-10">
                  <div className="flex items-center gap-4">
                    <div className="size-1 h-8 bg-blue-500 rounded-full transition-all duration-1000 animate-pulse" />
                    <h2 className="text-xl md:text-2xl font-black text-white px-2 uppercase tracking-tight">Kana Explorer</h2>
                  </div>

                  <div className="flex gap-3 flex-wrap xl:ml-auto">
                    {/* Category Filter */}
                    <div className="flex h-11 items-center justify-center rounded-xl bg-white/5 p-1 border border-white/10">
                      {(['basic', 'dakuten', 'yoon'] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-4 xl:px-6 rounded-lg h-full text-[10px] font-black uppercase transition-all ${activeCategory === cat ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-white/40 hover:text-white/60'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Script Switcher */}
                    <div className="flex h-11 w-40 xl:w-48 items-center justify-center rounded-xl bg-white/5 p-1 border border-white/10">
                      <button onClick={() => onTabChange('hiragana')} className={`flex grow items-center justify-center rounded-lg h-full text-[10px] xl:text-xs font-black uppercase transition-all ${activeTab === 'hiragana' ? 'bg-white text-blue-600 shadow-xl' : 'text-white/40'}`}>Hiragana</button>
                      <button onClick={() => onTabChange('katakana')} className={`flex grow items-center justify-center rounded-lg h-full text-[10px] xl:text-xs font-black uppercase transition-all ${activeTab === 'katakana' ? 'bg-white text-blue-600 shadow-xl' : 'text-white/40'}`}>Katakana</button>
                    </div>
                  </div>
                </div>

                <div className={`grid ${activeCategory === 'yoon' ? 'grid-cols-3' : 'grid-cols-5'} gap-3 md:gap-6`}>
                  {/* Headers if NOT yoon */}
                  {activeCategory !== 'yoon' && ['a', 'i', 'u', 'e', 'o'].map(vowel => (
                    <div key={vowel} className="text-center pb-2 text-[10px] font-black uppercase tracking-widest text-blue-400/60 hidden md:block">
                      {vowel}
                    </div>
                  ))}

                  {kanaList.map((item, index) => (
                    item.char === '' ? (
                      <div key={`empty-${index}`} className="aspect-square"></div>
                    ) : (
                      <motion.div
                        key={`${activeTab}-${activeCategory}-cinematic-${item.char}-${index}`}
                        whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.06)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          preloadJapanese(item.char);
                          onSelect(item.char, 'practice', activeCategory);
                        }}
                        className="aspect-square rounded-2xl md:rounded-[32px] border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center cursor-pointer group transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:to-blue-500/10 transition-colors" />
                        <div className="flex flex-col items-center justify-center w-full h-full pt-2 md:pt-4 relative z-10">
                          <span className={`${activeCategory === 'yoon' ? 'text-6xl md:text-8xl' : 'text-4xl md:text-5xl'} font-kanji text-white/90 group-hover:text-blue-400 transition-colors duration-300 leading-none tracking-tighter`}>
                            {item.char}
                          </span>
                          <span className={`${activeCategory === 'yoon' ? 'text-[10px] md:text-xs' : 'text-[9px] md:text-[10px]'} font-black tracking-[0.2em] text-white/20 group-hover:text-blue-400/60 uppercase mt-4 md:mt-6`}>
                            {item.romaji}
                          </span>
                        </div>
                      </motion.div>
                    )
                  ))}
                </div>

                <div className="mt-12 flex items-center justify-center text-white/30 text-[10px] font-medium tracking-wide uppercase">
                  <span className="material-symbols-outlined text-[14px] mr-2">info</span>
                  Click any character to practice writing immediately
                </div>
              </div>
            </div>
          </CinematicShell>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { HIRAGANA, KATAKANA } from '../constants/kana';
import { preloadJapanese } from '@/lib/tts';

interface KanaChartProps {
  activeTab: 'hiragana' | 'katakana';
  onTabChange: (tab: 'hiragana' | 'katakana') => void;
  onSelect: (char: string) => void;
}

export default function KanaChart({ activeTab, onTabChange, onSelect }: KanaChartProps) {
  const kanaList = activeTab === 'hiragana' ? HIRAGANA : KATAKANA;

  return (
    <div className="flex flex-col gap-8 items-center w-full max-w-4xl mx-auto">

      {/* Main: Kana Explorer Grid */}
      <div className="w-full space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">Kana Explorer</h1>
            <p className="text-gray-400 mt-1">Master the building blocks of Japanese.</p>
          </div>

          {/* Custom Toggle Switch */}
          <div className="flex h-11 w-64 items-center justify-center rounded-xl bg-white/5 p-1 border border-white/10">
            <button
              onClick={() => onTabChange('hiragana')}
              className={`flex grow items-center justify-center rounded-lg px-2 h-full text-sm font-bold transition-all ${activeTab === 'hiragana' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              Hiragana
            </button>
            <button
              onClick={() => onTabChange('katakana')}
              className={`flex grow items-center justify-center rounded-lg px-2 h-full text-sm font-bold transition-all ${activeTab === 'katakana' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              Katakana
            </button>
          </div>
        </div>

        {/* Grid Content */}
        <div className="glass-panel rounded-2xl p-6 lg:p-8 shadow-2xl overflow-hidden bg-white/5">
          <div className="grid grid-cols-5 gap-3 md:gap-4">
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
                    onSelect(item.char);
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

          <div className="mt-8 flex items-center justify-center text-gray-500 text-[10px] font-medium tracking-wide uppercase">
            <span className="material-symbols-outlined text-[14px] mr-2">info</span>
            Click any character to practice writing immediately
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HIRAGANA, KATAKANA, KanaItem } from '../constants/kana';
import { speakJapanese } from '@/lib/tts';

interface KanaChartProps {
  activeTab: 'hiragana' | 'katakana';
  onTabChange: (tab: 'hiragana' | 'katakana') => void;
  onSelect: (char: string) => void;
}

export default function KanaChart({ activeTab, onTabChange, onSelect }: KanaChartProps) {
  const [selectedChar, setSelectedChar] = useState<KanaItem>(HIRAGANA[0]);
  const kanaList = activeTab === 'hiragana' ? HIRAGANA : KATAKANA;

  // Audio Playback using centralized TTS engine
  const playAudio = (text: string) => {
    speakJapanese(text);
  };

  // Selected character change effect (auto-sync when tab changes or initial load)
  useMemo(() => {
    const defaultChar = kanaList.find(c => c.char !== '') || kanaList[0];
    setSelectedChar(defaultChar);
  }, [activeTab, kanaList]);

  // Mock data for examples (In a real app, this would come from a database or constants)
  const examples = useMemo(() => {
    const char = selectedChar.char;

    // Enhanced example mapping for key characters
    const exampleMap: Record<string, { word: string; reading: string; meaning: string }[]> = {
      'あ': [
        { word: '飴 (あめ)', reading: 'Ame', meaning: 'Candy' },
        { word: '青 (あお)', reading: 'Ao', meaning: 'Blue' },
        { word: '秋 (あき)', reading: 'Aki', meaning: 'Autumn' },
        { word: '朝 (あさ)', reading: 'Asa', meaning: 'Morning' },
        { word: '足 (あし)', reading: 'Ashi', meaning: 'Foot/Leg' }
      ],
      'い': [
        { word: '家 (いえ)', reading: 'Ie', meaning: 'House' },
        { word: '池 (いけ)', reading: 'Ike', meaning: 'Pond' },
        { word: '犬 (いぬ)', reading: 'Inu', meaning: 'Dog' },
        { word: '石 (いし)', reading: 'Ishi', meaning: 'Stone' },
        { word: '苺 (いちご)', reading: 'Ichigo', meaning: 'Strawberry' }
      ],
      'ア': [
        { word: 'アイス', reading: 'Aisu', meaning: 'Ice Cream' },
        { word: 'アジア', reading: 'Ajia', meaning: 'Asia' },
        { word: 'アメリカ', reading: 'Amerika', meaning: 'America' },
        { word: 'アフリカ', reading: 'Afurika', meaning: 'Africa' },
        { word: 'アニメ', reading: 'Anime', meaning: 'Animation' }
      ],
      'イ': [
        { word: 'インク', reading: 'Inku', meaning: 'Ink' },
        { word: 'イメージ', reading: 'Imēji', meaning: 'Image' },
        { word: 'イタリア', reading: 'Itaria', meaning: 'Italy' },
        { word: 'インド', reading: 'Indo', meaning: 'India' },
        { word: 'イベント', reading: 'Ibento', meaning: 'Event' }
      ]
    };

    if (exampleMap[char]) return exampleMap[char];

    // Generic fallback for other characters
    return [
      { word: `${char} (san)`, reading: `${selectedChar.romaji}san`, meaning: 'Example Word' },
      { word: `${char} (michi)`, reading: `${selectedChar.romaji}michi`, meaning: 'Example Word' },
      { word: `${char} (hana)`, reading: `${selectedChar.romaji}hana`, meaning: 'Example Word' },
      { word: `${char} (yume)`, reading: `${selectedChar.romaji}yume`, meaning: 'Example Word' }
    ];
  }, [selectedChar, activeTab]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full max-w-7xl mx-auto">

      {/* Left: Kana Explorer Grid */}
      <div className="flex-1 w-full space-y-6">
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
                    setSelectedChar(item);
                    playAudio(item.char);
                  }}
                  className={`kana-card group relative rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer transition-all border-2 ${selectedChar.char === item.char ? 'bg-white dark:bg-white/10 border-primary shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 border hover:border-primary/50'}`}
                >
                  <span className={`text-3xl font-kanji mb-1 ${selectedChar.char === item.char ? 'text-primary dark:text-white' : 'text-white'}`}>
                    {item.char}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${selectedChar.char === item.char ? 'text-primary dark:text-primary-light' : 'text-gray-500'}`}>
                    {item.romaji}
                  </span>

                  {/* Hover Audio Icon */}
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-primary text-sm">volume_up</span>
                  </div>
                </motion.div>
              )
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center text-gray-500 text-[10px] font-medium tracking-wide uppercase">
            <span className="material-symbols-outlined text-[14px] mr-2">info</span>
            Select a character to see details and vocabulary
          </div>
        </div>
      </div>

      {/* Right: Detail Sidebar */}
      <aside className="w-full lg:w-[380px] space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedChar.char}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-panel rounded-2xl p-6 shadow-xl space-y-6 border-l-4 border-l-primary bg-white/5"
          >
            {/* Header Info */}
            <div className="flex items-center gap-6">
              <div className="size-24 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                <span className="text-6xl font-kanji text-white">{selectedChar.char}</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white capitalize">{activeTab} '{selectedChar.romaji}'</h3>
                <p className="text-gray-400 text-sm mt-1">Gojūon position detected.</p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-blue-400 text-[10px] font-black uppercase">Basic</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-blue-400 text-[10px] font-black uppercase">Level 1</span>
                </div>
              </div>
            </div>

            {/* Examples Section - Expanded */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h4 className="text-sm font-bold text-gray-200">Example Vocabulary</h4>
                <span className="text-[10px] text-gray-500 font-bold uppercase">{examples.length} Items Found</span>
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                {examples.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => playAudio(ex.word.replace(/\(.*\)/, '').trim())}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-white/5 rounded-xl flex items-center justify-center text-lg font-kanji text-white group-hover:text-primary transition-colors">
                        {ex.word.split(' ')[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{ex.reading}</span>
                        <span className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors">{ex.meaning}</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-gray-600 group-hover:text-primary text-sm opacity-0 group-hover:opacity-100 transition-all">volume_up</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => onSelect(selectedChar.char)}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-xl font-black transition-all hover:bg-primary-light shadow-xl shadow-primary/25 group active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">edit</span>
              Practice Writing
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Pro Tips Card */}
        <div className="glass-panel bg-gradient-to-br from-primary/10 to-transparent rounded-2xl p-5 border-white/10">
          <div className="flex items-start gap-4">
            <div className="bg-primary/20 rounded-xl p-2 text-primary">
              <span className="material-symbols-outlined text-[20px]">lightbulb</span>
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">Learning Tip</h5>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed font-medium">
                Try to associate "{selectedChar.char}" with a familiar shape. Visualization is key to long-term memory.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

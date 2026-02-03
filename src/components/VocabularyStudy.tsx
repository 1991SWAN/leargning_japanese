'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { speakJapanese } from '@/lib/tts';
import FuriganaText from './common/FuriganaText';
import { Vocabulary } from '@/types/learning';

interface VocabProps {
  vocabList: Vocabulary[];
  onSelectWriting: (wordId: string) => void;
}

export default function VocabularyStudy({ vocabList, onSelectWriting }: VocabProps) {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [isShuffle, setIsShuffle] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const shuffledList = useMemo(() => {
    if (!isShuffle) return vocabList;
    return [...vocabList].sort(() => Math.random() - 0.5);
  }, [vocabList, isShuffle]);

  const filteredList = useMemo(() => {
    return vocabList.filter(v =>
      (v.kanji || v.furigana || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.meaning || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vocabList, searchTerm]);

  const toggleShuffle = () => setIsShuffle(!isShuffle);

  const startStudySession = (wordId?: string) => {
    onSelectWriting(wordId || shuffledList[0]?.id || '');
  };

  const sanitizeForTTS = (text: string) => text.replace(/\[[^\]]+\]/g, '');

  return (
    <div className="flex flex-col items-center max-w-[1200px] mx-auto min-h-screen py-6 md:py-10 px-4 w-full relative">
      {/* Mobile-only Header (Compact) */}
      <div className="md:hidden flex items-center justify-between w-full max-w-2xl mb-10 px-2 group">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1 group-hover:text-primary transition-colors">Vocabulary</h2>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">{vocabList.length} Words Loaded</span>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`size-12 rounded-2xl border transition-all flex items-center justify-center ${showSettings ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]' : 'bg-white/5 border-white/10 text-gray-400 active:scale-90 hover:border-white/20'}`}
        >
          <span className={`material-symbols-outlined text-2xl transition-transform duration-300 ${showSettings ? 'rotate-90' : ''}`}>settings</span>
        </button>
      </div>

      {/* Mobile Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="md:hidden absolute top-24 left-4 right-4 z-[100] glass-panel border border-white/10 p-8 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-8"
          >
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">View Mode</h4>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setViewMode('card'); setShowSettings(false); }} className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-2 transition-all ${viewMode === 'card' ? 'bg-white text-primary shadow-lg' : 'bg-white/5 text-gray-400'}`}>
                  <span className="material-symbols-outlined text-lg">style</span>
                  Study Mode
                </button>
                <button onClick={() => { setViewMode('list'); setShowSettings(false); }} className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-lg' : 'bg-white/5 text-gray-400'}`}>
                  <span className="material-symbols-outlined text-lg">list_alt</span>
                  Word List
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Ordering</h4>
              <button
                onClick={toggleShuffle}
                className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isShuffle ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-gray-400'}`}
              >
                <span className="material-symbols-outlined text-lg">{isShuffle ? 'shuffle_on' : 'shuffle'}</span>
                {isShuffle ? 'Shuffled Mode' : 'Sequential Mode'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Tabs (Desktop) */}
      <div className="hidden md:flex items-center gap-6 mb-12 w-full max-w-2xl justify-between">
        <div className="flex h-12 w-64 items-center justify-center rounded-2xl bg-white/5 p-1 border border-white/10 shadow-xl">
          <button
            onClick={() => setViewMode('card')}
            className={`flex grow items-center justify-center rounded-xl px-2 h-full text-xs font-black uppercase transition-all ${viewMode === 'card' ? 'bg-white text-primary shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Study Session
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex grow items-center justify-center rounded-xl px-2 h-full text-xs font-black uppercase transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Word List
          </button>
        </div>

        <button
          onClick={toggleShuffle}
          className={`flex items-center gap-3 px-6 h-12 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest ${isShuffle ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
        >
          <span className="material-symbols-outlined text-[18px]">{isShuffle ? 'shuffle_on' : 'shuffle'}</span>
          {isShuffle ? 'Shuffled' : 'Sequential'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'card' ? (
          <motion.div
            key="study-launcher"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-20 w-full max-w-4xl mx-auto"
          >
            <div className="glass-panel p-12 rounded-[40px] border border-white/10 flex flex-col items-center text-center gap-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="size-24 rounded-3xl bg-primary/20 flex items-center justify-center text-primary relative">
                <div className="absolute inset-0 bg-primary blur-3xl opacity-20" />
                <span className="material-symbols-outlined text-5xl">style</span>
              </div>

              <div>
                <h2 className="text-3xl font-black text-white mb-2">Ready to study?</h2>
                <p className="text-gray-400 font-medium">Practice active recall with FSRS-driven intelligence.</p>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                  <span className="text-primary font-black">{vocabList.length}</span>
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Words Loaded</span>
                </div>
              </div>

              <button
                onClick={() => startStudySession()}
                className="group relative px-12 py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Start Learning
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-4xl"
          >
            <div className="relative mb-8 group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 group-focus-within:text-primary transition-colors">search</span>
              <input
                type="text"
                placeholder="Search vocabulary..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-14 pl-14 pr-6 rounded-2xl bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all outline-none text-sm font-medium"
              />
            </div>

            <div className="grid gap-3">
              {filteredList.map((v) => (
                <motion.div
                  key={v.id}
                  whileHover={{ x: 10, backgroundColor: "rgba(255,255,255,0.03)" }}
                  className="glass-panel border-white/5 flex items-center justify-between p-5 rounded-2xl cursor-pointer group"
                  onClick={() => startStudySession(v.id)}
                >
                  <div className="flex items-center gap-6">
                    <div className="size-14 rounded-xl bg-white/5 flex items-center justify-center text-2xl font-black jp-text group-hover:text-primary transition-colors">
                      {v.kanji || v.furigana[0]}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-200">
                          <FuriganaText text={`${v.kanji || v.furigana}${v.kanji && v.kanji !== v.furigana ? `[${v.furigana}]` : ''}`} />
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[8px] font-black text-white/40 border border-white/5 uppercase">N{v.jlpt_level}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-500 group-hover:text-gray-300 transition-colors">{v.meaning}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="size-10 rounded-xl bg-white/5 text-gray-500 hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center"
                      onClick={(e) => { e.stopPropagation(); speakJapanese(sanitizeForTTS(v.kanji || v.furigana)); }}
                    >
                      <span className="material-symbols-outlined text-base">volume_up</span>
                    </button>
                    <div className="size-10 rounded-xl bg-white/5 text-gray-500 group-hover:bg-primary/20 group-hover:text-primary transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredList.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                <span className="material-symbols-outlined text-6xl opacity-10">search_off</span>
                <p className="font-bold uppercase tracking-widest text-[10px]">No results found</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

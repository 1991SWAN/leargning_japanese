'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { speakJapanese } from '@/lib/tts';
import FuriganaText from './common/FuriganaText';
import { Grammar } from '@/types/learning';

interface GrammarProps {
  lessons: Grammar[];
  onSelectReview?: (id: string) => void;
}

export default function GrammarLessonView({ lessons, onSelectReview }: GrammarProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [revealedExamples, setRevealedExamples] = useState<Set<number>>(new Set());

  useEffect(() => {
    setRevealedExamples(new Set());
  }, [selectedId]);

  const categories = useMemo(() => {
    const levels = new Set<string>();
    const tags = new Set<string>();

    lessons.forEach(l => {
      levels.add(`N${l.jlpt_level}`);
      if (l.tags) l.tags.forEach(tag => tags.add(tag));
    });

    // Sort levels in descending order (N5, N4, N3, N2, N1)
    const sortedLevels = Array.from(levels).sort((a, b) => b.localeCompare(a));

    // Sort other tags alphabetically, ensuring stability
    const sortedTags = Array.from(tags)
      .filter(t => !t.startsWith('JLPT'))
      .sort((a, b) => a.localeCompare(b));

    return ['전체', ...sortedLevels, ...sortedTags];
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      if (selectedCategory === '전체') return true;
      if (selectedCategory.startsWith('N')) {
        return `N${l.jlpt_level}` === selectedCategory;
      }
      return l.tags && l.tags.includes(selectedCategory);
    });
  }, [lessons, selectedCategory]);

  const current = useMemo(() =>
    lessons.find(l => l.id === selectedId) || null
    , [selectedId, lessons]);

  const sanitizeForTTS = (text: string) => text.replace(/\[[^\]]+\]/g, '');

  const levelColorMap: Record<number, string> = {
    5: 'rgba(59, 130, 246, 0.5)', // Blue
    4: 'rgba(16, 185, 129, 0.5)', // Green
    3: 'rgba(245, 158, 11, 0.5)', // Orange
    2: 'rgba(239, 68, 68, 0.5)',  // Red
    1: 'rgba(244, 114, 182, 1)', // Neon Fuchsia (N1) - Ultra High Contrast
  };

  const currentLevelColor = current ? levelColorMap[current.jlpt_level] : 'rgba(255, 255, 255, 0.2)';

  return (
    <div className="max-w-[1200px] mx-auto w-full min-h-[800px] py-10 px-4 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {!selectedId ? (
          /* --- CATALOG VIEW (Grid) --- */
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-10"
          >
            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-white mb-2">Grammar Catalog</h2>
                <p className="text-gray-400 font-medium">Master Japanese patterns and sentence structures.</p>
              </div>

              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shadow-xl overflow-x-auto max-w-full no-scrollbar">
                {categories.map(cat => {
                  const isLevel = cat.startsWith('N') && cat.length <= 3;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap flex items-center gap-2 ${selectedCategory === cat ? 'bg-white text-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                      {isLevel && (
                        <div
                          className={`size-2 rounded-full ${selectedCategory === cat ? 'bg-primary' : 'bg-gray-600'}`}
                          style={selectedCategory === cat ? { backgroundColor: levelColorMap[parseInt(cat.substring(1))]?.replace('0.5', '1') } : {}}
                        />
                      )}
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredLessons.map((lesson) => (
                <motion.button
                  key={lesson.id}
                  whileHover={{ y: -10, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  onClick={() => setSelectedId(lesson.id)}
                  className="glass-card p-10 rounded-[40px] text-left border border-white/5 flex flex-col gap-8 group transition-all h-[280px] justify-between relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="material-symbols-outlined text-6xl">menu_book</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="px-3 py-1 rounded-lg text-[10px] font-black text-white"
                        style={{ backgroundColor: levelColorMap[lesson.jlpt_level]?.replace('0.5', '1') || 'var(--primary)' }}
                      >
                        N{lesson.jlpt_level}
                      </span>
                      <span className="text-[10px] font-black opacity-20 uppercase tracking-widest">{lesson.tags?.[0] || 'Grammar'}</span>
                    </div>
                    <h3 className="jp-text text-2xl font-bold group-hover:text-primary transition-colors leading-tight">
                      <FuriganaText text={lesson.pattern} />
                    </h3>
                  </div>
                  <div>
                    <p className="text-sm font-bold opacity-40 line-clamp-2 leading-relaxed">{lesson.meaning}</p>
                    <div className="w-full h-px bg-white/5 mt-4 group-hover:bg-primary/20 transition-colors" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* --- LESSON VIEW (Focus) --- */
          <motion.div
            key="lesson"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col relative"
          >
            {/* Back Button */}
            <button
              onClick={() => setSelectedId(null)}
              className="absolute -top-4 left-0 z-20 flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest group shadow-2xl"
            >
              <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-1">arrow_back</span>
              Back to Catalog
            </button>

            <div className="flex-1 overflow-visible py-12" style={{ isolation: 'isolate' }}>
              <div className="max-w-[800px] mx-auto relative pt-10">
                {/* Cinematic Aurora Glow Background */}
                <AnimatePresence>
                  {current && (
                    <motion.div
                      key={`glow-${current.id}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [0.8, 1.1, 0.8],
                      }}
                      exit={{ opacity: 0, scale: 1.2 }}
                      transition={{
                        opacity: { duration: 8, repeat: Infinity, ease: "linear" },
                        scale: { duration: 15, repeat: Infinity, ease: "easeInOut" },
                        default: { duration: 1 }
                      }}
                      className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[120px] -z-10 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, ${currentLevelColor} 0%, transparent 80%)`,
                        mixBlendMode: 'screen'
                      }}
                    />
                  )}
                </AnimatePresence>

                {current && (
                  <>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <motion.span
                        layoutId={`level-${current.id}`}
                        className="px-4 py-1.5 rounded-full text-[12px] font-black text-white shadow-lg"
                        style={{ backgroundColor: currentLevelColor.replace('0.5', '1') }}
                      >
                        JLPT N{current.jlpt_level}
                      </motion.span>
                      <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] font-display text-white">Grammar Mastery Path</span>
                    </div>

                    <motion.h1
                      className="text-4xl md:text-8xl font-black mb-16 jp-text tracking-tighter leading-none relative z-10 text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                    >
                      <FuriganaText text={current.pattern} />
                    </motion.h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                      <div className="p-6 md:p-10 rounded-[40px] bg-white/5 border border-white/5 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                          <span className="material-symbols-outlined text-5xl">chat_bubble</span>
                        </div>
                        <h4 className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mb-4 text-white">의미 (Meaning)</h4>
                        <p className="text-2xl md:text-3xl font-bold leading-tight text-white">{current.meaning}</p>
                      </div>

                      <div className="p-6 md:p-10 rounded-[40px] bg-primary/5 border border-primary/10 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                          <span className="material-symbols-outlined text-5xl">rebase_edit</span>
                        </div>
                        <h4 className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mb-6 text-white">접속 (Connection)</h4>
                        <div className="flex flex-wrap gap-2">
                          {(current.connection || '기본 접속').split(/[\+,\|]/).map((part, i) => (
                            <div key={i} className="flex items-center gap-2">
                              {i > 0 && <span className="text-primary/30 font-black">+</span>}
                              <span className="px-5 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-sm font-bold text-primary/80 group-hover:bg-primary/20 transition-all cursor-default shadow-lg">
                                {part.trim()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <h3 className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] flex items-center gap-4 text-white">
                        예문 일람 (Examples)
                        <div className="flex-1 h-[1px] bg-white/10" />
                      </h3>
                      <div className="grid gap-8">
                        {current.grammar_examples && (current.grammar_examples as any[]).map((ex, idx) => (
                          <motion.div
                            key={ex.id || idx}
                            whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.08)' }}
                            onClick={() => {
                              const next = new Set(revealedExamples);
                              if (next.has(idx)) next.delete(idx);
                              else next.add(idx);
                              setRevealedExamples(next);
                            }}
                            className={`p-6 md:p-10 rounded-[32px] md:rounded-[48px] bg-white/5 border border-white/5 flex flex-col gap-6 md:gap-8 transition-all group overflow-hidden relative shadow-2xl cursor-pointer ${revealedExamples.has(idx) ? 'ring-1 ring-primary/30 bg-white/[0.08]' : ''}`}
                          >
                            <div className="flex justify-between items-start relative z-10">
                              <p className="jp-text text-2xl md:text-3xl font-medium leading-relaxed text-indigo-50/90 pr-10">
                                <FuriganaText text={ex.japanese} />
                              </p>
                              <button
                                className="p-4 md:p-6 bg-white/5 text-white rounded-[20px] md:rounded-[24px] opacity-100 md:opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white scale-90 shadow-xl"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakJapanese(sanitizeForTTS(ex.japanese));
                                }}
                              >
                                <span className="material-symbols-outlined text-2xl md:text-3xl">volume_up</span>
                              </button>
                            </div>

                            <div className="h-px w-full bg-white/10 relative z-10" />

                            <div className="relative z-10 pt-2 min-h-[40px] flex items-center">
                              <p className={`text-2xl font-bold transition-all duration-300 ${revealedExamples.has(idx) ? 'blur-none opacity-100' : 'blur-md opacity-20 group-hover:blur-none group-hover:opacity-100'} cursor-default text-white`}>
                                {ex.korean}
                              </p>
                              <div className={`absolute inset-0 flex items-center text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-primary/60 transition-all duration-300 pointer-events-none ${revealedExamples.has(idx) ? 'opacity-0' : 'group-hover:opacity-0'}`}>
                                <span className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-sm">visibility</span>
                                  {revealedExamples.has(idx) ? '' : '탭하여 번역 확인'}
                                </span>
                              </div>
                            </div>

                            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    {/* Integration with Universal Modal */}
                    {onSelectReview && (
                      <div className="mt-12 group">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onSelectReview(current.id)}
                          className="w-full py-5 rounded-3xl bg-primary text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/40 flex items-center justify-center gap-3"
                        >
                          <span className="material-symbols-outlined">psychology</span>
                          Master this Pattern
                        </motion.button>
                        <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-4">
                          Opens Intelligent Review Modal
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

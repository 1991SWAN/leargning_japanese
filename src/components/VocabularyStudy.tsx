'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { speakJapanese } from '@/lib/tts';
import FuriganaText from './common/FuriganaText';
import { Vocabulary } from '@/types/learning';
import { calculateSRS, getNextReviewDate } from '@/lib/srs';
import { vocabService } from '@/lib/services/supabaseService';

interface VocabProps {
  vocabList: Vocabulary[];
  onSelectWriting: (word: string) => void;
}

export default function VocabularyStudy({ vocabList, onSelectWriting }: VocabProps) {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealStep, setRevealStep] = useState(0); // 0: Question, 1: Answer
  const [studyMode, setStudyMode] = useState<'mastery' | 'recognition'>('mastery');
  const [isWritingMode, setIsWritingMode] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoverGrade, setHoverGrade] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Canvas State
  const [paths, setPaths] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Shuffle Logic
  const shuffledList = useMemo(() => {
    if (!isShuffle) return vocabList;
    return [...vocabList].sort(() => Math.random() - 0.5);
  }, [vocabList, isShuffle]);

  const currentItem = shuffledList[currentIndex] || shuffledList[0];

  const filteredList = useMemo(() => {
    return vocabList.filter(v =>
      (v.kanji || v.furigana || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.meaning || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vocabList, searchTerm]);

  const sanitizeForTTS = (text: string) => text.replace(/\[[^\]]+\]/g, '');

  const toggleShuffle = () => {
    const nextShuffle = !isShuffle;
    if (nextShuffle) {
      setIsShuffle(true);
      setCurrentIndex(0);
    } else {
      const originalIndex = vocabList.findIndex(v => v.id === currentItem.id);
      setIsShuffle(false);
      setCurrentIndex(originalIndex !== -1 ? originalIndex : 0);
    }
    setRevealStep(0);
    setPaths([]);
  };

  // Handle Reveal Steps & SRS
  const advanceStep = () => {
    if (revealStep === 0) {
      setIsWritingMode(false);
      setPaths([]);
      setRevealStep(1);
    }
  };

  const handleNext = () => {
    if (currentIndex < shuffledList.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setRevealStep(0);
      setIsWritingMode(false);
      setPaths([]);
    } else {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setRevealStep(0);
      setIsWritingMode(false);
      setPaths([]);
    }
  };

  const handleGrade = async (grade: '다시' | '어려움' | '보통' | '쉬움') => {
    if (!currentItem || revealStep < 1) return;

    const qualityMap = { '다시': 1, '어려움': 3, '보통': 4, '쉬움': 5 };
    const quality = qualityMap[grade];

    const currentSRS = currentItem.srs_data || { interval: 0, repetition: 0, ease_factor: 2.5 };
    const nextSRS = calculateSRS(quality, currentSRS as any);
    const nextDate = getNextReviewDate(nextSRS.interval);

    try {
      await vocabService.updateSRS(currentItem.id, {
        ...nextSRS,
        next_review_at: nextDate.toISOString(),
        status: quality >= 4 ? 'reviewing' : 'learning'
      });
    } catch (err) {
      console.error('SRS Update Failed:', err);
    }

    handleNext();
  };

  // Keyboard Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'card') return;

      if (e.code === 'Space') {
        e.preventDefault();
        advanceStep();
      } else if (revealStep === 1) {
        if (e.key === '1') handleGrade('다시');
        if (e.key === '2') handleGrade('어려움');
        if (e.key === '3') handleGrade('보통');
        if (e.key === '4') handleGrade('쉬움');
      }

      if (e.code === 'KeyW' && revealStep === 0) setIsWritingMode(prev => !prev);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [revealStep, currentIndex, viewMode, currentItem, shuffledList, studyMode]);

  // Unified Auto-speak Logic
  useEffect(() => {
    if (viewMode !== 'card' || !currentItem) return;

    if (studyMode === 'mastery' && revealStep === 1) {
      speakJapanese(sanitizeForTTS(currentItem.kanji || currentItem.furigana));
    } else if (studyMode === 'recognition' && revealStep === 0) {
      speakJapanese(sanitizeForTTS(currentItem.kanji || currentItem.furigana));
    }
  }, [currentIndex, revealStep, studyMode, viewMode, currentItem]);

  // Canvas Logic
  useEffect(() => {
    if (!isWritingMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#6366f1'; // Indigo-500

    const redraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      paths.forEach(path => {
        if (path.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        path.forEach((p: any) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      });
    };
    redraw();
  }, [paths, isWritingMode]);

  const getCoords = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0].clientX;
    const clientY = e.clientY || e.touches?.[0].clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const { x, y } = getCoords(e);
    setPaths(prev => [...prev, [{ x, y }]]);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    setPaths(prev => {
      const newPaths = [...prev];
      newPaths[newPaths.length - 1].push({ x, y });
      return newPaths;
    });
  };

  // Drag Gesture Evaluation
  const x = useMotionValue(0);
  const background = useTransform(x, [-150, 0, 150], ["#ef444433", "rgba(255,255,255,0.05)", "#10b98133"]);

  return (
    <div className="flex flex-col items-center max-w-[1200px] mx-auto min-h-[900px] py-10 px-4 w-full">
      {/* Header Tabs & Actions */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-12 w-full max-w-2xl justify-between">
        <div className="flex h-12 w-64 items-center justify-center rounded-2xl bg-white/5 p-1 border border-white/10 shadow-xl">
          <button
            onClick={() => setViewMode('card')}
            className={`flex grow items-center justify-center rounded-xl px-2 h-full text-xs font-black uppercase transition-all ${viewMode === 'card' ? 'bg-white text-primary shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Flashcards
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex grow items-center justify-center rounded-xl px-2 h-full text-xs font-black uppercase transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Word List
          </button>
        </div>

        {viewMode === 'card' && (
          <div className="flex gap-3">
            <div className="flex h-12 items-center rounded-2xl bg-white/5 p-1 border border-white/10">
              <button
                onClick={() => { setStudyMode('mastery'); setRevealStep(0); }}
                className={`px-4 h-full text-[10px] font-black uppercase transition-all rounded-xl ${studyMode === 'mastery' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Mastery
              </button>
              <button
                onClick={() => { setStudyMode('recognition'); setRevealStep(0); }}
                className={`px-4 h-full text-[10px] font-black uppercase transition-all rounded-xl ${studyMode === 'recognition' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Recognition
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
        )}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'card' && currentItem ? (
          <motion.div
            key="card-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-10 w-full"
          >
            {/* Session Progress & Mobile Nav */}
            <div className="w-full max-w-2xl px-4 flex items-center gap-4">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="xl:hidden size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 disabled:opacity-0 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>

              <div className="flex-1 flex flex-col gap-2">
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / shuffledList.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-primary to-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Session Progress</span>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{currentIndex + 1} / {shuffledList.length}</span>
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={currentIndex === shuffledList.length - 1}
                className="xl:hidden size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 disabled:opacity-0 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </button>
            </div>

            {/* Flashcard Wrapper */}
            <div className="perspective-1000 w-full flex justify-center relative touch-none">
              <motion.div
                className={`relative w-full max-w-2xl aspect-[1.6/1] cursor-pointer group`}
                style={{ x }}
                drag={revealStep === 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 100) handleGrade('쉬움');
                  else if (info.offset.x < -100) handleGrade('다시');
                }}
                onClick={revealStep === 0 && !isWritingMode ? advanceStep : undefined}
              >
                <motion.div
                  className="w-full h-full relative"
                  initial={false}
                  animate={{ rotateY: revealStep === 1 ? 180 : 0 }}
                  transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front Side */}
                  <motion.div
                    className="absolute inset-0 rounded-[40px] glass-panel border border-white/10 flex flex-col p-10 overflow-hidden shadow-2xl"
                    style={{
                      backfaceVisibility: 'hidden',
                      backgroundColor: background,
                      pointerEvents: revealStep === 0 ? 'auto' : 'none'
                    }}
                  >
                    <div className="flex justify-between items-start z-10 w-full">
                      <div className="flex flex-col gap-1">
                        <span className="premium-tag text-xs">
                          {studyMode === 'mastery' ? 'Meaning Prompt' : 'Kanji Recognition'}
                        </span>
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-black text-white/40 uppercase">N{currentItem.jlpt_level}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          disabled={revealStep !== 0}
                          className={`size-12 rounded-2xl flex items-center justify-center transition-all ${isWritingMode ? 'bg-primary text-white shadow-lg' : 'bg-white/5 hover:bg-white/10 text-gray-400 disabled:opacity-20 disabled:cursor-not-allowed'}`}
                          onClick={(e) => { e.stopPropagation(); setIsWritingMode(!isWritingMode); }}
                        >
                          <span className="material-symbols-outlined text-[20px]">edit_square</span>
                        </button>
                        {studyMode === 'recognition' && (
                          <button
                            className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-lg overflow-hidden relative group/audio"
                            onClick={(e) => { e.stopPropagation(); speakJapanese(sanitizeForTTS(currentItem.kanji || currentItem.furigana)); }}
                          >
                            <motion.div
                              initial={false}
                              whileHover={{ scale: 1.2 }}
                              className="relative z-10"
                            >
                              <span className="material-symbols-outlined text-[20px]">volume_up</span>
                            </motion.div>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center relative z-10 text-center px-6">
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] mb-4"
                      >
                        {studyMode === 'mastery' ? 'How do you write & read?' : 'What does this mean?'}
                      </motion.span>
                      <motion.h2
                        layout
                        className={`${studyMode === 'mastery' ? 'text-6xl' : 'text-8xl jp-text'} font-black bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent mb-2`}
                      >
                        {studyMode === 'mastery' ? currentItem.meaning : (currentItem.kanji || currentItem.furigana)}
                      </motion.h2>
                    </div>

                    {/* Handwriting Canvas Overlay */}
                    <AnimatePresence>
                      {isWritingMode && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[4px] flex items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <canvas
                            ref={canvasRef}
                            width={800}
                            height={500}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={() => setIsDrawing(false)}
                            onMouseLeave={() => setIsDrawing(false)}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={() => setIsDrawing(false)}
                            className="w-full h-full cursor-crosshair z-10"
                          />
                          <button
                            className="absolute top-6 right-6 size-12 rounded-full glass-panel border border-white/20 text-white flex items-center justify-center hover:bg-white/10 hover:scale-110 active:scale-95 transition-all z-20 group"
                            onClick={(e) => { e.stopPropagation(); setIsWritingMode(false); }}
                          >
                            <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform">close</span>
                          </button>
                          <button
                            className="absolute bottom-6 right-6 size-12 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-20"
                            onClick={(e) => { e.stopPropagation(); setPaths([]); }}
                          >
                            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="text-center opacity-20 text-[10px] font-black uppercase tracking-[0.4em] z-10">
                      {revealStep === 0 ? "Click to reveal answer" : "Swiping for evaluation"}
                    </div>
                  </motion.div>

                  {/* Back Side */}
                  <motion.div
                    className="absolute inset-0 rounded-[40px] glass-panel bg-white/10 border border-white/10 flex flex-col p-10 shadow-2xl overflow-hidden"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      pointerEvents: revealStep === 1 ? 'auto' : 'none'
                    }}
                  >
                    <div className="flex justify-between items-start z-10 w-full mb-6">
                      <span className="premium-tag text-xs bg-primary/20 text-primary">Correct Answer</span>
                      <button
                        className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-lg"
                        onClick={(e) => { e.stopPropagation(); speakJapanese(sanitizeForTTS(currentItem.kanji || currentItem.furigana)); }}
                      >
                        <span className="material-symbols-outlined text-[20px]">volume_up</span>
                      </button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <motion.h3
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`${studyMode === 'mastery' ? 'text-8xl' : 'text-6xl'} font-black mb-4 jp-text text-white leading-tight`}
                      >
                        {studyMode === 'mastery' ? (currentItem.kanji || currentItem.furigana) : currentItem.meaning}
                      </motion.h3>

                      {studyMode === 'mastery' && (
                        <div className="px-6 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-8">
                          <span className="text-2xl font-bold text-indigo-300">{currentItem.furigana}</span>
                        </div>
                      )}

                      {currentItem.examples && (
                        <div className="space-y-4 max-w-md">
                          <div className="p-4 rounded-xl bg-white/5 border border-white/5 relative group/jp">
                            <p className="jp-text text-base leading-relaxed text-indigo-100 italic">
                              "{(currentItem.examples as any)[0]?.jp}"
                            </p>
                          </div>
                          <p className="text-sm text-gray-400 font-medium">
                            {(currentItem.examples as any)[0]?.kr || (currentItem.examples as any)[0]?.en}
                          </p>
                        </div>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                      whileTap={{ scale: 0.98 }}
                      className="mt-6 py-4 rounded-2xl bg-white/5 border border-white/10 transition-all font-black uppercase tracking-widest text-[10px] text-gray-500 hover:text-white relative z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRevealStep(0);
                      }}
                    >
                      Flip back to retry
                    </motion.button>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Desktop-only Side Arrows */}
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="hidden xl:flex absolute -left-28 top-1/2 -translate-y-1/2 size-16 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-0 items-center justify-center transition-all border border-white/10 group shadow-2xl z-20"
              >
                <span className="material-symbols-outlined text-white text-3xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === shuffledList.length - 1}
                className="hidden xl:flex absolute -right-28 top-1/2 -translate-y-1/2 size-16 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-0 items-center justify-center transition-all border border-white/10 group shadow-2xl z-20"
              >
                <span className="material-symbols-outlined text-white text-3xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>

            {/* SRS Controls */}
            <div className="flex flex-col items-center gap-8 w-full max-w-xl">
              <div className="grid grid-cols-4 gap-4 w-full">
                {(['다시', '어려움', '보통', '쉬움'] as const).map(grade => (
                  <button
                    key={grade}
                    disabled={revealStep < 1}
                    onMouseEnter={() => setHoverGrade(grade)}
                    onMouseLeave={() => setHoverGrade(null)}
                    className={`relative overflow-hidden group py-4 rounded-2xl border transition-all duration-300 disabled:opacity-10 ${grade === '다시' ? 'border-red-500/20 bg-red-500/5 hover:bg-red-500 hover:text-white hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]' :
                      grade === '어려움' ? 'border-orange-500/20 bg-orange-500/5 hover:bg-orange-500 hover:text-white hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]' :
                        grade === '보통' ? 'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500 hover:text-white hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]' :
                          'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105'
                      }`}
                    onClick={() => handleGrade(grade)}
                  >
                    <div className="flex flex-col items-center gap-1 z-10 relative">
                      <span className="text-[10px] font-black uppercase tracking-wider">{grade}</span>
                      <span className="text-[8px] opacity-40 font-bold">Slot 1h</span>
                    </div>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>

              {/* Hotkey Guide */}
              <div className="flex items-center gap-6 opacity-20">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-white/20 text-[8px] font-mono">SPACE</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">Flip</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-white/20 text-[8px] font-mono">1-4</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-white/20 text-[8px] font-mono">W</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">Write</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-4xl py-6"
          >

            <div className="grid gap-3">
              {filteredList.map((v) => (
                <motion.div
                  key={v.id}
                  whileHover={{ x: 10, backgroundColor: "rgba(255,255,255,0.03)" }}
                  className="glass-panel border-white/5 flex items-center justify-between p-5 rounded-2xl cursor-pointer group"
                >
                  <div className="flex items-center gap-6">
                    <div className="size-14 rounded-xl bg-white/5 flex items-center justify-center text-2xl font-black jp-text group-hover:text-primary transition-colors">
                      {v.kanji || v.furigana[0]}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-200">{v.furigana}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[8px] font-black text-white/40 border border-white/5 uppercase">N{v.jlpt_level}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-500 group-hover:text-gray-300 transition-colors">{v.meaning}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="size-10 rounded-xl bg-white/5 text-gray-500 hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center" onClick={() => speakJapanese(sanitizeForTTS(v.kanji))}>
                      <span className="material-symbols-outlined text-base">volume_up</span>
                    </button>
                    <button className="size-10 rounded-xl bg-white/5 text-gray-500 hover:bg-green-500/20 hover:text-green-500 transition-all flex items-center justify-center">
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Celebration Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="size-32 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)]">
                <span className="material-symbols-outlined text-white text-6xl">check_circle</span>
              </div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter text-center">
                Session Complete!<br />
                <span className="text-green-400">Great Job!</span>
              </h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

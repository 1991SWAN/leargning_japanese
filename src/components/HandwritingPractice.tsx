'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { speakJapanese } from '@/lib/tts';
import { FSRSState, LearningProgress } from '@/types/learning';
import { calculateFSRS, getNextReviewDate } from '@/lib/srs';
import { vocabService } from '@/lib/services/supabaseService';
import FuriganaText from './common/FuriganaText';

export interface LearningItem {
  id: string;
  type: 'kana' | 'vocabulary' | 'grammar';
  text: string;
  reading: string;
  meaning?: string;
  examples?: { jp: string; ko: string; reading?: string }[];
  srs_data?: LearningProgress | null;
}

interface UniversalLearningModalProps {
  items: LearningItem[];
  initialId?: string | null;
  onClose: () => void;
  onComplete?: () => void;
}

export default function UniversalLearningModal({ items, initialId, onClose, onComplete }: UniversalLearningModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealStep, setRevealStep] = useState(0); // 0: Question, 1: Reveal & Rate
  const [showGuide, setShowGuide] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<any[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Swipe Gesture State
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Visual Feedback for Gestures
  const cardBackground = useTransform(
    [x, y],
    ([latestX, latestY]: any) => {
      if (latestY < -100) return 'rgba(16, 185, 129, 0.1)'; // UP: Easy (Emerald)
      if (latestY > 100) return 'rgba(239, 68, 68, 0.1)';  // DOWN: Again (Red)
      if (latestX < -100) return 'rgba(249, 115, 22, 0.1)'; // LEFT: Hard (Orange)
      if (latestX > 100) return 'rgba(59, 130, 246, 0.1)';  // RIGHT: Good (Blue)
      return 'rgba(255, 255, 255, 0.05)';
    }
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentItem = items[currentIndex];

  useEffect(() => {
    if (initialId) {
      const index = items.findIndex(item => item.id === initialId);
      if (index !== -1) setCurrentIndex(index);
    }
  }, [initialId, items]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (revealStep === 0) setRevealStep(1);
      }
      if (revealStep === 1) {
        if (e.key === '1') handleRating(1);
        if (e.key === '2') handleRating(2);
        if (e.key === '3') handleRating(3);
        if (e.key === '4') handleRating(4);
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [revealStep, currentIndex]);

  // Canvas Resize Logic
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) setCanvasSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#6366f1';

      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      paths.forEach(path => {
        if (path.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
        ctx.stroke();
      });
    }
  }, [paths, canvasSize]);

  const handleRating = async (rating: 1 | 2 | 3 | 4) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const currentSRS = currentItem.srs_data || {
      stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, lapses: 0, state: FSRSState.New
    };

    const nextSRS = calculateFSRS(rating, currentSRS as any);
    const nextDate = getNextReviewDate(nextSRS.scheduled_days);

    try {
      await vocabService.updateSRS(currentItem.id, {
        ...nextSRS,
        next_review_at: nextDate.toISOString(),
        status: rating >= 3 ? 'reviewing' : 'learning'
      });

      // Navigate to next or complete
      if (currentIndex < items.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setRevealStep(0);
        setPaths([]);
      } else {
        onComplete?.();
        onClose();
      }
    } catch (err) {
      console.error('FSRS Update Error:', err);
    } finally {
      setIsProcessing(false);
      animate(x, 0);
      animate(y, 0);
    }
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    setPaths(prev => [...prev, [{ x: clientX - rect.left, y: clientY - rect.top }]]);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    setPaths(prev => {
      const newPaths = [...prev];
      newPaths[newPaths.length - 1].push({ x: clientX - rect.left, y: clientY - rect.top });
      return newPaths;
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 md:p-10"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="relative w-full max-w-4xl h-full max-h-[850px] flex flex-col gap-6"
        >
          {/* Header Area */}
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">
                {currentItem.type.toUpperCase()} PRACTICE
              </span>
              <div className="flex items-center gap-2">
                <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-500"
                    animate={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-gray-500">{currentIndex + 1} / {items.length}</span>
              </div>
            </div>
            <button onClick={onClose} className="size-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
              <span className="material-symbols-outlined text-gray-400">close</span>
            </button>
          </div>

          {/* Main Card Zone */}
          <div className="flex-1 relative group bg-white/5 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col">

            {/* Handwriting Canvas */}
            <div ref={containerRef} className="absolute inset-0 z-20 cursor-crosshair touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={() => setIsDrawing(false)}
                onMouseLeave={() => setIsDrawing(false)}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={() => setIsDrawing(false)}
                className="w-full h-full"
              />
            </div>

            {/* Static Guide (Dynamic Opacity based on Stability) */}
            {showGuide && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: !currentItem.srs_data || currentItem.srs_data.stability === 0
                    ? 0.12  // New / Unlearned: More visible
                    : Math.max(0.01, 0.1 * Math.pow(0.8, Math.log2(currentItem.srs_data.stability + 1))) // Adaptive
                }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
              >
                <span className="text-[min(40vw,300px)] font-kanji leading-none select-none">
                  {currentItem.text}
                </span>
              </motion.div>
            )}

            {/* Prompt Layer (Click to reveal) */}
            <AnimatePresence mode="wait">
              {revealStep === 0 ? (
                <motion.div
                  key="prompt"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setRevealStep(1)}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center p-10 cursor-pointer text-center"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400/50 mb-4 animate-pulse">Tap to Reveal</span>
                  <h2 className="text-4xl md:text-5xl font-black text-white/90 tracking-tight">
                    {currentItem.meaning || currentItem.reading}
                  </h2>
                </motion.div>
              ) : (
                <motion.div
                  key="reveal"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none"
                >
                  <div className="p-8 rounded-[32px] bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col items-center gap-4 text-center">
                    <FuriganaText
                      text={`${currentItem.text}${currentItem.reading ? `[${currentItem.reading}]` : ''}`}
                      className="text-6xl md:text-7xl font-kanji font-black text-white"
                    />
                    <p className="text-xl font-bold text-indigo-200">{currentItem.meaning}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Swipe & Rating Logic Layer */}
            <div className="absolute inset-x-0 bottom-0 h-24 z-50 flex items-center justify-center p-4">
              <motion.div
                style={{ x, y, backgroundColor: cardBackground }}
                drag={revealStep === 1}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                onPan={(_, info) => {
                  x.set(info.offset.x);
                  y.set(info.offset.y);
                }}
                onPanEnd={(_, info) => {
                  if (info.offset.y < -120) handleRating(4); // UP: Easy
                  else if (info.offset.y > 120) handleRating(1); // DOWN: Again
                  else if (info.offset.x < -120) handleRating(2); // LEFT: Hard
                  else if (info.offset.x > 120) handleRating(3); // RIGHT: Good
                  else {
                    animate(x, 0); animate(y, 0);
                  }
                }}
                className="w-full max-w-sm h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                  <span className="material-symbols-outlined text-sm">swipe</span>
                  {revealStep === 0 ? "Handwrite & Tap to Check" : "Swipe to Rate Performance"}
                </div>

                {/* Gesture Hints in Reveal State */}
                <AnimatePresence>
                  {revealStep === 1 && (
                    <>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -top-16 text-emerald-400 flex flex-col items-center gap-1">
                        <span className="material-symbols-outlined">expand_less</span>
                        <span className="text-[8px] font-black">EASY</span>
                      </motion.div>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -bottom-16 text-red-400 flex flex-col items-center gap-1">
                        <span className="text-[8px] font-black">AGAIN</span>
                        <span className="material-symbols-outlined">expand_more</span>
                      </motion.div>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -left-20 text-orange-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        <span className="text-[8px] font-black">HARD</span>
                      </motion.div>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -right-20 text-blue-400 flex items-center gap-1">
                        <span className="text-[8px] font-black">GOOD</span>
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>

          {/* Tools Area */}
          <div className="flex items-center justify-center gap-4 pb-4">
            <button onClick={() => setPaths([])} className="size-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-500/10 text-red-400 flex items-center justify-center transition-all">
              <span className="material-symbols-outlined">delete_sweep</span>
            </button>
            <button onClick={() => setShowGuide(!showGuide)} className={`size-12 rounded-2xl border transition-all flex items-center justify-center ${showGuide ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-gray-500 border-white/10'}`}>
              <span className="material-symbols-outlined">{showGuide ? 'visibility' : 'visibility_off'}</span>
            </button>
            <button onClick={() => speakJapanese(currentItem.text)} className="size-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center transition-all">
              <span className="material-symbols-outlined">volume_up</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

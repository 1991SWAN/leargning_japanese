'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { speakJapanese } from '@/lib/tts';

interface HandwritingItem {
  text: string;
  reading: string;
}

interface HandwritingPracticeProps {
  items: HandwritingItem[];
  initialText?: string | null;
  onClose: () => void;
}

export default function HandwritingPractice({ items, initialText, onClose }: HandwritingPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showGuide, setShowGuide] = useState(true);
  const [isRandom, setIsRandom] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<any[]>([]);
  const [guideOpacity, setGuideOpacity] = useState(0.15);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasSetInitialIndex = useRef(false);

  // Data sanitization (漢[かん] -> 漢)
  const sanitize = (text: string) => text ? text.replace(/\[[^\]]+\]/g, '') : '';

  // 최초 로드 시에만 initialText를 찾아 인덱스 설정
  useEffect(() => {
    if (initialText && !hasSetInitialIndex.current) {
      const index = items.findIndex((item: HandwritingItem) => sanitize(item.text) === sanitize(initialText));
      if (index !== -1) {
        setCurrentIndex(index);
      }
      hasSetInitialIndex.current = true;
    }
  }, [initialText, items]);

  // 키보드 내비게이션 추가 (화살표 좌우)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigateItems('next');
      if (e.key === 'ArrowLeft') navigateItems('prev');
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isRandom, onClose]); // currentIndex와 random 상태에 따라 동작 보정

  const currentItem = items[currentIndex] || items[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#4913ec'; // Premium Primary Color

    redrawCanvas();
  }, [paths]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    paths.forEach(path => {
      if (path.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      path.forEach((point: any) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
  };

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return { x, y };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    setPaths(prev => [...prev, [{ x, y }]]);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);

    setPaths(prev => {
      const newPaths = [...prev];
      const lastPath = [...newPaths[newPaths.length - 1]];
      lastPath.push({ x, y });
      newPaths[newPaths.length - 1] = lastPath;
      return newPaths;
    });
  };

  const endDrawing = () => setIsDrawing(false);
  const clearCanvas = () => setPaths([]);
  const undoPath = () => setPaths(prev => prev.slice(0, -1));

  const navigateItems = (direction: 'prev' | 'next') => {
    if (isRandom) {
      setCurrentIndex(Math.floor(Math.random() * items.length));
    } else {
      if (direction === 'next' && currentIndex < items.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (direction === 'prev' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }
    clearCanvas();
  };

  if (!items || items.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="glass-panel w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl border-white/10 relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl premium-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-white">edit_square</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-white leading-tight">Practice Writing</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">{currentItem.reading || 'Characters'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group"
            >
              <span className="material-symbols-outlined text-gray-400 group-hover:text-white transition-colors">close</span>
            </button>
          </div>

          <div className="p-10 flex flex-col items-center gap-10">
            {/* Main Area with Navigation */}
            <div className="w-full flex items-center justify-between gap-6">
              <button
                onClick={() => navigateItems('prev')}
                disabled={!isRandom && currentIndex === 0}
                className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center transition-all group"
              >
                <span className="material-symbols-outlined text-white group-hover:-translate-x-1 transition-transform">chevron_left</span>
              </button>

              <div className="relative group/canvas">
                <motion.div
                  key={currentItem.text}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative aspect-square w-[320px] md:w-[400px] bg-black/40 rounded-[40px] border border-white/10 shadow-inner overflow-hidden flex items-center justify-center cursor-crosshair"
                >
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={endDrawing}
                    onMouseLeave={endDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={endDrawing}
                    className="absolute inset-0 z-20 w-full h-full"
                  />

                  {showGuide && (
                    <div
                      className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none transition-opacity duration-300"
                      style={{ opacity: guideOpacity }}
                    >
                      <span className="text-[200px] md:text-[240px] font-kanji text-white select-none leading-none">
                        {sanitize(currentItem.text)}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                </motion.div>

                {/* Floating Progress */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-[10px] font-black text-white shadow-lg">
                  {currentIndex + 1} / {items.length}
                </div>
              </div>

              <button
                onClick={() => navigateItems('next')}
                disabled={!isRandom && currentIndex === items.length - 1}
                className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center transition-all group"
              >
                <span className="material-symbols-outlined text-white group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
            </div>

            {/* Controls Bar */}
            <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-[24px] p-5 flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-3 px-4 border-r border-white/10">
                <span className="material-symbols-outlined text-primary text-sm">visibility</span>
                <input
                  type="range" min="0" max="0.5" step="0.05"
                  value={guideOpacity}
                  onChange={(e) => setGuideOpacity(parseFloat(e.target.value))}
                  className="w-16 accent-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => speakJapanese(sanitize(currentItem.text))}
                  className="size-11 rounded-xl bg-white/5 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all group"
                  title="Listen"
                >
                  <span className="material-symbols-outlined">volume_up</span>
                </button>
                <button
                  onClick={() => setIsRandom(!isRandom)}
                  className={`size-11 rounded-xl flex items-center justify-center transition-all ${isRandom ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}
                  title="Randomize"
                >
                  <span className="material-symbols-outlined">casino</span>
                </button>
                <button
                  onClick={undoPath}
                  disabled={paths.length === 0}
                  className="size-11 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-20 flex items-center justify-center transition-all"
                  title="Undo"
                >
                  <span className="material-symbols-outlined">undo</span>
                </button>
                <button
                  onClick={clearCanvas}
                  className="size-11 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all"
                  title="Clear"
                >
                  <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                </button>
                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className={`size-11 rounded-xl flex items-center justify-center transition-all ${showGuide ? 'bg-accent/10 text-accent' : 'bg-white/5 text-gray-400'}`}
                  title="Toggle Guide"
                >
                  <span className="material-symbols-outlined">{showGuide ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-6 bg-white/[0.02] border-t border-white/5 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[14px]">info</span>
              Touch or click inside the circle to start writing
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

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
  const [paths, setPaths] = useState<any[]>([]); // Using relative coordinates {x: 0..1, y: 0..1}
  const [guideOpacity, setGuideOpacity] = useState(0.2);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Dynamic Resize Handling
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width, height });

        if (canvasRef.current) {
          canvasRef.current.width = width;
          canvasRef.current.height = height;
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(6, canvasSize.width / 35); // Stroke width scales with canvas size
    ctx.strokeStyle = '#6366f1'; // Premium Indigo

    redrawCanvas();
  }, [paths, canvasSize]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    paths.forEach(path => {
      if (path.length === 0) return;
      ctx.beginPath();
      // Map relative coordinates to current pixel size
      ctx.moveTo(path[0].x * canvas.width, path[0].y * canvas.height);
      path.forEach((point: any) => {
        ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
      });
      ctx.stroke();
    });
  };

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = (e.clientX || (e.touches && e.touches[0].clientX)) ?? 0;
    const clientY = (e.clientY || (e.touches && e.touches[0].clientY)) ?? 0;

    // Convert to relative coordinates (0 to 1)
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
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
            {/* Main Area with Navigation */}
            <div className="w-full flex items-center justify-between gap-4 md:gap-6">
              <button
                onClick={() => navigateItems('prev')}
                disabled={!isRandom && currentIndex === 0}
                className="hidden md:flex size-14 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-0 flex items-center justify-center transition-all group shrink-0"
              >
                <span className="material-symbols-outlined text-white text-3xl group-hover:-translate-x-1 transition-transform">chevron_left</span>
              </button>

              <div className="flex-1 max-w-[500px] w-full relative group/canvas">
                <motion.div
                  key={currentItem.text}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  ref={containerRef}
                  className="relative aspect-square w-full bg-black/40 rounded-[32px] md:rounded-[40px] border border-white/10 shadow-inner overflow-hidden flex items-center justify-center cursor-crosshair"
                >
                  <canvas
                    ref={canvasRef}
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
                      className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none transition-opacity duration-300 select-none"
                      style={{ opacity: guideOpacity }}
                    >
                      <span className="text-[min(40vw,240px)] font-kanji text-white leading-none">
                        {sanitize(currentItem.text)}
                      </span>
                    </div>
                  )}

                  {/* Grit Grid */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10%' }}></div>
                  <div className="absolute inset-0 border-[0.5px] border-white/5 pointer-events-none opacity-20">
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/10" />
                    <div className="absolute top-0 left-1/2 w-[1px] h-full bg-white/10" />
                  </div>
                </motion.div>

                {/* Progress & Nav inside canvas area for mobile */}
                <div className="flex items-center justify-between mt-6 px-1 lg:absolute lg:-bottom-12 lg:left-0 lg:w-full lg:px-0">
                  <div className="md:hidden flex gap-2">
                    <button
                      onClick={() => navigateItems('prev')}
                      disabled={!isRandom && currentIndex === 0}
                      className="size-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center disabled:opacity-0"
                    >
                      <span className="material-symbols-outlined text-white text-xl">chevron_left</span>
                    </button>
                    <button
                      onClick={() => navigateItems('next')}
                      disabled={!isRandom && currentIndex === items.length - 1}
                      className="size-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center disabled:opacity-0"
                    >
                      <span className="material-symbols-outlined text-white text-xl">chevron_right</span>
                    </button>
                  </div>
                  <div className="px-5 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/20 text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                    {currentIndex + 1} / {items.length}
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigateItems('next')}
                disabled={!isRandom && currentIndex === items.length - 1}
                className="hidden md:flex size-14 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-0 flex items-center justify-center transition-all group shrink-0"
              >
                <span className="material-symbols-outlined text-white text-3xl group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
            </div>

            {/* Controls Bar */}
            <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-[32px] p-2 flex flex-col md:flex-row items-center gap-2">
              <div className="flex items-center gap-3 px-6 h-14 w-full md:w-auto md:border-r border-white/10">
                <span className="material-symbols-outlined text-primary text-sm shrink-0">visibility</span>
                <input
                  type="range" min="0" max="0.8" step="0.05"
                  value={guideOpacity}
                  onChange={(e) => setGuideOpacity(parseFloat(e.target.value))}
                  className="flex-1 md:w-24 accent-primary"
                />
              </div>

              <div className="flex items-center justify-between w-full md:w-auto md:flex-1 px-4 md:px-2 gap-2 pb-2 md:pb-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => speakJapanese(sanitize(currentItem.text))}
                    className="size-11 rounded-2xl bg-white/5 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all"
                    title="Listen"
                  >
                    <span className="material-symbols-outlined">volume_up</span>
                  </button>
                  <button
                    onClick={() => setIsRandom(!isRandom)}
                    className={`size-11 rounded-2xl flex items-center justify-center transition-all ${isRandom ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-gray-400'}`}
                    title="Randomize"
                  >
                    <span className="material-symbols-outlined text-xl">casino</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 h-11 px-2 bg-white/5 rounded-2xl">
                  <button
                    onClick={undoPath}
                    disabled={paths.length === 0}
                    className="size-10 rounded-xl hover:bg-white/10 text-gray-400 hover:text-indigo-300 disabled:opacity-20 flex items-center justify-center transition-all"
                    title="Undo"
                  >
                    <span className="material-symbols-outlined">undo</span>
                  </button>
                  <div className="w-px h-4 bg-white/10" />
                  <button
                    onClick={clearCanvas}
                    className="size-10 rounded-xl hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all"
                    title="Clear"
                  >
                    <span className="material-symbols-outlined text-[22px]">delete_sweep</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className={`size-11 rounded-2xl flex items-center justify-center transition-all ${showGuide ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/5 text-gray-500'}`}
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

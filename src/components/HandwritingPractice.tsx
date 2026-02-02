'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
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
  const dragControls = useDragControls();
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

        // Explicitly sync physical pixels to CSS pixels
        if (canvasRef.current) {
          canvasRef.current.width = width;
          canvasRef.current.height = height;
          redrawCanvas(); // Immediate redraw on resize
        }
      }
    });

    observer.observe(containerRef.current);

    // Trigger initial size capture
    const initialRect = containerRef.current.getBoundingClientRect();
    if (initialRect.width > 0) {
      setCanvasSize({ width: initialRect.width, height: initialRect.height });
      if (canvasRef.current) {
        canvasRef.current.width = initialRect.width;
        canvasRef.current.height = initialRect.height;
      }
    }

    return () => observer.disconnect();
  }, [currentIndex]); // Re-run when item changes to catch the new container node

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
    if (e.cancelable) e.preventDefault();
    const { x, y } = getCoordinates(e);

    setPaths(prev => {
      const newPaths = [...prev];
      if (newPaths.length === 0) return prev; // Safety check
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
          initial={{ scale: 0.9, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 100 }}
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 150 || info.velocity.y > 500) {
              onClose();
            }
          }}
          className="glass-panel w-full max-w-2xl rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl border-white/10 relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Drag Handle for All (Now more integrated without header) */}
          <div
            onPointerDown={e => dragControls.start(e)}
            className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-white/10 z-50 cursor-grab active:cursor-grabbing hover:bg-white/20 transition-colors"
          />

          <div className="pt-16 pb-10 px-8 flex flex-col items-center gap-10">
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
                    className="absolute inset-0 z-20 w-full h-full touch-none"
                    style={{ touchAction: 'none' }}
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

                  {/* Romaji Floating Badge - Top Center (Precisely Centered) */}
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md pointer-events-none transition-all flex items-center justify-center">
                    <span className="text-2xl font-black text-indigo-300/90 uppercase tracking-[0.2em] leading-normal mb-[-2px] mr-[-0.2em]">
                      {currentItem.reading}
                    </span>
                  </div>
                </motion.div>

                {/* Mobile Navigation Arrows (only displayed when screen is narrow) */}
                <div className="md:hidden flex items-center justify-between mt-4 w-full px-2">
                  <button
                    onClick={() => navigateItems('prev')}
                    disabled={!isRandom && currentIndex === 0}
                    className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center disabled:opacity-20"
                  >
                    <span className="material-symbols-outlined text-white text-2xl">chevron_left</span>
                  </button>
                  <button
                    onClick={() => navigateItems('next')}
                    disabled={!isRandom && currentIndex === items.length - 1}
                    className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center disabled:opacity-20"
                  >
                    <span className="material-symbols-outlined text-white text-2xl">chevron_right</span>
                  </button>
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

            {/* Controls Bar Container */}
            <div className="w-full max-w-xl flex flex-col items-center gap-4">
              {/* Progress Indicator - Now independently positioned */}
              <div className="px-5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                {currentIndex + 1} / {items.length}
              </div>

              {/* Main Controls Panel */}
              <div className="w-full bg-white/5 border border-white/10 rounded-[40px] p-5 flex flex-col items-center gap-6 shadow-xl">
                {/* Top: Guide Opacity Slider with integrated icon */}
                <div className="flex items-center gap-4 px-6 h-10 w-full max-w-sm bg-black/20 rounded-full border border-white/5">
                  <span className="material-symbols-outlined text-primary text-lg shrink-0">visibility</span>
                  <input
                    type="range" min="0" max="0.8" step="0.05"
                    value={guideOpacity}
                    onChange={(e) => setGuideOpacity(parseFloat(e.target.value))}
                    className="flex-1 accent-primary h-1 rounded-full cursor-pointer"
                  />
                </div>

                {/* Bottom: Action Buttons with improved spacing */}
                <div className="flex items-center justify-center gap-2 md:gap-4 w-full">
                  <button
                    onClick={() => speakJapanese(sanitize(currentItem.text))}
                    className="size-12 rounded-2xl bg-white/5 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all border border-white/5"
                    title="Listen"
                  >
                    <span className="material-symbols-outlined text-[22px]">volume_up</span>
                  </button>

                  <button
                    onClick={() => setIsRandom(!isRandom)}
                    className={`size-12 rounded-2xl flex items-center justify-center transition-all border ${isRandom ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/5 text-gray-400'}`}
                    title="Randomize"
                  >
                    <span className="material-symbols-outlined text-xl">casino</span>
                  </button>

                  <div className="h-8 w-px bg-white/10 mx-1" />

                  <button
                    onClick={undoPath}
                    disabled={paths.length === 0}
                    className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-indigo-300 disabled:opacity-20 flex items-center justify-center transition-all border border-white/5"
                    title="Undo"
                  >
                    <span className="material-symbols-outlined text-[22px]">undo</span>
                  </button>

                  <button
                    onClick={clearCanvas}
                    className="size-12 rounded-2xl bg-white/5 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all border border-white/5"
                    title="Clear"
                  >
                    <span className="material-symbols-outlined text-[24px]">delete_sweep</span>
                  </button>

                  <div className="h-8 w-px bg-white/10 mx-1" />

                  <button
                    onClick={() => setShowGuide(!showGuide)}
                    className={`size-12 rounded-2xl flex items-center justify-center transition-all border ${showGuide ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-white/5 border-white/5 text-gray-500'}`}
                    title="Toggle Guide"
                  >
                    <span className="material-symbols-outlined text-[22px]">{showGuide ? 'visibility' : 'visibility_off'}</span>
                  </button>
                </div>
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

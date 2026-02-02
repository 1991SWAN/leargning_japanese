'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls, useMotionValue, useTransform, animate } from 'framer-motion';
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
  const [paths, setPaths] = useState<any[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Swipe Animation State
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);
  const rotateY = useTransform(x, [-200, 0, 200], [-15, 0, 15]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasSetInitialIndex = useRef(false);

  const sanitize = (text: string) => text ? text.replace(/\[[^\]]+\]/g, '') : '';

  useEffect(() => {
    if (initialText && !hasSetInitialIndex.current) {
      const index = items.findIndex((item: HandwritingItem) => sanitize(item.text) === sanitize(initialText));
      if (index !== -1) {
        setCurrentIndex(index);
      }
      hasSetInitialIndex.current = true;
    }
  }, [initialText, items]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigateItems('next');
      if (e.key === 'ArrowLeft') navigateItems('prev');
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isRandom, onClose]);

  // Handle Resize and DPI
  useEffect(() => {
    if (!containerRef.current) return;

    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();

      // Set display size
      setCanvasSize({ width: rect.width, height: rect.height });

      // Set internal resolution
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Sync context
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        redrawCanvas();
      }
    };

    const observer = new ResizeObserver(updateCanvasSize);
    observer.observe(containerRef.current);
    updateCanvasSize();

    return () => observer.disconnect();
  }, [currentIndex]);

  useEffect(() => {
    redrawCanvas();
  }, [paths, canvasSize]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Reset and apply DPI scale
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Line Styles (Must be set after context reset)
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(5, canvasSize.width / 40);
    ctx.strokeStyle = '#6366f1';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(99, 102, 241, 0.4)';

    paths.forEach(path => {
      if (path.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x * canvasSize.width, path[0].y * canvasSize.height);
      path.forEach((point: any) => {
        ctx.lineTo(point.x * canvasSize.width, point.y * canvasSize.height);
      });
      ctx.stroke();
    });
  };

  const getCoordinates = (e: any) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();

    const clientX = (e.touches ? e.touches[0].clientX : (e.clientX || 0));
    const clientY = (e.touches ? e.touches[0].clientY : (e.clientY || 0));

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x, y };
  };

  const startDrawing = (e: any) => {
    const { x, y } = getCoordinates(e);
    // Boundary check for swipe zone
    if (y > 0.88) return;

    setIsDrawing(true);
    setPaths(prev => [...prev, [{ x, y }]]);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const { x, y } = getCoordinates(e);

    setPaths(prev => {
      const newPaths = [...prev];
      if (newPaths.length === 0) return prev;
      const lastPath = [...newPaths[newPaths.length - 1]];
      lastPath.push({ x, y });
      newPaths[newPaths.length - 1] = lastPath;
      return newPaths;
    });
  };

  const endDrawing = () => setIsDrawing(false);
  const clearCanvas = () => setPaths([]);
  const undoPath = () => setPaths(prev => prev.slice(0, -1));

  const navigateItems = (dir: 'prev' | 'next') => {
    if (isRandom) {
      setCurrentIndex(Math.floor(Math.random() * items.length));
    } else {
      if (dir === 'next' && currentIndex < items.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (dir === 'prev' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }
    clearCanvas();
    x.set(0); // Reset swipe position
  };

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];

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
          className="glass-panel w-full max-w-2xl rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl border-white/10 relative flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <div
            onPointerDown={e => dragControls.start(e)}
            className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-white/10 z-50 cursor-grab active:cursor-grabbing hover:bg-white/20 transition-colors"
          />

          <div className="pt-12 pb-4 px-4 md:px-8 flex flex-col items-center gap-4 md:gap-6 flex-1">
            {/* Main Area: Canvas Container */}
            <div className="w-full flex items-center justify-center flex-1 max-h-[50vh] md:max-h-[60vh]">
              <div className="flex-1 max-w-[500px] aspect-square relative group/canvas">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentItem.text}
                    style={{ x, opacity, scale, rotateY, perspective: 1000 }}
                    ref={containerRef}
                    className="relative w-full h-full bg-black/40 rounded-[32px] md:rounded-[40px] border border-white/10 shadow-inner overflow-hidden flex items-center justify-center cursor-crosshair touch-none"
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
                        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none transition-opacity duration-300 select-none pb-4"
                        style={{ opacity: 1.0 }}
                      >
                        <span className="text-[min(45vw,260px)] font-kanji text-white/50 leading-none">
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

                    {/* Romaji Floating Badge */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md pointer-events-none transition-all flex items-center justify-center">
                      <span className="text-2xl font-black text-indigo-300/90 uppercase tracking-[0.2em] leading-normal mb-[-2px] mr-[-0.2em]">
                        {currentItem.reading}
                      </span>
                    </div>

                    {/* Swipe Zone (Bottom) */}
                    <div
                      className="absolute bottom-0 left-0 w-full h-14 z-40 flex items-center justify-center cursor-ew-resize overflow-hidden"
                      style={{ background: 'linear-gradient(to top, rgba(99, 102, 241, 0.2), transparent)' }}
                    >
                      <motion.div
                        onPan={(_, info) => {
                          x.set(info.offset.x);
                        }}
                        onPanEnd={(_, info) => {
                          if (info.offset.x > 100) navigateItems('prev');
                          else if (info.offset.x < -100) navigateItems('next');
                          else {
                            animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
                          }
                        }}
                        className="w-full h-full flex items-center justify-center group"
                      >
                        <div className="flex items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                          <span className="text-[10px] text-white font-black uppercase tracking-[0.5em] pl-2">Realtime Swipe</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="w-full max-w-xl flex flex-col items-center gap-4 mt-auto">
              <div className="w-full bg-white/5 border border-white/10 rounded-[32px] md:rounded-[40px] p-4 md:p-5 flex flex-col items-center gap-4 shadow-xl">
                <div className="flex items-center justify-center gap-6 w-full px-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => speakJapanese(sanitize(currentItem.text))}
                      className="size-11 md:size-12 rounded-2xl bg-white/5 hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all border border-white/5"
                    >
                      <span className="material-symbols-outlined text-[20px] md:text-[22px]">volume_up</span>
                    </button>
                    <button
                      onClick={() => setIsRandom(!isRandom)}
                      className={`size-11 md:size-12 rounded-2xl flex items-center justify-center transition-all border ${isRandom ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/5 text-gray-400'}`}
                    >
                      <span className="material-symbols-outlined text-xl">casino</span>
                    </button>
                  </div>

                  <div className="h-8 w-px bg-white/10 mx-1" />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={undoPath}
                      disabled={paths.length === 0}
                      className="size-11 md:size-12 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-indigo-300 disabled:opacity-20 flex items-center justify-center transition-all border border-white/5"
                    >
                      <span className="material-symbols-outlined text-[20px] md:text-[22px]">undo</span>
                    </button>
                    <button
                      onClick={clearCanvas}
                      className="size-11 md:size-12 rounded-2xl bg-white/5 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all border border-white/5"
                    >
                      <span className="material-symbols-outlined text-[22px] md:text-[24px]">delete_sweep</span>
                    </button>
                    <button
                      onClick={() => setShowGuide(!showGuide)}
                      className={`size-11 md:size-12 rounded-2xl flex items-center justify-center transition-all border ${showGuide ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-white/5 border-white/5 text-gray-500'}`}
                    >
                      <span className="material-symbols-outlined text-[20px] md:text-[22px]">{showGuide ? 'visibility' : 'visibility_off'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pb-2">
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.4em] flex items-center gap-2 opacity-30">
                  Precision Writing Mode
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

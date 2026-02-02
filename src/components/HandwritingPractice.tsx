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
  const opacity = useTransform(x, [-200, 0, 200], [0.4, 1, 0.4]);
  const scale = useTransform(x, [-200, 0, 200], [0.92, 1, 0.92]);
  const rotateY = useTransform(x, [-200, 0, 200], [-12, 0, 12]);

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

  const currentItem = items[currentIndex] || items[0];

  // Handle Resize and DPI
  useEffect(() => {
    if (!containerRef.current) return;

    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();

      setCanvasSize({ width: rect.width, height: rect.height });

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Scale the context
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(5, canvasSize.width / 40);
    ctx.strokeStyle = '#818cf8'; // Indigo 400
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(129, 140, 248, 0.4)';

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
    if (y > 0.94) return; // Very thin edge for swipe

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
    x.set(0);
  };

  if (!items || items.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 50 }}
          className="w-full max-w-2xl h-full md:h-[90vh] md:max-h-[850px] bg-[#0c0c0e] md:rounded-[48px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] border-white/5 relative flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Top Info Overlay */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none">
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.5em] mb-1 opacity-50">Identity</span>
            <div className="px-5 py-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
              <span className="text-3xl font-black text-white/90 uppercase tracking-[0.1em]">
                {currentItem.reading}
              </span>
            </div>
          </div>

          {/* Close Button (Minimal) */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 z-50 size-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10"
          >
            <span className="material-symbols-outlined text-white/40 text-xl">close</span>
          </button>

          {/* Main Immersive Canvas Area */}
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentItem.text}
                style={{ x, opacity, scale, rotateY, perspective: 1200 }}
                ref={containerRef}
                className="absolute inset-0 flex items-center justify-center touch-none cursor-crosshair"
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
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none select-none">
                    <span className="text-[min(65vw,400px)] font-kanji text-white/[0.05] leading-none transition-all duration-500">
                      {sanitize(currentItem.text)}
                    </span>
                  </div>
                )}

                {/* Refined Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #fff 0.5px, transparent 0.5px)', backgroundSize: '8%' }}></div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[1px] h-[60%] bg-white/[0.03]" />
                  <div className="absolute w-[60%] h-[1px] bg-white/[0.03]" />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Floating Action Buttons (Left) */}
            <div className="absolute bottom-12 left-8 z-50 flex items-center gap-3">
              <button
                onClick={() => speakJapanese(sanitize(currentItem.text))}
                className="size-12 rounded-2xl bg-white/5 hover:bg-indigo-500/20 text-white/40 hover:text-indigo-400 flex items-center justify-center transition-all border border-white/5 backdrop-blur-lg"
              >
                <span className="material-symbols-outlined text-[22px]">volume_up</span>
              </button>
              <button
                onClick={() => setIsRandom(!isRandom)}
                className={`size-12 rounded-2xl flex items-center justify-center transition-all border backdrop-blur-lg ${isRandom ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-white/5 border-white/5 text-white/20'}`}
              >
                <span className="material-symbols-outlined text-[20px]">casino</span>
              </button>
            </div>

            {/* Floating Action Buttons (Right) */}
            <div className="absolute bottom-12 right-8 z-50 flex items-center gap-3">
              <button
                onClick={undoPath}
                disabled={paths.length === 0}
                className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white/20 hover:text-white/60 disabled:opacity-5 flex items-center justify-center transition-all border border-white/5 backdrop-blur-lg"
              >
                <span className="material-symbols-outlined text-[22px]">undo</span>
              </button>
              <button
                onClick={clearCanvas}
                className="size-12 rounded-2xl bg-white/5 hover:bg-red-500/20 text-white/20 hover:text-red-400 flex items-center justify-center transition-all border border-white/5 backdrop-blur-lg"
              >
                <span className="material-symbols-outlined text-[22px]">delete_sweep</span>
              </button>
              <button
                onClick={() => setShowGuide(!showGuide)}
                className={`size-12 rounded-2xl flex items-center justify-center transition-all border backdrop-blur-lg ${showGuide ? 'bg-white/10 text-white/60' : 'bg-white/5 border-white/5 text-white/10'}`}
              >
                <span className="material-symbols-outlined text-[22px]">{showGuide ? 'visibility' : 'visibility_off'}</span>
              </button>
            </div>

            {/* Bottom Edge Swipe Handle (Ultra Minimal) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[40%] h-1 z-[60] bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                style={{ x: useTransform(x, [-100, 100], [-20, 20]) }}
                className="w-full h-full bg-indigo-500/40"
              />
            </div>

            <motion.div
              className="absolute bottom-0 left-0 w-full h-16 z-50 cursor-ew-resize"
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
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

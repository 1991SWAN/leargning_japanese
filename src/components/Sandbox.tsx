import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CinematicShell from './common/CinematicShell';
import FuriganaText from './common/FuriganaText';
import { Vocabulary } from '@/types/learning';
import HandwritingStudio from './HandwritingStudio';
import { FSRSEngine, Rating, FSRSCard } from '@/lib/fsrs-engine';
import { masteryService } from '@/lib/services/supabaseService';

interface SandboxProps {
    vocabList: Vocabulary[];
}

export default function Sandbox({ vocabList }: SandboxProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [options, setOptions] = useState<Vocabulary[]>([]);
    const [isStudioOpen, setIsStudioOpen] = useState(false);

    // New Question Type Mode
    const [studyMode, setStudyMode] = useState<'mastery' | 'recognition'>('mastery');
    const [revealFlashcard, setRevealFlashcard] = useState(false); // For recognition review

    const [fsrsData, setFsrsData] = useState<FSRSCard | null>(null);
    const fsrs = useRef(new FSRSEngine()).current;

    // Safety check
    if (!vocabList || vocabList.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-white/50">Loading vocabulary data...</p>
            </div>
        );
    }

    const currentVocab = vocabList[currentQuestionIndex];

    // Fallback logic if FSRS data is totally missing for this lab prototype
    const srsStatus = fsrsData ?
        (fsrsData.state === 0 ? 'learning' : fsrsData.state === 1 ? 'learning' : 'reviewing')
        : (currentVocab.srs_data?.status || (currentQuestionIndex % 2 === 0 ? 'learning' : 'reviewing'));

    const isHighStability = fsrsData ? (fsrsData.stability > 2.0 && fsrsData.state > 1) : (srsStatus === 'reviewing' || srsStatus === 'mastered');

    const generateOptions = () => {
        const optionsArr = [currentVocab];
        const otherVocabs = vocabList.filter(v => v.id !== currentVocab.id);

        // Shuffle others and pick 3
        const shuffledOthers = [...otherVocabs].sort(() => 0.5 - Math.random());
        const selectedOthers = shuffledOthers.slice(0, 3);

        const allOptions = [...optionsArr, ...selectedOthers].sort(() => 0.5 - Math.random());
        return allOptions;
    };

    // Load FSRS data when vocabulary changes
    useEffect(() => {
        const loadFSRS = async () => {
            if (!currentVocab) return;
            try {
                const record = await masteryService.getRecord('VOCAB', currentVocab.id);
                if (record) {
                    setFsrsData({
                        stability: record.stability,
                        difficulty: record.difficulty,
                        reps: record.reps,
                        lapses: record.lapses,
                        state: record.state,
                        last_review: record.last_review ? new Date(record.last_review) : undefined,
                        next_review: new Date(record.next_review),
                        elapsed_days: 0,
                        scheduled_days: 0
                    });
                } else {
                    setFsrsData(null);
                }
            } catch (err) {
                console.error('Failed to load FSRS data:', err);
                setFsrsData(null);
            }
        };
        loadFSRS();
    }, [currentVocab]);

    useEffect(() => {
        if (!isHighStability) {
            setOptions(generateOptions());
        }
    }, [currentVocab, vocabList, isHighStability]);

    const handleNext = () => {
        setShowAnswer(false);
        setSelectedOptionId(null);
        setIsStudioOpen(false);
        setRevealFlashcard(false);
        if (currentQuestionIndex < vocabList.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setCurrentQuestionIndex(0); // Looping for the prototype
        }
    };

    const handleOptionSelect = (selectedId: string) => {
        if (showAnswer) return;
        setSelectedOptionId(selectedId);
        setShowAnswer(true);
    };

    const handleManualRating = async (rating: Rating) => {
        const currentCard = fsrsData || fsrs.initCard();
        const { card } = fsrs.review(currentCard, rating);
        setFsrsData(card);

        try {
            await masteryService.updateRecord({
                item_type: 'VOCAB',
                item_id: currentVocab.id,
                stability: card.stability,
                difficulty: card.difficulty,
                reps: card.reps,
                lapses: card.lapses,
                state: card.state,
                last_review: new Date().toISOString(),
                next_review: card.next_review?.toISOString() || new Date().toISOString()
            });
        } catch (err) {
            console.error('Failed to save FSRS data:', err);
        }

        setTimeout(() => {
            handleNext();
        }, 300);
    };

    return (
        <div className="w-full h-full">
            <AnimatePresence mode="wait">
                <motion.div
                    key="cinematic-vocab-lab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full min-h-[100dvh]"
                >
                    <CinematicShell levelColor={isHighStability ? "#f59e0b" : "#3b82f6"} id="vocab-lab">
                        <div className="max-w-4xl w-full px-4 md:px-6 py-6 md:py-20 flex flex-col gap-6 md:gap-12 mx-auto">
                            {/* Header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-0">
                                <div className="flex flex-col gap-1 md:gap-2">
                                    <span className={`premium-tag w-fit ${isHighStability ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'} flex items-center gap-2 px-3 md:px-4 py-1.5`}>
                                        <div className={`w-2 h-2 rounded-full ${isHighStability ? 'bg-amber-400 animate-pulse' : 'bg-blue-400 animate-pulse'}`} />
                                        <span className="text-[10px] md:text-xs">FSRS {srsStatus.toUpperCase()} {fsrsData && `(S=${fsrsData.stability.toFixed(1)})`}</span>
                                    </span>
                                    <h1 className="text-3xl md:text-6xl font-black bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent tracking-tighter">Vocab Hybrid</h1>
                                    <p className="text-white/40 font-medium text-[10px] md:text-lg tracking-wide hidden sm:block">Adaptive testing: Multiple choice for learning, Active Recall for reviewing.</p>
                                </div>
                                {/* Study Mode Toggle */}
                                <div className="flex h-[52px] items-center rounded-2xl bg-black/40 backdrop-blur-xl p-1.5 border border-white/10 shadow-2xl shrink-0 w-full md:w-auto relative z-20">
                                    <button
                                        onClick={() => { setStudyMode('mastery'); setShowAnswer(false); setRevealFlashcard(false); }}
                                        className={`flex-1 md:flex-none px-6 h-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 rounded-xl flex items-center justify-center gap-2 ${studyMode === 'mastery' ? 'bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.3)] scale-[1.02]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">{studyMode === 'mastery' ? 'edit_square' : 'edit'}</span>
                                        Mastery
                                    </button>
                                    <button
                                        onClick={() => { setStudyMode('recognition'); setShowAnswer(false); setRevealFlashcard(false); }}
                                        className={`flex-1 md:flex-none px-6 h-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 rounded-xl flex items-center justify-center gap-2 ${studyMode === 'recognition' ? 'bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.3)] scale-[1.02]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">{studyMode === 'recognition' ? 'visibility' : 'visibility_off'}</span>
                                        Recognition
                                    </button>
                                </div>
                            </div>

                            {/* Main Quiz Area */}
                            <div className="glass-panel border-white/10 rounded-[32px] md:rounded-[48px] p-4 md:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center min-h-[450px] md:min-h-[550px] relative overflow-hidden bg-gradient-to-b from-white/[0.03] to-transparent">

                                {/* Question Progress */}
                                <div className="absolute top-4 md:top-8 left-4 md:left-8 right-4 md:right-8 flex justify-between text-[10px] md:text-xs font-black text-white/30 uppercase tracking-widest items-center z-20">
                                    <div className="flex items-center gap-2 bg-black/30 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/5 backdrop-blur-md">
                                        <span className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full ${isHighStability ? 'bg-amber-400' : 'bg-blue-400'}`} />
                                        <span>{isHighStability ? 'Active Recall' : 'Recognition'}</span>
                                    </div>
                                    <span className="bg-black/30 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/5 font-mono">{currentQuestionIndex + 1} / {vocabList.length}</span>
                                </div>

                                {/* The Prompt */}
                                <div className="text-center mb-8 md:mb-16 mt-16 md:mt-8 w-full max-w-2xl relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-3xl -z-10" />
                                    <h2 className={`text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-2 md:mb-6 ${isHighStability ? 'text-amber-400' : 'text-blue-400'}`}>
                                        {studyMode === 'mastery' ? 'What means:' : 'How do you read/mean:'}
                                    </h2>
                                    <div className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                                        {studyMode === 'mastery' ? (
                                            currentVocab.meaning
                                        ) : (
                                            <FuriganaText text={`${currentVocab.kanji || currentVocab.furigana}${currentVocab.kanji && currentVocab.kanji !== currentVocab.furigana ? `[${currentVocab.furigana}]` : ''}`} />
                                        )}
                                    </div>
                                </div>

                                {!isHighStability ? (
                                    /* Options Grid for Multiple Choice (Learning) - Force 2x2 on mobile */
                                    <div className="grid grid-cols-2 gap-2 md:gap-4 w-full max-w-2xl z-10 px-2 md:px-0">
                                        {options.map((opt, i) => {
                                            const isCorrect = opt.id === currentVocab.id;

                                            let btnClass = "relative p-3 md:p-8 rounded-2xl md:rounded-[32px] border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] hover:bg-white/10 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden cursor-pointer group hover:-translate-y-1 hover:shadow-2xl hover:border-white/20 min-h-[100px] md:min-h-[140px]";

                                            if (showAnswer) {
                                                if (isCorrect) {
                                                    // The correct answer always highlights green when revealed
                                                    btnClass = "relative p-3 md:p-8 rounded-2xl md:rounded-[32px] border-2 border-green-500 bg-gradient-to-b from-green-500/20 to-green-900/10 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(34,197,94,0.3)] scale-[1.02] z-10 min-h-[100px] md:min-h-[140px]";
                                                } else if (selectedOptionId === opt.id) {
                                                    // The wrong answer the user selected highlights red
                                                    btnClass = "relative p-3 md:p-8 rounded-2xl md:rounded-[32px] border-2 border-red-500 bg-gradient-to-b from-red-500/20 to-red-900/10 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.3)] z-0 min-h-[100px] md:min-h-[140px]";
                                                } else {
                                                    // Unselected wrong answers fade out
                                                    btnClass = "relative p-3 md:p-8 rounded-2xl md:rounded-[32px] border border-white/5 bg-white/[0.01] opacity-30 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden blur-[1px] min-h-[100px] md:min-h-[140px]";
                                                }
                                            }

                                            return (
                                                <button
                                                    key={opt.id + i}
                                                    className={btnClass}
                                                    onClick={() => handleOptionSelect(opt.id)}
                                                    disabled={showAnswer}
                                                >
                                                    {showAnswer && isCorrect && (
                                                        <div className="absolute inset-0 bg-gradient-to-t from-green-500/20 to-transparent pointer-events-none" />
                                                    )}
                                                    <span className={`text-xl md:text-5xl font-black text-white ${studyMode === 'mastery' ? 'mb-1 md:mb-3' : 'mb-0'} drop-shadow-md transition-transform duration-300 ${studyMode === 'mastery' ? 'font-kanji' : ''} ${showAnswer && isCorrect ? 'scale-110' : 'group-hover:scale-110'}`}>
                                                        {studyMode === 'mastery' ? (opt.kanji || opt.furigana) : opt.meaning}
                                                    </span>
                                                    {studyMode === 'mastery' && (
                                                        <span className="text-[10px] md:text-sm font-bold tracking-widest md:tracking-[0.2em] uppercase text-white/50">{opt.furigana}</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : studyMode === 'mastery' ? (
                                    /* Mastery Active Recall Prompt (Reviewing) - Render inline HandwritingStudio */
                                    <div className="w-full h-full min-h-[400px] flex items-center justify-center -mt-8">
                                        <HandwritingStudio
                                            items={[{ text: currentVocab.kanji || currentVocab.furigana, reading: currentVocab.furigana || '' }]}
                                            initialText={currentVocab.kanji || currentVocab.furigana}
                                            mode="review"
                                            inline={true}
                                            onClose={handleNext}
                                        />
                                    </div>
                                ) : (
                                    /* Recognition Active Recall Prompt (Reviewing) - Flashcard Flip */
                                    <div className="w-full h-full min-h-[400px] flex items-center justify-center z-10">
                                        <div
                                            onClick={() => {
                                                if (!revealFlashcard) {
                                                    setRevealFlashcard(true);
                                                    setShowAnswer(true); // To show FSRS buttons
                                                }
                                            }}
                                            className="w-full max-w-lg min-h-[300px] md:min-h-[350px] rounded-[40px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                                        >
                                            {!revealFlashcard ? (
                                                <div className="flex flex-col items-center justify-center text-center px-8 relative z-10">
                                                    <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-500 border border-white/10 group-hover:border-amber-500/30 shadow-2xl">
                                                        <span className="material-symbols-outlined text-4xl text-white/40 group-hover:text-amber-400 transition-colors duration-500">touch_app</span>
                                                    </div>
                                                    <p className="text-white/60 font-black uppercase tracking-[0.3em] text-sm group-hover:text-white transition-colors duration-500">Tap to reveal correct meaning</p>
                                                    <p className="text-white/30 text-[10px] mt-4 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500">Be honest with your own recall</p>
                                                </div>
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
                                                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                                                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                                                    className="flex flex-col items-center justify-center text-center px-6 md:px-12 w-full h-full bg-gradient-to-b from-amber-500/20 to-amber-900/40 border-2 border-amber-500/30 rounded-[40px] shadow-[inset_0_0_50px_rgba(245,158,11,0.1)]"
                                                >
                                                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-[40px]" />
                                                    <span className="text-amber-400 font-black uppercase tracking-[0.4em] text-[10px] mb-8 bg-black/40 px-4 py-2 rounded-full border border-amber-500/20 shadow-lg relative z-10">Correct Meaning</span>
                                                    <p className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-[0_0_20px_rgba(251,191,36,0.5)] z-10">{currentVocab.meaning}</p>

                                                    {currentVocab.examples && currentVocab.examples.length > 0 && (
                                                        <div className="mt-10 px-6 py-5 rounded-3xl bg-black/40 border border-white/5 w-full relative z-10 backdrop-blur-md">
                                                            <p className="font-kanji text-gray-200 text-sm md:text-base mb-2 font-medium">"{(currentVocab.examples as any)[0]?.jp}"</p>
                                                            <p className="text-xs text-gray-500 leading-relaxed font-bold">{(currentVocab.examples as any)[0]?.kr || (currentVocab.examples as any)[0]?.en}</p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* FSRS Manual Rating Controls */}
                                <AnimatePresence>
                                    {((!isHighStability && showAnswer) || (isHighStability && studyMode === 'recognition' && revealFlashcard)) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, y: 20 }}
                                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                                            exit={{ opacity: 0, height: 0, y: 20 }}
                                            className="w-full flex flex-col items-center gap-4 z-20 overflow-hidden mt-8"
                                        >
                                            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">Select FSRS Rating</p>
                                            <div className="w-full max-w-lg grid grid-cols-4 gap-2 px-2 md:px-0">
                                                {[
                                                    { r: Rating.Again, l: 'Again', c: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 backdrop-blur-md shadow-lg shadow-black/50' },
                                                    { r: Rating.Hard, l: 'Hard', c: 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20 backdrop-blur-md shadow-lg shadow-black/50' },
                                                    { r: Rating.Good, l: 'Good', c: 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 backdrop-blur-md shadow-lg shadow-black/50' },
                                                    { r: Rating.Easy, l: 'Easy', c: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 backdrop-blur-md shadow-lg shadow-black/50' },
                                                ].map((btn) => (
                                                    <button
                                                        key={btn.r}
                                                        onClick={() => handleManualRating(btn.r)}
                                                        className={`py-3.5 rounded-2xl font-black text-[10px] sm:text-xs border transition-all hover:scale-[1.02] active:scale-[0.98] ${btn.c}`}
                                                    >
                                                        {btn.l}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                            </div>
                        </div>
                    </CinematicShell>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

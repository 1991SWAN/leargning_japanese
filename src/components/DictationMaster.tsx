'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { speakJapanese } from '@/lib/tts';
import { getLevenshteinDistance, getSimilarityFeedback } from '@/lib/stringSimilarity';
import FuriganaText from './common/FuriganaText';

interface DictationItem {
    id: string;
    word: string;
    reading: string;
    meaning: string;
}

export default function DictationMaster({ items }: { items: DictationItem[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState<'none' | 'correct' | 'near' | 'wrong'>('none');
    const [showAnswer, setShowAnswer] = useState(false);
    const [shake, setShake] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const current = items[currentIndex];

    // 데이터 정제 (한자[가나] -> 한자)
    const sanitize = (text: string) => text.replace(/\[[^\]]+\]/g, '');

    const handleCheck = () => {
        const targetWord = sanitize(current.word);
        const distance = getLevenshteinDistance(userInput, targetWord);
        const result = getSimilarityFeedback(distance, targetWord.length);

        setFeedback(result);
        setShowAnswer(true);

        if (result === 'wrong') {
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    };

    const nextItem = () => {
        if (currentIndex < items.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setUserInput('');
            setFeedback('none');
            setShowAnswer(false);
        } else {
            setCurrentIndex(0);
            setUserInput('');
            setFeedback('none');
            setShowAnswer(false);
        }
    };

    return (
        <div className="dictation-container glass-card">
            <div className="dictation-header">
                <h2>소리를 듣고 입력하세요</h2>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="speak-btn-large"
                    onClick={() => speakJapanese(sanitize(current.word))}
                >
                    🔊 다시 듣기
                </motion.button>
            </div>

            <div className="input-section">
                <motion.input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="단어를 입력하세요..."
                    className={`dictation-input ${feedback}`}
                    disabled={showAnswer}
                    onKeyDown={(e) => e.key === 'Enter' && !showAnswer && handleCheck()}
                    animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                />

                <div className="action-buttons">
                    <AnimatePresence mode="wait">
                        {!showAnswer ? (
                            <motion.button
                                key="check"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="btn-primary"
                                onClick={handleCheck}
                            >
                                확인하기
                            </motion.button>
                        ) : (
                            <motion.button
                                key="next"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="btn-primary next-btn"
                                onClick={nextItem}
                            >
                                {currentIndex < items.length - 1 ? '다음 문제' : '다시 시작'} ➔
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {showAnswer && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`feedback-section ${feedback}`}
                    >
                        <motion.h3
                            initial={{ scale: 0.9 }}
                            animate={{ scale: feedback === 'correct' ? [1, 1.1, 1] : 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {feedback === 'correct' && '✨ 완벽합니다!'}
                            {feedback === 'near' && '😯 거의 다 맞았어요!'}
                            {feedback === 'wrong' && '😥 조금 더 연습해봐요'}
                        </motion.h3>

                        <div className="answer-box">
                            <p className="label">정답:</p>
                            <p className="jp-text"><FuriganaText text={current.word} /></p>
                            <div className="sub-info">
                                <span className="reading">{current.reading}</span>
                                <span className="dot">•</span>
                                <span className="meaning">{current.meaning}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

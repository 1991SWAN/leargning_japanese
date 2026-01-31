'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, Vocabulary, Grammar } from '@/types/learning';
import { speakJapanese } from '@/lib/tts';

interface AITutorProps {
    vocabContext: Vocabulary[];
    grammarContext: Grammar[];
}

export default function AITutor({ vocabContext, grammarContext }: AITutorProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const handleSendMessage = async (textOverride?: string) => {
        const text = textOverride || userInput;
        if (!text.trim() || isThinking) return;

        const userMsg: ChatMessage = {
            role: 'user',
            content: text,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        if (!textOverride) setUserInput('');
        setIsThinking(true);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'conversation',
                    prompt: text,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                    context: [...vocabContext.slice(0, 5), ...grammarContext.slice(0, 3)]
                })
            });

            if (!res.ok) throw new Error('AI 응답 실패');

            const data = await res.json();
            const aiMsg: ChatMessage = {
                role: 'ai',
                content: data.text,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            console.error('Chat Error:', err);
            setMessages(prev => [...prev, { role: 'system', content: '연결 오류가 발생했습니다.', timestamp: Date.now() }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="flex gap-8 h-[750px] max-w-[1400px] mx-auto overflow-hidden">
            {/* 세션 히스토리 사이드바 */}
            <div className="w-[300px] shrink-0 flex flex-col gap-6">
                <div className="glass-card p-6 flex flex-col gap-1">
                    <h3 className="text-xl font-black">AI Sessions</h3>
                    <p className="text-[10px] uppercase font-black opacity-30 tracking-widest">Active Learning</p>
                </div>
                <div className="glass-card flex-1 p-4 flex flex-col gap-3">
                    <div className="p-4 rounded-2xl bg-primary/20 border border-primary/20">
                        <span className="text-[10px] font-black opacity-50 block mb-1">CURRENT</span>
                        <p className="text-sm font-bold truncate">대화형 문법 연습</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 opacity-30">
                        <span className="text-[10px] font-black opacity-50 block mb-1">JAN 30, 2026</span>
                        <p className="text-sm font-bold truncate">N5 단어 복습 세션</p>
                    </div>
                    <button
                        className="mt-auto py-4 rounded-2xl border border-white/10 hover:bg-white/5 text-[11px] font-black uppercase tracking-widest opacity-50"
                        onClick={() => setMessages([])}
                    >
                        Clear History
                    </button>
                </div>
            </div>

            {/* 메인 채팅창 */}
            <div className="flex-1 flex flex-col gap-6">
                <div className="flex-1 glass-card flex flex-col overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent z-10" />

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center max-w-[400px] mx-auto opacity-40">
                                <div className="w-24 h-24 mb-8">
                                    <img src="/assets/ai_tutor_icon_premium_2_1769780664796.png" className="w-full h-full object-contain" alt="AI" />
                                </div>
                                <h2 className="text-2xl font-black mb-4">학습 가이드 시작</h2>
                                <p className="text-sm font-medium leading-relaxed italic">
                                    "현재 일본 거주자처럼 대화하고 싶다면 무엇을 공부해야 하나요?" 와 같이 질문해보세요.
                                </p>
                            </div>
                        )}

                        <AnimatePresence>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={`${msg.timestamp}-${i}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`chat-bubble-wrapper ${msg.role}`}
                                >
                                    <div className={`chat-bubble ${msg.role}`}>
                                        <p className="leading-relaxed">{msg.content}</p>
                                        {msg.role === 'ai' && (
                                            <button
                                                className="absolute -right-12 bottom-0 p-3 bg-white/5 rounded-full hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                                                onClick={() => speakJapanese(msg.content)}
                                            >
                                                🔊
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {isThinking && (
                                <motion.div className="chat-bubble-wrapper ai">
                                    <div className="chat-bubble ai opacity-50 flex gap-1">
                                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>.</motion.span>
                                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}>.</motion.span>
                                        <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}>.</motion.span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="p-8 border-t border-white/5 bg-white/[0.02]">
                        <div className="quick-actions flex gap-3 mb-6">
                            {['문법 설명해줘', '예문 보여줘', '회화 연습하자'].map(action => (
                                <button
                                    key={action}
                                    className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest hover:bg-primary/20 hover:border-primary/30 transition-all"
                                    onClick={() => handleSendMessage(action)}
                                >
                                    {action}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="질문을 입력하세요..."
                                className="glass-input flex-1 h-14 px-8 text-base font-medium"
                            />
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={isThinking || !userInput.trim()}
                                className="px-10 h-14 premium-gradient rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

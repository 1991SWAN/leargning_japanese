'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VocabularyStudy from '@/components/VocabularyStudy';
import GrammarLessonView from '@/components/GrammarLesson';
import HandwritingPractice from '@/components/HandwritingPractice';
import AITutor from '@/components/AITutor';
import KanaChart from '@/components/KanaChart';
import KanaSandbox from '@/components/KanaSandbox';
import CircularProgress from '@/components/CircularProgress';
import { HIRAGANA, KATAKANA } from '@/constants/kana';

// Hooks
import { useVocabulary, useGrammar, useLMSStats } from '@/lib/hooks/useLearningData';

// Types
type ModuleType = 'dashboard' | 'kana' | 'vocab' | 'grammar' | 'ai-tutor' | 'settings' | 'progress' | 'ui-lab';

export default function Home() {
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard');
  const [showMoreNav, setShowMoreNav] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [kanaTab, setKanaTab] = useState<'hiragana' | 'katakana'>('hiragana');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [handwritingItems, setHandwritingItems] = useState<{ text: string, reading: string }[]>([]);

  // Learning Data
  const { vocabData } = useVocabulary();
  const { grammarData } = useGrammar();

  const handleKanaSelect = (char: string) => {
    setSelectedText(char);
    // 현재 선택된 탭에 맞춰 전체 리스트 전달
    const list = kanaTab === 'hiragana' ? HIRAGANA : KATAKANA;
    setHandwritingItems(list.map(k => ({ text: k.char, reading: k.romaji })));
    setIsModalOpen(true);
  };

  const navGroups = [
    {
      title: 'Learn',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
        { id: 'kana', label: 'Kana Chart', icon: 'translate' },
        { id: 'vocab', label: 'Vocabulary', icon: 'style' },
        { id: 'grammar', label: 'Grammar', icon: 'architecture' },
      ],
    },
    {
      title: 'Practice',
      items: [
        { id: 'ai-tutor', label: 'AI Tutor', icon: 'smart_toy' },
        { id: 'ui-lab', label: 'UI Laboratory', icon: 'science' },
        { id: 'progress', label: 'Analytics', icon: 'auto_graph' },
      ],
    },
    {
      title: 'Account',
      items: [
        { id: 'settings', label: 'Settings', icon: 'settings' },
      ],
    },
  ];

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  return (
    <div className="flex h-screen w-full bg-background-dark text-white antialiased overflow-hidden font-display">

      {/* Sidebar Navigation - Responsive (Tablet/Desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 glass-panel flex flex-col border-r-0 transition-all duration-300 
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:relative md:translate-x-0 
          md:w-20 xl:w-72`}
      >
        <div className="p-4 xl:p-8 h-full flex flex-col overflow-y-auto custom-scrollbar">
          {/* Brand & Streak Identity */}
          <div className="flex flex-col gap-6 mb-10">
            <div className="flex items-center gap-3 xl:justify-start justify-center">
              <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/40 shrink-0">
                <span className="material-symbols-outlined text-white">translate</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden xl:block">Nihongo<span className="text-primary font-black">Master</span></h1>
            </div>

            {/* Streak Widget (Full only) */}
            <div className="glass-card p-4 rounded-2xl hidden xl:flex items-center justify-between border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-3 relative">
                <div className="size-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                  <span className="material-symbols-outlined text-lg fill-current">local_fire_department</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black opacity-40">Daily Streak</p>
                  <p className="text-sm font-black">7 DAYS</p>
                </div>
              </div>
            </div>
          </div>

          {/* Categorized Navigation */}
          <nav className="flex flex-col gap-8">
            {navGroups.map((group) => (
              <div key={group.title} className="flex flex-col gap-2">
                <h3 className="px-4 text-[10px] uppercase font-black tracking-[0.2em] text-gray-500 mb-1 hidden xl:block">{group.title}</h3>
                <div className="flex flex-col gap-1 items-center xl:items-stretch">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveModule(item.id as ModuleType);
                        setIsSidebarOpen(false);
                      }}
                      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all group overflow-hidden w-full 
                        ${activeModule === item.id ? 'bg-white/5 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                      title={item.label}
                    >
                      {activeModule === item.id && (
                        <motion.div
                          layoutId="sidebarActive"
                          className="absolute left-0 top-0 w-1 h-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.8)]"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span className={`material-symbols-outlined text-xl transition-colors mx-auto xl:mx-0 ${activeModule === item.id ? 'text-primary' : 'group-hover:text-primary'}`}>{item.icon}</span>
                      <span className="font-bold text-sm tracking-tight hidden xl:block">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Profile & XP (Responsive) */}
          <div className="mt-auto pt-8">
            <div className="glass-card p-2 xl:p-5 rounded-2xl flex flex-col gap-4 border border-white/5">
              <div className="flex items-center gap-4 xl:justify-start justify-center">
                <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center font-black text-xs text-primary ring-1 ring-primary/30 shrink-0">
                  AJ
                </div>
                <div className="flex flex-col hidden xl:flex">
                  <p className="text-sm font-bold text-white">Alex Johnson</p>
                  <p className="text-[10px] font-black opacity-40 uppercase">Diamond League</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 hidden xl:flex">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                  <span className="text-gray-400">Level 12</span>
                  <span className="text-primary">850 / 1000 XP</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '85%' }}
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col h-full min-w-0 transition-all duration-300 relative`}>
        {/* Mobile Bottom Navigation (Visible only on mobile) */}
        <nav className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] backdrop-blur-2xl bg-white/[0.08] rounded-3xl h-16 flex items-center border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] ring-1 ring-white/10 px-2 transition-all duration-300`}>
          {/* Sliding Menu Content Area */}
          <div className="flex-1 h-full overflow-hidden relative">
            <AnimatePresence mode="wait" initial={false}>
              {!showMoreNav ? (
                <motion.div
                  key="primary"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex items-center justify-around"
                >
                  {[
                    { id: 'dashboard', label: 'Home', icon: 'grid_view' },
                    { id: 'vocab', label: 'Vocab', icon: 'style' },
                    { id: 'grammar', label: 'Grammar', icon: 'architecture' },
                    { id: 'kana', label: 'Kana', icon: 'translate' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveModule(item.id as ModuleType);
                        setIsSidebarOpen(false);
                      }}
                      className={`relative flex flex-col items-center justify-center gap-1 transition-all min-w-[60px] ${activeModule === item.id ? 'text-primary' : 'text-gray-400'}`}
                    >
                      <span className={`material-symbols-outlined text-2xl ${activeModule === item.id ? 'fill-current' : ''}`}>
                        {item.icon}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                      {activeModule === item.id && (
                        <motion.div
                          layoutId="mobileNavActive"
                          className="absolute -top-1 size-1 rounded-full bg-primary"
                        />
                      )}
                    </button>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="secondary"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex items-center justify-around"
                >
                  {[
                    { id: 'ai-tutor', label: 'Sensei', icon: 'smart_toy' },
                    { id: 'ui-lab', label: 'Lab', icon: 'science' },
                    { id: 'progress', label: 'Stats', icon: 'auto_graph' },
                    { id: 'settings', label: 'Settings', icon: 'settings' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveModule(item.id as ModuleType);
                        setIsSidebarOpen(false);
                      }}
                      className={`relative flex flex-col items-center justify-center gap-1 transition-all min-w-[60px] ${activeModule === item.id ? 'text-primary' : 'text-gray-400'}`}
                    >
                      <span className={`material-symbols-outlined text-2xl ${activeModule === item.id ? 'fill-current' : ''}`}>
                        {item.icon}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                      {activeModule === item.id && (
                        <motion.div
                          layoutId="mobileNavActive"
                          className="absolute -top-1 size-1 rounded-full bg-primary"
                        />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Persistent Persistent Toggle Button (Always on the right) */}
          <button
            onClick={() => setShowMoreNav(!showMoreNav)}
            className="flex flex-col items-center justify-center gap-1 min-w-[64px] border-l border-white/10"
          >
            <motion.span
              animate={{ rotate: showMoreNav ? 180 : 0 }}
              className={`material-symbols-outlined text-2xl ${showMoreNav ? 'text-primary' : 'text-gray-400'}`}
            >
              east
            </motion.span>
            <span className={`text-[9px] font-black uppercase tracking-tighter ${showMoreNav ? 'text-primary' : 'text-gray-400'}`}>
              {showMoreNav ? 'Back' : 'More'}
            </span>
          </button>
        </nav>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 xl:p-10 pb-32 font-display">
          <AnimatePresence mode="wait">
            {activeModule === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-7xl mx-auto flex flex-col gap-8 pt-10 lg:pt-0"
              >
                {/* Welcome & Streak Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-gray-400 text-sm font-medium uppercase tracking-widest">Dashboard</h2>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                      {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Alex</span>
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Ready to master Japanese today?</p>
                  </div>
                  <div className="flex items-center self-start md:self-end">
                    <div className="glass-card px-5 py-3 rounded-2xl flex items-center gap-3 border-l-4 border-l-orange-500">
                      <div className="p-2 bg-orange-500/20 rounded-full text-orange-400">
                        <span className="material-symbols-outlined fill-current">local_fire_department</span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white leading-none">7 Day</p>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">Study Streak</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1: Study Days */}
                  <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="material-symbols-outlined text-6xl">calendar_today</span>
                    </div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-gray-400 text-sm font-medium">Days Studying</p>
                        <h3 className="text-3xl font-bold text-white mt-1">15<span className="text-base text-gray-500 font-normal"> Days</span></h3>
                      </div>
                      <div className="size-12 rounded-full border-4 border-white/5 flex items-center justify-center relative bg-orange-500/10">
                        <span className="material-symbols-outlined text-orange-400">event_available</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-orange-400 bg-orange-400/10 w-fit px-2 py-1 rounded-lg">
                      <span className="material-symbols-outlined text-base">auto_awesome</span>
                      <span>Level 2 Apprentice</span>
                    </div>
                  </div>

                  {/* Card 2: Vocabulary */}
                  <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="material-symbols-outlined text-6xl">menu_book</span>
                    </div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-gray-400 text-sm font-medium">Vocabulary</p>
                        <h3 className="text-3xl font-bold text-white mt-1">450<span className="text-base text-gray-500 font-normal">/500</span></h3>
                      </div>
                      <CircularProgress value={450} max={500} color="var(--accent)" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 w-fit px-2 py-1 rounded-lg">
                      <span className="material-symbols-outlined text-base">trending_up</span>
                      <span>+15 today</span>
                    </div>
                  </div>
                  {/* Card 3: Grammar */}
                  <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="material-symbols-outlined text-6xl">psychology</span>
                    </div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-gray-400 text-sm font-medium">Grammar</p>
                        <h3 className="text-3xl font-bold text-white mt-1">12<span className="text-base text-gray-500 font-normal">/20</span></h3>
                      </div>
                      <CircularProgress value={12} max={20} color="var(--secondary)" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 w-fit px-2 py-1 rounded-lg">
                      <span className="material-symbols-outlined text-base">trending_up</span>
                      <span>+2 today</span>
                    </div>
                  </div>
                  {/* Card 4: Daily Goal */}
                  <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="material-symbols-outlined text-6xl">timer</span>
                    </div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-gray-400 text-sm font-medium">Daily Goal</p>
                        <h3 className="text-3xl font-bold text-white mt-1">35<span className="text-base text-gray-500 font-normal">/45m</span></h3>
                      </div>
                      <CircularProgress value={35} max={45} color="var(--primary)" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-400/10 w-fit px-2 py-1 rounded-lg">
                      <span className="material-symbols-outlined text-base">timelapse</span>
                      <span>10m left</span>
                    </div>
                  </div>
                </div>

                {/* Study Modules Grid */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded-full"></span>
                    Study Modules
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <button onClick={() => setActiveModule('vocab')} className="glass-card p-6 rounded-2xl flex flex-col items-start gap-4 text-left group hover:bg-white/5 h-64 justify-between border-t-4 border-t-blue-500 transition-all">
                      <div className="size-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <span className="material-symbols-outlined text-3xl">style</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Vocabulary</h3>
                        <p className="text-sm text-gray-400 mt-2 leading-relaxed">Master JLPT N5 words with flashcards.</p>
                      </div>
                      <div className="w-full pt-4 border-t border-white/5 flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Session</span>
                        <span className="material-symbols-outlined text-white group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </button>
                    <button onClick={() => setActiveModule('grammar')} className="glass-card p-6 rounded-2xl flex flex-col items-start gap-4 text-left group hover:bg-white/5 h-64 justify-between border-t-4 border-t-purple-500 transition-all">
                      <div className="size-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                        <span className="material-symbols-outlined text-3xl">history_edu</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">Grammar</h3>
                        <p className="text-sm text-gray-400 mt-2 leading-relaxed">Particles & sentence structure lessons.</p>
                      </div>
                      <div className="w-full pt-4 border-t border-white/5 flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Continue</span>
                        <span className="material-symbols-outlined text-white group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </button>
                    <button onClick={() => setActiveModule('ai-tutor')} className="glass-card p-6 rounded-2xl flex flex-col items-start gap-4 text-left group hover:bg-white/5 h-64 justify-between border-t-4 border-t-pink-500 transition-all">
                      <div className="size-14 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                        <span className="material-symbols-outlined text-3xl">smart_toy</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-pink-400 transition-colors">AI Tutor</h3>
                        <p className="text-sm text-gray-400 mt-2 leading-relaxed">Practice conversation with Sensei AI.</p>
                      </div>
                      <div className="w-full pt-4 border-t border-white/5 flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chat Now</span>
                        <span className="material-symbols-outlined text-white group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </button>
                    <button onClick={() => setActiveModule('kana')} className="glass-card p-6 rounded-2xl flex flex-col items-start gap-4 text-left group hover:bg-white/5 h-64 justify-between border-t-4 border-t-teal-500 transition-all">
                      <div className="size-14 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(20,184,166,0.3)]">
                        <span className="material-symbols-outlined text-3xl">grid_view</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors">Kana Chart</h3>
                        <p className="text-sm text-gray-400 mt-2 leading-relaxed">Hiragana & Katakana reference guide.</p>
                      </div>
                      <div className="w-full pt-4 border-t border-white/5 flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">View Chart</span>
                        <span className="material-symbols-outlined text-white group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity List */}
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-white">Recent Activity</h2>
                    <button className="text-sm text-primary hover:text-white transition-colors">View All</button>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5 group">
                      <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <span className="material-symbols-outlined text-xl">check_circle</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">Completed "Introductions" Lesson</p>
                        <p className="text-xs text-gray-500 font-medium">2 hours ago</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-green-400">+50 XP</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5 group">
                      <div className="size-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0 group-hover:bg-purple-500 group-hover:text-white transition-all">
                        <span className="material-symbols-outlined text-xl">quiz</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">Scored 90% on Grammar Quiz</p>
                        <p className="text-xs text-gray-500 font-medium">Yesterday</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-green-400">+120 XP</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeModule === 'kana' && (
              <motion.div key="kana" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <KanaChart activeTab={kanaTab} onTabChange={setKanaTab} onSelect={handleKanaSelect} />
              </motion.div>
            )}

            {activeModule === 'ui-lab' && (
              <motion.div key="ui-lab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <KanaSandbox />
              </motion.div>
            )}

            {activeModule === 'vocab' && (
              <motion.div key="vocab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <VocabularyStudy
                  vocabList={vocabData}
                  onSelectWriting={(word) => {
                    setSelectedText(word);
                    // 단어장에서는 현재 필터링된 리스트를 전달하여 연속 연습 지원
                    // (VocabularyStudy 내부의 filteredList를 외부로 빼거나, 
                    // 간단히 vocabData 전체를 전달하는 방식으로 구현)
                    setHandwritingItems(vocabData.map(v => ({
                      text: v.kanji || v.furigana,
                      reading: v.furigana || ''
                    })));
                    setIsModalOpen(true);
                  }}
                />
              </motion.div>
            )}

            {activeModule === 'grammar' && (
              <motion.div key="grammar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GrammarLessonView lessons={grammarData} />
              </motion.div>
            )}

            {activeModule === 'ai-tutor' && (
              <motion.div key="ai-tutor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AITutor vocabContext={vocabData} grammarContext={grammarData} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Sticky Bottom Review Alert */}
        <AnimatePresence>
          {activeModule === 'dashboard' && (
            <motion.div
              initial={{ y: 100, x: '-50%', opacity: 0 }}
              animate={{ y: 0, x: '-50%', opacity: 1 }}
              exit={{ y: 100, x: '-50%', opacity: 0 }}
              className="fixed bottom-28 md:bottom-10 left-1/2 z-40 w-[90%] md:w-[600px]"
            >
              <div
                onClick={() => setActiveModule('vocab')}
                className="glass-card backdrop-blur-xl bg-red-500/10 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)] rounded-full px-6 py-3 flex items-center justify-between animate-bounce hover:animate-none cursor-pointer group transition-all hover:bg-red-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                    <span className="material-symbols-outlined text-white text-sm">priority_high</span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Review Needed</p>
                    <p className="text-red-200 text-xs">24 words are ready for SRS review</p>
                  </div>
                </div>
                <button className="bg-white text-red-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors">
                  Review Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {/* Handwriting Modal */}
      {isModalOpen && (
        <HandwritingPractice
          items={handwritingItems}
          initialText={selectedText}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

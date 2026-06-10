import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  HelpCircle, 
  BookMarked, 
  Award, 
  FileText, 
  LayoutDashboard,
  Sparkles,
  Github,
  BookOpen
} from 'lucide-react';
import { StudyStatistics } from './types';
import Dashboard from './components/Dashboard';
import QASection from './components/QASection';
import StudyPlanSection from './components/StudyPlanSection';
import QuizSection from './components/QuizSection';
import RAGSection from './components/RAGSection';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'qa' | 'planner' | 'quiz' | 'rag'>('dashboard');

  const [stats, setStats] = useState<StudyStatistics>({
    quizzesTaken: 0,
    averageScore: 0,
    studyPlansCreated: 0,
    qaQuestionsAsked: 0,
    documentsUploaded: 0
  });

  // Calculate stats on load and on trigger updates
  const updateStats = () => {
    try {
      // 1. Quizzes
      const storedQuizzes = localStorage.getItem('study_companion_quizzes');
      let quizzesTaken = 0;
      let averageScore = 0;
      if (storedQuizzes) {
        const parsed = JSON.parse(storedQuizzes);
        quizzesTaken = parsed.length;
        if (quizzesTaken > 0) {
          const sum = parsed.reduce((acc: number, q: any) => acc + (q.score || 0), 0);
          averageScore = Math.round(sum / quizzesTaken);
        }
      }

      // 2. Study Plans
      const storedPlans = localStorage.getItem('study_companion_plans');
      let studyPlansCreated = 0;
      if (storedPlans) {
        studyPlansCreated = JSON.parse(storedPlans).length;
      }

      // 3. Document Count (from localStorage index or fetched from API, we'll fetch from API or read from state, we can estimate via API call or keep local, let's load a counter)
      const storedDocCount = Number(localStorage.getItem('study_companion_doc_count') || '0');

      // 4. Q&A
      const storedQaAsked = Number(localStorage.getItem('study_companion_qa_asked') || '0');

      setStats({
        quizzesTaken,
        averageScore,
        studyPlansCreated,
        qaQuestionsAsked: storedQaAsked,
        documentsUploaded: storedDocCount
      });
    } catch (err) {
      console.error("Failed to load statistics:", err);
    }
  };

  useEffect(() => {
    updateStats();
  }, [activeTab]);

  const handleIncrementQA = () => {
    const current = Number(localStorage.getItem('study_companion_qa_asked') || '0');
    localStorage.setItem('study_companion_qa_asked', String(current + 1));
    updateStats();
  };

  const handleIncrementPlan = () => {
    // This gets updated in updateStats because studyPlans gets read directly from local storage item!
    updateStats();
  };

  const handleIncrementQuiz = (score: number) => {
    // This gets updated because quizzes list gets read from local storage item!
    updateStats();
  };

  const handleIncrementDocument = () => {
    const current = Number(localStorage.getItem('study_companion_doc_count') || '0');
    localStorage.setItem('study_companion_doc_count', String(current + 1));
    updateStats();
  };

  // Nav configuration
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-indigo-600' },
    { id: 'qa', label: 'Chat AI', icon: HelpCircle, color: 'text-sky-500' },
    { id: 'planner', label: 'Plan Architect', icon: BookMarked, color: 'text-purple-600' },
    { id: 'quiz', label: 'Recall Arena', icon: Award, color: 'text-emerald-500' },
    { id: 'rag', label: 'Course Library', icon: FileText, color: 'text-slate-650' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Dynamic Upper Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-2xl shadow-sm flex items-center justify-center">
              <GraduationCap className="w-6.5 h-6.5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-950 font-display text-lg tracking-tight select-none flex items-center gap-1.5">
                Studya AI <span className="text-[10px] bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full font-bold">SMART ASSISTANT</span>
              </span>
              <p className="text-[10.5px] text-slate-400 font-mono tracking-wider font-semibold">PERSONALIZED EDUCATIONAL COMPANION</p>
            </div>
          </div>

          {/* Nav pills for desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isActive 
                      ? 'bg-white text-slate-950 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? item.color : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Indicator info */}
          <div className="flex items-center gap-2 text-xs font-bold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-display">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span className="text-slate-600">Gemini 3.5 Active</span>
          </div>

        </div>
      </header>

      {/* Main Container Core */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Mobile Navigation sub-rail */}
        <div className="md:hidden mb-6 flex overflow-x-auto gap-1 border border-slate-200/80 p-1 bg-white rounded-2xl">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => setActiveTab(item.id as any)}
                className={`py-2 px-3 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 flex-shrink-0 min-w-[70px] ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 font-extrabold' 
                    : 'text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Tab view routing */}
        <div className="space-y-4">
          {activeTab === 'dashboard' && (
            <Dashboard stats={stats} setActiveTab={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'qa' && (
            <QASection onIncrementQA={handleIncrementQA} />
          )}

          {activeTab === 'planner' && (
            <StudyPlanSection onIncrementPlan={handleIncrementPlan} />
          )}

          {activeTab === 'quiz' && (
            <QuizSection onIncrementQuiz={handleIncrementQuiz} />
          )}

          {activeTab === 'rag' && (
            <RAGSection onIncrementDocument={handleIncrementDocument} />
          )}
        </div>

      </main>

      {/* Professional subtle footer design */}
      <footer className="bg-white border-t border-slate-200/80 px-6 py-6 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4.5 h-4.5 text-indigo-600" />
            <span className="font-semibold text-slate-500">Studya AI Companion incubator</span>
            <span>•</span>
            <span>Empathetic, Personalized Study Assistant</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px]">6 Weeks Curriculum Project</span>
            <span className="hidden sm:inline text-slate-250">|</span>
            <span className="font-mono text-[10px]">Bloom's Taxonomy Level Evaluator</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

import React from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  BookMarked, 
  HelpCircle, 
  Award, 
  FileText, 
  Clock, 
  ArrowRight,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { StudyStatistics } from '../types';

interface DashboardProps {
  stats: StudyStatistics;
  setActiveTab: (tab: 'qa' | 'planner' | 'quiz' | 'rag') => void;
}

export default function Dashboard({ stats, setActiveTab }: DashboardProps) {
  const quickTips = [
    "To learn deeply, paste your course material into the 'Course Library' and ask specific RAG questions.",
    "Quizzes are powered by active recall—take one after reviewing a topic to embed memories.",
    "Draft a personal Study Plan with our generator to divide heavy materials into structured, day-by-day chunks.",
    "Unclear about an equation? Use 'Chat AI' and ask for a visual analogy."
  ];

  const greetingTime = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good morning";
    if (hrs < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-8 md:p-12 text-white shadow-xl border border-slate-700/50">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-200 uppercase tracking-wider">
            <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
            AI Training Companion Launched
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-display text-white leading-tight">
            {greetingTime()}, DIAN!
          </h1>
          <p className="text-slate-300 text-base md:text-lg">
            Welcome to your intelligent learning incubator. Dive into AI-driven interactive tutoring, structured day-by-day roadmaps, smart custom quizzing, and document-grounded deep study systems.
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            <button 
              id="get-started-btn"
              onClick={() => setActiveTab('planner')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-medium shadow-md transition-all flex items-center gap-2 text-sm"
            >
              Architect a Study Plan
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              id="upload-material-btn"
              onClick={() => setActiveTab('rag')}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 text-slate-200 border border-slate-600/50 hover:border-slate-500 rounded-xl font-medium transition-all text-sm"
            >
              Upload Material
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Q&A Queries</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-display">{stats.qaQuestionsAsked}</div>
            <p className="text-xs text-slate-400">Questions discussed</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Study Plans</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <BookMarked className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-display">{stats.studyPlansCreated}</div>
            <p className="text-xs text-slate-400">Personalized schedules</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Active Quizzes</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-display">{stats.quizzesTaken}</div>
            <p className="text-xs text-slate-400">Completed assessments</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Average %</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-display">{stats.averageScore ? `${stats.averageScore}%` : '—'}</div>
            <p className="text-xs text-slate-400">Quiz performance</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 col-span-2 lg:col-span-1 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Library Vault</span>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-display">{stats.documentsUploaded}</div>
            <p className="text-xs text-slate-400">Vector documents</p>
          </div>
        </div>
      </div>

      {/* Main Feature Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 font-display">Specialized Learning Capabilities</h2>
        <div className="grid md:grid-cols-2 gap-6">
          
          <button 
            id="tab-btn-qa"
            onClick={() => setActiveTab('qa')}
            className="group text-left bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all rounded-2xl p-6 flex items-start gap-4 cursor-pointer"
          >
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-950 text-base font-display">Chat AI (Intuitive Q&A)</span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Unlock instant learning support. Gemini answers core concept questions with beautiful layout bullet structures, helpful breakdowns, and step-by-step methodologies.
              </p>
            </div>
          </button>

          <button 
            id="tab-btn-planner"
            onClick={() => setActiveTab('planner')}
            className="group text-left bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all rounded-2xl p-6 flex items-start gap-4 cursor-pointer"
          >
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <BookMarked className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-950 text-base font-display">Study Plan Architect</span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Transform scary learning goals into daily actions. Design structured day-wise lesson plans matched to your exact level, timeline, and daily hours.
              </p>
            </div>
          </button>

          <button 
            id="tab-btn-quiz"
            onClick={() => setActiveTab('quiz')}
            className="group text-left bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all rounded-2xl p-6 flex items-start gap-4 cursor-pointer"
          >
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-950 text-base font-display">Interactive recall Arena</span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Generate tailored multiple-choice evaluations dynamically. Complete the assessments with real-time feedback, grading metrics, and high-fidelity text feedback.
              </p>
            </div>
          </button>

          <button 
            id="tab-btn-rag"
            onClick={() => setActiveTab('rag')}
            className="group text-left bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all rounded-2xl p-6 flex items-start gap-4 cursor-pointer"
          >
            <div className="p-3 bg-slate-100 text-slate-700 rounded-xl group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-950 text-base font-display">RAG Course Library</span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Paste textbook materials or study notes. Query your custom knowledge base directly; see precisely which notes were utilized to synthesize the answers.
              </p>
            </div>
          </button>

        </div>
      </div>

      {/* Quick tips panel */}
      <div className="bg-indigo-50/50 border border-indigo-100/80 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-indigo-950 text-sm uppercase tracking-wider font-display">Cognitive Study Principle</h3>
        </div>
        <p className="text-slate-700 text-sm text-indigo-900 font-medium leading-relaxed">
          💡 {quickTips[Math.floor(Math.random() * quickTips.length)]}
        </p>
      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  BookMarked, 
  Sparkles, 
  Calendar, 
  Clock, 
  User, 
  Layers, 
  CheckCircle2, 
  ListTodo, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  PlusCircle,
  Trash2,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { StudyPlan, StudyPlanDay } from '../types';

interface StudyPlanSectionProps {
  onIncrementPlan: () => void;
}

export default function StudyPlanSection({ onIncrementPlan }: StudyPlanSectionProps) {
  // Input fields
  const [subject, setSubject] = useState('');
  const [goal, setGoal] = useState('');
  const [timelineWeeks, setTimelineWeeks] = useState(2);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [dailyTimeMinutes, setDailyTimeMinutes] = useState(60);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [pastPlans, setPastPlans] = useState<StudyPlan[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [expandedMaterials, setExpandedMaterials] = useState<Record<number, boolean>>({});

  const toggleMaterial = (dayNum: number) => {
    setExpandedMaterials(prev => ({
      ...prev,
      [dayNum]: !prev[dayNum]
    }));
  };

  const parseBoldHtml = (text: string): string => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
    formatted = formatted.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-purple-50 font-mono text-xs text-purple-700 font-semibold">$1</code>');
    return formatted;
  };

  // Reset expanded documents when active study plan updates
  useEffect(() => {
    setExpandedMaterials({});
  }, [activePlan]);

  // Load from local storage
  useEffect(() => {
    try {
      const storedPlans = localStorage.getItem('study_companion_plans');
      if (storedPlans) {
        const parsed = JSON.parse(storedPlans);
        setPastPlans(parsed);
        if (parsed.length > 0) {
          setActivePlan(parsed[0]);
        }
      }

      const storedCompletedTasks = localStorage.getItem('study_companion_completed_tasks');
      if (storedCompletedTasks) {
        setCompletedTasks(JSON.parse(storedCompletedTasks));
      }
    } catch (err) {
      console.error("Failed to load local storage state:", err);
    }
  }, []);

  // Save to local storage when plans update
  const savePlans = (updatedList: StudyPlan[]) => {
    setPastPlans(updatedList);
    localStorage.setItem('study_companion_plans', JSON.stringify(updatedList));
  };

  const handleTaskToggle = (planId: string, dayNum: number, taskIdx: number) => {
    const key = `${planId}_day${dayNum}_task${taskIdx}`;
    const updated = {
      ...completedTasks,
      [key]: !completedTasks[key]
    };
    setCompletedTasks(updated);
    localStorage.setItem('study_companion_completed_tasks', JSON.stringify(updated));
  };

  const calculateProgress = (plan: StudyPlan) => {
    let totalTasksCount = 0;
    let completedCount = 0;

    plan.days.forEach((day) => {
      day.tasks.forEach((_, taskIdx) => {
        totalTasksCount++;
        const key = `${plan.id}_day${day.day}_task${taskIdx}`;
        if (completedTasks[key]) {
          completedCount++;
        }
      });
    });

    if (totalTasksCount === 0) return 0;
    return Math.round((completedCount / totalTasksCount) * 100);
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !goal.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject,
          goal,
          timelineWeeks,
          difficulty,
          dailyTimeMinutes
        })
      });

      if (!response.ok) {
        const errDetails = await response.json();
        throw new Error(errDetails.error || 'Failed to craft personalized plan.');
      }

      const data = await response.json();
      
      const newPlan: StudyPlan = {
        id: `plan_${Date.now()}`,
        subject,
        goal,
        timelineWeeks,
        difficulty,
        dailyTimeMinutes,
        days: data.days || [],
        summary: data.summary || "Custom tailored study itinerary built successfully."
      };

      const updatedPlans = [newPlan, ...pastPlans];
      savePlans(updatedPlans);
      setActivePlan(newPlan);
      onIncrementPlan();
      
      // Clear inputs
      setSubject('');
      setGoal('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connecting to Educational Core Server failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = pastPlans.filter(p => p.id !== id);
    savePlans(updated);
    if (activePlan?.id === id) {
      setActivePlan(updated.length > 0 ? updated[0] : null);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Parameters Generator Input Panel */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-display">Configure Study Plan</h3>
              <p className="text-xs text-slate-400">Provide core learning inputs to generate dynamic roadmap</p>
            </div>
          </div>

          <form onSubmit={handleGeneratePlan} className="space-y-4">
            {/* Subject Input */}
            <div className="space-y-1.5">
              <label htmlFor="subject-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                1. What Subject are you learning?
              </label>
              <input
                id="subject-input"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Organic Chemistry, Quantum Mechanics, React Webapps"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl text-slate-800 text-sm outline-none transition-all placeholder-slate-400 font-medium"
              />
            </div>

            {/* Core Objective/Goal */}
            <div className="space-y-1.5">
              <label htmlFor="goal-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                2. What is your specific milestone / goal?
              </label>
              <textarea
                id="goal-input"
                required
                rows={3}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Master aromatic rings, pass midterm exam next month, write an offline-first task application"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl text-slate-800 text-sm outline-none transition-all placeholder-slate-400 font-medium resize-none"
              />
            </div>

            {/* Numeric Parameters Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="weeks-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Timeline
                </label>
                <div className="relative">
                  <select
                    id="weeks-input"
                    value={timelineWeeks}
                    onChange={(e) => setTimelineWeeks(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl text-slate-800 text-sm outline-none transition-all font-medium appearance-none"
                  >
                    {[1, 2, 3, 4, 6, 8, 12].map(wk => (
                      <option key={wk} value={wk}>{wk} {wk === 1 ? 'Week' : 'Weeks'}</option>
                    ))}
                  </select>
                  <Calendar className="w-4.5 h-4.5 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="time-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Daily Dedication
                </label>
                <div className="relative">
                  <select
                    id="time-input"
                    value={dailyTimeMinutes}
                    onChange={(e) => setDailyTimeMinutes(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl text-slate-800 text-sm outline-none transition-all font-medium appearance-none"
                  >
                    <option value={30}>30 mins/day</option>
                    <option value={60}>1 hour/day</option>
                    <option value={90}>1.5 hours/day</option>
                    <option value={120}>2 hours/day</option>
                    <option value={180}>3 hours/day</option>
                  </select>
                  <Clock className="w-4.5 h-4.5 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Experience Difficulty */}
            <div className="space-y-1.5 pb-2">
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                Target Cognitive Difficulty Level
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                      difficulty === level
                        ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="generate-plan-submit-btn"
              type="submit"
              disabled={loading || !subject.trim() || !goal.trim()}
              className="w-full py-3.5 px-5 bg-purple-600 hover:bg-purple-500 active:scale-98 text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Generating Roadmap...
                </>
              ) : (
                <>
                  <Sparkles className="w-4.5 h-4.5 text-amber-300" />
                  Architect Personalized Plan
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 text-rose-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <p className="text-xs font-medium leading-relaxed">{error}</p>
            </div>
          )}
        </div>

        {/* Saved plans list drawer */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide font-display">Active Study Portfolios</h4>
          
          {pastPlans.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium space-y-1">
              <p>No active roadmap portfolios generated yet.</p>
              <p className="text-slate-300">Produce your first itinerary using parameters above.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {pastPlans.map((p) => {
                const progress = calculateProgress(p);
                const isActive = activePlan?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setActivePlan(p)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                      isActive 
                        ? 'border-purple-500 bg-purple-50/20' 
                        : 'border-slate-150 hover:border-slate-300 bg-slate-50/25'
                    }`}
                  >
                    <div className="space-y-1 flex-1 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm font-display truncate max-w-[150px]">{p.subject}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 border border-slate-250 text-slate-600 rounded-full capitalize font-semibold">{p.timelineWeeks}w</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 italic">{p.goal}</p>
                      
                      {/* Percent progress line */}
                      <div className="flex items-center gap-2 pt-1.5">
                        <div className="flex-1 h-1 bg-slate-200 rounded overflow-hidden">
                          <div 
                            className="bg-purple-600 h-full rounded transition-all duration-300" 
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                        <span className="text-[10px] font-bold text-purple-700">{progress}%</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeletePlan(p.id, e)}
                      className="p-1.5 rounded-lg hover:bg-slate-100/80 hover:text-rose-600 text-slate-400 transition-colors"
                      title="Delete study plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Plan Display Dashboard */}
      <div className="lg:col-span-7">
        {activePlan ? (
          <div className="space-y-6">
            
            {/* Plan Hero Plate */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-3xl p-6 text-white shadow-sm border border-purple-700/50 space-y-3.5 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold tracking-wider text-purple-200 uppercase">
                  <Layers className="w-3.5 h-3.5" />
                  Difficulty: {activePlan.difficulty}
                </div>
                <div className="text-[11px] font-bold text-indigo-200 uppercase tracking-wide">
                  Created {new Date(Number(activePlan.id.split('_')[1])).toLocaleDateString()}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-bold font-display leading-tight">{activePlan.subject}</h3>
                <p className="text-slate-300 text-xs italic font-medium">Goal: "{activePlan.goal}"</p>
              </div>

              <div className="pt-2 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white/5 p-2 rounded-xl">
                  <div className="text-[11px] text-purple-200 font-medium">Timeline</div>
                  <div className="font-bold text-sm text-white">{activePlan.timelineWeeks} Weeks</div>
                </div>
                <div className="bg-white/5 p-2 rounded-xl">
                  <div className="text-[11px] text-purple-200 font-medium">Study Pace</div>
                  <div className="font-bold text-sm text-white">{activePlan.dailyTimeMinutes} Mins/Day</div>
                </div>
                <div className="bg-white/5 p-2 rounded-xl">
                  <div className="text-[11px] text-purple-200 font-medium font-display">Completed</div>
                  <div className="font-bold text-sm text-lime-400">{calculateProgress(activePlan)}%</div>
                </div>
              </div>
            </div>

            {/* AI Summary Interpretation */}
            <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-5 space-y-2">
              <h4 className="text-indigo-950 font-extrabold text-sm font-display flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
                AI Strategy Blueprint Summary
              </h4>
              <p className="text-slate-700 text-xs leading-relaxed font-normal">{activePlan.summary}</p>
            </div>

            {/* Continuous List of Study Days */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-base font-display flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-purple-600" />
                Milestone Curriculums
              </h4>

              <div className="space-y-5">
                {activePlan.days.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No specific milestones proposed inside response vector.</p>
                ) : (
                  activePlan.days.sort((a,b) => a.day - b.day).map((dayData, dayIdx) => {
                    return (
                      <div 
                        key={dayData.day} 
                        className="bg-white border border-slate-180 hover:border-slate-300 rounded-2xl p-5 hover:shadow-md transition-all space-y-4"
                      >
                        {/* Day Title plate */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold flex items-center justify-center text-xs font-mono">
                              D{dayData.day}
                            </span>
                            <div>
                              <h5 className="font-bold text-slate-900 text-sm">{dayData.title}</h5>
                              <p className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">Outcome: {dayData.learningOutcome}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {dayData.durationMinutes} Minutes recommended
                          </div>
                        </div>

                        {/* Topics inside day */}
                        {dayData.topics && dayData.topics.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Theoretical Focus Area</span>
                            <div className="flex flex-wrap gap-1.5">
                              {dayData.topics.map((t, idx) => (
                                <span key={idx} className="text-[11px] px-2 py-0.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-700">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Ringkasan Materi Pembelajaran Hari Ini (Collapsible) */}
                        {dayData.materialContent && (
                          <div className="border border-indigo-150 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-50/10 to-white shadow-sm">
                            <button
                              type="button"
                              onClick={() => toggleMaterial(dayData.day)}
                              className="w-full flex items-center justify-between p-4 text-left font-extrabold text-xs text-indigo-950 bg-indigo-50/30 hover:bg-indigo-50/60 transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-600" />
                                Ringkasan Materi: {dayData.title}
                              </span>
                              <span className="text-[10px] text-indigo-700 font-bold bg-white px-2.5 py-0.5 rounded-full border border-indigo-100 shadow-xs">
                                {expandedMaterials[dayData.day] ? "Sembunyikan" : "Baca Buku Materi 📖"}
                              </span>
                            </button>
                            
                            {expandedMaterials[dayData.day] && (
                              <div className="p-4.5 border-t border-indigo-100 text-slate-700 text-xs leading-relaxed space-y-3 bg-white max-h-[350px] overflow-y-auto font-normal">
                                {dayData.materialContent.split('\n').map((line, mIdx) => {
                                  if (line.trim() === '') return <div key={mIdx} className="h-1" />;
                                  if (line.startsWith('* ') || line.startsWith('- ')) {
                                    return (
                                      <div key={mIdx} className="flex gap-2 pl-2">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                                        <span dangerouslySetInnerHTML={{ __html: parseBoldHtml(line.substring(2)) }} />
                                      </div>
                                    );
                                  }
                                  return <p key={mIdx} dangerouslySetInnerHTML={{ __html: parseBoldHtml(line) }} />;
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Interactive Tasks inside Day with Task Checkbox */}
                        {dayData.tasks && dayData.tasks.length > 0 && (
                          <div className="space-y-2">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Day Exercises (Solve to complete Day)</span>
                            <div className="space-y-1.5">
                              {dayData.tasks.map((task, taskIdx) => {
                                const isChecked = !!completedTasks[`${activePlan.id}_day${dayData.day}_task${taskIdx}`];
                                return (
                                  <label 
                                    key={taskIdx}
                                    className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                                      isChecked 
                                        ? 'bg-emerald-50/35 border-emerald-200 text-slate-500' 
                                        : 'bg-white border-slate-150 hover:bg-slate-50/50'
                                    }`}
                                  >
                                    <input 
                                      type="checkbox"
                                      className="sr-only"
                                      checked={isChecked}
                                      onChange={() => handleTaskToggle(activePlan.id, dayData.day, taskIdx)}
                                    />
                                    <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors mt-0.5 ${
                                      isChecked 
                                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                                        : 'border-slate-300 bg-white group-hover:border-slate-400'
                                    }`}>
                                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                                    </div>
                                    <span className={`text-xs font-normal leading-relaxed ${isChecked ? 'line-through' : 'text-slate-800'}`}>
                                      {task}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Recommended external materials keywords */}
                        {dayData.resources && dayData.resources.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1.5">Materials Blueprint:</span>
                            {dayData.resources.map((res, rIdx) => (
                              <span 
                                key={rIdx} 
                                className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded"
                              >
                                🔍 {res}
                              </span>
                            ))}
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <BookMarked className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="font-bold text-slate-900 text-lg font-display">No Study Program Loaded</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Configure your current class subject, exam timelines, and primary goals on the left panel. Gemini will synthesize a customized day-wise calendar for you.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

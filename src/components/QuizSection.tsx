import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Loader2, 
  AlertCircle,
  FileCheck2,
  Trash2,
  HelpCircle as QuestionIcon
} from 'lucide-react';
import { Quiz, QuizQuestion } from '../types';

interface QuizSectionProps {
  onIncrementQuiz: (score: number) => void;
}

export default function QuizSection({ onIncrementQuiz }: QuizSectionProps) {
  // Input fields for building a quiz
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active quiz states
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  // Score History
  const [quizHistory, setQuizHistory] = useState<Quiz[]>([]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('study_companion_quizzes');
      if (stored) {
        setQuizHistory(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load quiz history:", err);
    }
  }, []);

  const saveHistory = (updated: Quiz[]) => {
    setQuizHistory(updated);
    localStorage.setItem('study_companion_quizzes', JSON.stringify(updated));
  };

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setLoading(true);
    setError(null);
    setActiveQuiz(null);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setQuizAnswers([]);
    setShowExplanation(false);

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          difficulty,
          count: questionCount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assemble interactive exam quiz.');
      }

      const data = await response.json();
      
      const configuredQuiz: Quiz = {
        id: `quiz_${Date.now()}`,
        title: data.title || `${subject} Recall Exam`,
        subject,
        difficulty,
        questions: data.questions || []
      };

      if (configuredQuiz.questions.length === 0) {
        throw new Error("No interactive questions were compiled inside responses.");
      }

      setActiveQuiz(configuredQuiz);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Educational exam core failed to launch.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (optionIdx: number) => {
    if (showExplanation) return; // Answer locked
    setSelectedAnswer(optionIdx);
  };

  const handleConfirmAnswer = () => {
    if (selectedAnswer === null || !activeQuiz) return;
    
    // Add to answers array
    const updatedAnswers = [...quizAnswers, selectedAnswer];
    setQuizAnswers(updatedAnswers);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    
    setSelectedAnswer(null);
    setShowExplanation(false);

    if (currentIdx + 1 < activeQuiz.questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Quiz Finished! Calculate results
      let scoreCount = 0;
      activeQuiz.questions.forEach((q, idx) => {
        if (quizAnswers[idx] === q.correctAnswerIndex) {
          scoreCount++;
        }
      });

      const finalScorePct = Math.round((scoreCount / activeQuiz.questions.length) * 100);
      
      const finishedQuiz: Quiz = {
        ...activeQuiz,
        isCompleted: true,
        score: finalScorePct,
        userAnswers: quizAnswers
      };

      setActiveQuiz(finishedQuiz);
      
      const updatedHistory = [finishedQuiz, ...quizHistory];
      saveHistory(updatedHistory);
      onIncrementQuiz(finalScorePct);
    }
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = quizHistory.filter(q => q.id !== id);
    saveHistory(updated);
  };

  const activeQuestion = activeQuiz?.questions[currentIdx];

  return (
    <div className="grid lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* Parameters Panel */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Award className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-display">Configure Assessment</h3>
              <p className="text-xs text-slate-400">Launch a dynamic recall interactive MCQ generator</p>
            </div>
          </div>

          <form onSubmit={handleGenerateQuiz} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="quiz-subject" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                Topic or Course Material
              </label>
              <input
                id="quiz-subject"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. World War II timeline, Javascript Promisification, Cell Mitosis"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-slate-800 text-sm outline-none transition-all placeholder-slate-400 font-medium font-display"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="quiz-difficulty" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Cognitive Depth
                </label>
                <select
                  id="quiz-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-slate-800 text-sm outline-none transition-all font-medium"
                >
                  <option value="easy">Easy (Recalling Elements)</option>
                  <option value="medium">Medium (Analytical application)</option>
                  <option value="hard">Hard (Conceptual evaluation)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="quiz-count" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Question Size
                </label>
                <select
                  id="quiz-count"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-slate-800 text-sm outline-none transition-all font-medium"
                >
                  <option value={3}>3 questions</option>
                  <option value={5}>5 questions</option>
                  <option value={10}>10 questions</option>
                </select>
              </div>
            </div>

            <button
              id="generate-quiz-btn"
              type="submit"
              disabled={loading || !subject.trim()}
              className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Generating Exam Questions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4.5 h-4.5 text-amber-300" />
                  Launch Interactive Exam
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

        {/* Previous Results Log List */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide font-display">Credential Vault</h4>
          
          {quizHistory.length === 0 ? (
            <p className="text-slate-400 text-xs font-medium py-6 text-center">No credentialed grades compiled yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {quizHistory.map((q) => (
                <div
                  key={q.id}
                  onClick={() => setActiveQuiz(q)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                    activeQuiz?.id === q.id 
                      ? 'border-emerald-500 bg-emerald-50/25' 
                      : 'border-slate-150 hover:border-slate-250 bg-slate-50/15'
                  }`}
                >
                  <div className="space-y-0.5 flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-xs truncate max-w-[150px] font-display">{q.title}</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 select-none uppercase font-semibold">{q.difficulty}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Tested on {new Date(Number(q.id.split('_')[1])).toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-extrabold px-2 py-1 rounded-lg ${
                      (q.score ?? 0) >= 80 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : (q.score ?? 0) >= 50 
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {q.score}%
                    </span>
                    <button
                      onClick={(e) => handleDeleteHistory(q.id, e)}
                      className="p-1 text-slate-450 hover:text-rose-600 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Questionnaire Area */}
      <div className="lg:col-span-8">
        
        {activeQuiz ? (
          activeQuiz.isCompleted ? (
            /* QUIZ SUMMARY CARD DISPLAY */
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8 animate-fade-in text-center">
              <div className="space-y-3">
                <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
                  <FileCheck2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-xl font-display">{activeQuiz.title}</h3>
                  <p className="text-xs text-slate-400">Review detailed recall statistics and explanations below</p>
                </div>
              </div>

              {/* Assessment Grade Plate */}
              <div className="max-w-md mx-auto bg-slate-50 border border-slate-150 rounded-2xl p-6 grid grid-cols-2 gap-4">
                <div className="text-center space-y-1 border-r border-slate-200 pr-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Grade</span>
                  <div className={`text-3xl font-extrabold ${
                    (activeQuiz.score ?? 0) >= 80 ? 'text-emerald-600' : 'text-slate-800'
                  }`}>
                    {activeQuiz.score}%
                  </div>
                </div>
                <div className="text-center space-y-1 pl-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assessment Outcome</span>
                  <div className="text-sm font-bold text-slate-700 mt-1">
                    {(activeQuiz.score ?? 0) >= 80 
                      ? '🏆 DIAN Mastery!' 
                      : (activeQuiz.score ?? 0) >= 60 
                        ? '👍 Review Required' 
                        : '📖 In-Depth Re-Study'}
                  </div>
                </div>
              </div>

              {/* Review individual questions */}
              <div className="text-left space-y-6 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide font-display">Step-by-Step Analytical Log</h4>
                <div className="space-y-5">
                  {activeQuiz.questions.map((q, idx) => {
                    const userAnsIdx = activeQuiz.userAnswers?.[idx];
                    const isCorrect = userAnsIdx === q.correctAnswerIndex;
                    return (
                      <div key={idx} className="bg-slate-50/50 border border-slate-180 rounded-2xl p-5 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <span className="text-[10px] font-extrabold text-indigo-600 font-mono">QUESTION {idx + 1} OF {activeQuiz.questions.length}</span>
                            <h5 className="font-bold text-slate-900 text-sm leading-snug">{q.question}</h5>
                          </div>
                          {isCorrect ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 py-1 px-2.5 rounded-full flex-shrink-0">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Correct Answer
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-100 py-1 px-2.5 rounded-full flex-shrink-0">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              Incorrect Answer
                            </span>
                          )}
                        </div>

                        {/* Options Display with colors */}
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {q.options.map((opt, oIdx) => {
                            const isCorrectOption = oIdx === q.correctAnswerIndex;
                            const isSelected = oIdx === userAnsIdx;
                            return (
                              <div
                                key={oIdx}
                                className={`p-3 rounded-xl border text-xs font-medium leading-relaxed transition-all ${
                                  isCorrectOption
                                    ? 'bg-emerald-50/45 border-emerald-300 text-emerald-950 font-semibold'
                                    : isSelected
                                      ? 'bg-rose-50/40 border-rose-250 text-rose-950'
                                      : 'bg-white border-slate-150 text-slate-600'
                                }`}
                              >
                                <span className="font-mono uppercase text-[9px] px-1.5 py-0.5 rounded bg-slate-150/60 mr-2 text-slate-500">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                {opt}
                              </div>
                            );
                          })}
                        </div>

                        {/* Educational Explanatory panel */}
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-1 text-xs">
                          <span className="block font-bold text-indigo-950 uppercase tracking-widest text-[9px]">Companion Cognitive Analysis</span>
                          <p className="text-slate-600 leading-relaxed font-normal">{q.explanation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center pt-6">
                <button
                  id="retest-quiz-btn"
                  onClick={() => {
                    setActiveQuiz(null);
                    setSubject('');
                  }}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow"
                >
                  <RotateCcw className="w-4 h-4" />
                  Configure Alternative Assessment
                </button>
              </div>

            </div>
          ) : (
            /* ACTIVE EXAM ACTIVE BOARD */
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6.5 animate-fade-in">
              {/* Question Header Status */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider font-mono">CONSECUTIVE EVALUATION</span>
                  <h3 className="font-bold text-slate-800 text-sm truncate max-w-[300px] font-display">{activeQuiz.title}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    QUESTION {currentIdx + 1} OF {activeQuiz.questions.length}
                  </span>
                  <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5 border border-slate-200">
                    <div 
                      className="h-full bg-emerald-500 rounded transition-all duration-300"
                      style={{ width: `${((currentIdx + 1) / activeQuiz.questions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Question Statement Card */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 font-display relative overflow-hidden">
                <div className="absolute right-3 top-3 text-slate-200 pointer-events-none">
                  <QuestionIcon className="w-12 h-12" />
                </div>
                <h4 className="text-slate-900 font-extrabold text-base md:text-lg leading-relaxed max-w-[90%] relative z-10">
                  {activeQuestion?.question}
                </h4>
              </div>

              {/* Options selectors */}
              <div className="space-y-2.5">
                {activeQuestion?.options.map((option, idx) => {
                  const isOptSelected = selectedAnswer === idx;
                  const isCorrect = idx === activeQuestion.correctAnswerIndex;
                  
                  let optionStyles = "border-slate-200 bg-white hover:bg-slate-50/50 text-slate-700 hover:border-slate-350";
                  if (showExplanation) {
                    if (isCorrect) {
                      optionStyles = "border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold";
                    } else if (isOptSelected) {
                      optionStyles = "border-rose-300 bg-rose-50 text-rose-950";
                    } else {
                      optionStyles = "border-slate-150 bg-slate-50/30 text-slate-400 cursor-not-allowed";
                    }
                  } else if (isOptSelected) {
                    optionStyles = "border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold ring-2 ring-emerald-500/25";
                  }

                  return (
                    <button
                      key={idx}
                      id={`quiz-option-${idx}`}
                      onClick={() => handleSelectAnswer(idx)}
                      disabled={showExplanation}
                      className={`w-full text-left p-4 rounded-xl border flex items-start gap-3 transition-all text-sm outline-none group cursor-pointer ${optionStyles}`}
                    >
                      <span className={`w-5.5 h-5.5 rounded-md text-[10px] uppercase font-mono font-bold flex items-center justify-center flex-shrink-0 transition-colors ${
                        isOptSelected 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 mt-0.5 leading-relaxed">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Answer Feedback Explanation block */}
              {showExplanation && activeQuestion && (
                <div className="bg-indigo-50 border border-indigo-150 rounded-2xl p-5 space-y-2 animate-fade-in text-xs">
                  <div className="flex items-center gap-2">
                    {selectedAnswer === activeQuestion.correctAnswerIndex ? (
                      <span className="flex items-center gap-1 font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded text-[9px]">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Correct Recall!
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-bold text-rose-700 uppercase tracking-wider bg-rose-50 border border-rose-150 px-2 py-0.5 rounded text-[9px]">
                        <XCircle className="w-3 h-3 text-rose-600" /> Correct Choice is {String.fromCharCode(65 + activeQuestion.correctAnswerIndex)}
                      </span>
                    )}
                    <span className="font-extrabold text-indigo-950 uppercase tracking-widest text-[9px]">Explanatory Solution</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-normal">{activeQuestion.explanation}</p>
                </div>
              )}

              {/* Questionnaire controls */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                {!showExplanation ? (
                  <button
                    id="confirm-answer-btn"
                    onClick={handleConfirmAnswer}
                    disabled={selectedAnswer === null}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    Confirm Answer Selection
                  </button>
                ) : (
                  <button
                    id="next-question-btn"
                    onClick={handleNextQuestion}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {currentIdx + 1 < activeQuiz.questions.length ? 'Continuous Next Question' : 'Synthesize Grades & Finish'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          )
        ) : (
          /* DEFAULT IDLE STATE */
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Award className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="font-bold text-slate-900 text-lg font-display">No Active Assessment</h4>
              <p className="text-slate-500 text-sm leading-relaxed font-normal">
                Input your current studied subject inside the configuration card on the left. The AI will curate rigorous interactive multiple choice questions designed to optimize cognitive recall.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

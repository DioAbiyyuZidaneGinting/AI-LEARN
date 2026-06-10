/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface StudyPlanDay {
  day: number;
  title: string;
  materialContent?: string;
  topics: string[];
  tasks: string[];
  durationMinutes: number;
  learningOutcome: string;
  resources: string[];
}

export interface StudyPlan {
  id: string;
  subject: string;
  goal: string;
  timelineWeeks: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  dailyTimeMinutes: number;
  days: StudyPlanDay[];
  summary: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  isCompleted?: boolean;
  score?: number;
  userAnswers?: number[];
}

export interface DocumentChunk {
  id: string;
  text: string;
  embedding?: number[];
}

export interface DocumentFile {
  id: string;
  name: string;
  content: string;
  sizeBytes: number;
  uploadedAt: string;
  chunksCount: number;
}

export interface StudyStatistics {
  quizzesTaken: number;
  averageScore: number;
  studyPlansCreated: number;
  qaQuestionsAsked: number;
  documentsUploaded: number;
}

export type BiasCategory = 'gender' | 'age' | 'ethnicity' | 'status';

export type ScenarioType = 'tutorial' | 'exploration';

export interface Scenario {
  id: string;
  type: ScenarioType;
  category: BiasCategory;
  title: string;
  description: string;
  systemPrompt: string;
  isBiased: boolean;
  openingQuestion?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BiasStrengthRatings {
  gender: number;
  age: number;
  ethnicity: number;
  status: number;
}

export interface UserAssessment {
  scenarioId: string;
  isBiased: boolean;
  guessedCategory?: BiasCategory; // For tutorials
  biasStrengthRatings?: BiasStrengthRatings; // For exploration
  confidence: number; // 1-5
  reasoning: string;
  chatHistory: ChatMessage[];
  timestamp: Date;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface StudyResults {
  assessments: UserAssessment[];
  overallAccuracy: number;
  accuracyByCategory: Record<BiasCategory, number>;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
}

export interface GameStats {
  totalPoints: number;
  currentStreak: number;
  badges: Badge[];
  rank: string;
}

export type UnderstandingLevel = 'weak' | 'partial' | 'good' | 'strong';

export interface ConceptPoint {
  label: string;
  question: string;
  hint: string;
  followUp: string; // The "WHY?" follow-up question
  keywords: string[];
  difficulty: number;
}

export interface Monster {
  id: number;
  name: string;
  creature: string;
  emoji: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isBoss: boolean;
  belief: string; // The misconception
  intro: string;
  victoryLine: string;
  idealExplanation: string;
  points: ConceptPoint[];
}

export interface Battle {
  id: string;
  gameTitle: string;
  topic: string;
  difficulty: 'easy' | 'normal' | 'hard';
  isCustom?: boolean;
  monsters: [Monster, Monster, Monster]; // Exactly 3 monsters
  createdAt?: number;
}

export interface EvaluationResult {
  correct: boolean;
  score: number; // 0 - 100
  understanding: UnderstandingLevel;
  feedback: string;
  needsWhy: boolean;
  followUpQuestion: string;
  hint: string;
  damage: number;
  xp: number;
}

export interface AnswerLog {
  monsterIndex: number;
  monsterName: string;
  pointIndex: number;
  conceptLabel: string;
  question: string;
  studentAnswer: string;
  evaluation: EvaluationResult;
  timestamp: number;
  wasWhyChallenge: boolean;
}

export interface BattleResultSummary {
  battleId: string;
  gameTitle: string;
  topic: string;
  monstersDefeated: number; // up to 3
  totalMonsters: number;
  totalQuestions: number;
  correctAnswers: number;
  whyChallengesMet: number;
  totalXpEarned: number;
  masteryPercentage: number;
  conceptsMastered: string[];
  conceptsToReview: string[];
  weakestExplanation: {
    concept: string;
    question: string;
    studentAnswer: string;
    feedback: string;
    ideal: string;
  } | null;
  completedAt: number;
}

export interface PlayerStats {
  xp: number;
  level: number;
  streak: number;
  lastPlayedDate: string; // YYYY-MM-DD
  battlesWon: number;
  monstersDefeated: number;
  bossesDefeated: number;
  whyChallengesConquered: number;
  completedBattleIds: string[];
  history: BattleResultSummary[];
}

export interface AppSettings {
  geminiApiKey: string;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
}

export interface OfflineSubject {
  id: string;
  name: string;
  icon: string;
  description: string;
  battles: Battle[];
}

import { AppSettings, PlayerStats, BattleResultSummary, Battle } from '../types';

const STORAGE_KEYS = {
  API_KEY: 'monsterclass_gemini_key',
  SETTINGS: 'monsterclass_settings',
  PLAYER_STATS: 'monsterclass_player_stats',
  CUSTOM_BATTLES: 'monsterclass_custom_battles',
};

const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  soundEnabled: true,
  animationsEnabled: true,
  difficulty: 'normal',
};

const DEFAULT_PLAYER_STATS: PlayerStats = {
  xp: 0,
  level: 1,
  streak: 1,
  lastPlayedDate: new Date().toISOString().split('T')[0],
  battlesWon: 0,
  monstersDefeated: 0,
  bossesDefeated: 0,
  whyChallengesConquered: 0,
  completedBattleIds: [],
  history: [],
};

export const storage = {
  getApiKey(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  },

  setApiKey(key: string): void {
    if (typeof window === 'undefined') return;
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
    }
  },

  deleteApiKey(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
  },

  getSettings(): AppSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    }
    return updated;
  },

  getPlayerStats(): PlayerStats {
    if (typeof window === 'undefined') return DEFAULT_PLAYER_STATS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYER_STATS);
      if (saved) {
        return { ...DEFAULT_PLAYER_STATS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_PLAYER_STATS;
  },

  savePlayerStats(stats: PlayerStats): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PLAYER_STATS, JSON.stringify(stats));
  },

  addBattleResult(summary: BattleResultSummary): { newLevel: number; leveledUp: boolean } {
    const stats = this.getPlayerStats();
    const today = new Date().toISOString().split('T')[0];

    // Calculate streak
    if (stats.lastPlayedDate !== today) {
      const last = new Date(stats.lastPlayedDate);
      const now = new Date(today);
      const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        stats.streak += 1;
      } else if (diffDays > 1) {
        stats.streak = 1;
      }
      stats.lastPlayedDate = today;
    }

    const previousLevel = stats.level;
    stats.xp += summary.totalXpEarned;
    // Level formula: level = floor(xp / 300) + 1
    stats.level = Math.floor(stats.xp / 300) + 1;
    const leveledUp = stats.level > previousLevel;

    stats.battlesWon += summary.monstersDefeated === 3 ? 1 : 0;
    stats.monstersDefeated += summary.monstersDefeated;
    if (summary.monstersDefeated >= 3) {
      stats.bossesDefeated += 1;
    }
    stats.whyChallengesConquered += summary.whyChallengesMet;

    if (!stats.completedBattleIds.includes(summary.battleId)) {
      stats.completedBattleIds.push(summary.battleId);
    }

    // Keep last 30 battles in history
    stats.history = [summary, ...(stats.history || [])].slice(0, 30);

    this.savePlayerStats(stats);
    return { newLevel: stats.level, leveledUp };
  },

  getCustomBattles(): Battle[] {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_BATTLES);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  },

  saveCustomBattle(battle: Battle): void {
    if (typeof window === 'undefined') return;
    const current = this.getCustomBattles();
    const updated = [battle, ...current.filter((b) => b.id !== battle.id)].slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_BATTLES, JSON.stringify(updated));
  },
};

export function getPlayerTitle(level: number): string {
  if (level >= 20) return 'Archmage of Reason';
  if (level >= 15) return 'Legendary Concept Slayer';
  if (level >= 10) return 'Misconception Tamer';
  if (level >= 7) return 'Reasoning Grandmaster';
  if (level >= 5) return 'Senior Monster Educator';
  if (level >= 4) return 'Concept Hunter';
  if (level >= 2) return 'Apprentice Professor';
  return 'Novice Monster Whisperer';
}

import React from 'react';
import { PlayerStats } from '../types';
import { getPlayerTitle, storage } from '../services/storage';
import { sound } from '../services/sound';
import {
  Trophy,
  Flame,
  Swords,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Calendar,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface ProgressViewProps {
  playerStats: PlayerStats;
  onBack: () => void;
  onRefreshStats: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  playerStats,
  onBack,
  onRefreshStats,
}) => {
  const currentLevelXp = playerStats.xp % 300;
  const xpNeeded = 300;
  const xpPercent = Math.min(100, Math.round((currentLevelXp / xpNeeded) * 100));

  const handleResetProgress = () => {
    if (confirm('Reset your learning progress, XP, and streak? This cannot be undone.')) {
      sound.playClick();
      storage.savePlayerStats({
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
      });
      onRefreshStats();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-purple-500/20 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-bold mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO HOME</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading flex items-center gap-3">
            <span>🏆 MY PROGRESS</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track your concept mastery, monster slaying records, and educational streak.
          </p>
        </div>

        <button
          onClick={handleResetProgress}
          className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Stats</span>
        </button>
      </div>

      {/* Main Profile Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-[#1a1f3a] via-[#141933] to-[#0f1221] border border-purple-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Level Emblem */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex flex-col items-center justify-center shadow-xl shadow-purple-600/30 border-2 border-purple-400/40 shrink-0">
            <span className="text-[10px] uppercase font-black text-purple-200 tracking-wider">
              LEVEL
            </span>
            <span className="text-4xl font-black text-white font-heading leading-none mt-1">
              {playerStats.level}
            </span>
          </div>

          {/* Title & XP Progress */}
          <div className="flex-1 text-center sm:text-left space-y-3 w-full">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-purple-400">
                Current Title
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
                {getPlayerTitle(playerStats.level)}
              </h2>
            </div>

            {/* XP Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                <span>Total XP: {playerStats.xp}</span>
                <span className="font-mono-code text-purple-300">
                  {currentLevelXp} / {xpNeeded} XP to Level {playerStats.level + 1}
                </span>
              </div>
              <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-purple-500/30">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-pink-500 rounded-full transition-all duration-700"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#1a1f3a] border border-purple-500/20 text-center space-y-1">
          <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 mb-2">
            <Swords className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-400 uppercase font-bold block">
            Battles Won
          </span>
          <span className="text-3xl font-black text-white font-heading block">
            {playerStats.battlesWon}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#1a1f3a] border border-purple-500/20 text-center space-y-1">
          <div className="w-10 h-10 mx-auto rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-300 mb-2">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-400 uppercase font-bold block">
            &ldquo;Why?&rdquo; Conquered
          </span>
          <span className="text-3xl font-black text-pink-400 font-heading block">
            {playerStats.whyChallengesConquered}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#1a1f3a] border border-purple-500/20 text-center space-y-1">
          <div className="w-10 h-10 mx-auto rounded-xl bg-red-500/20 flex items-center justify-center text-red-300 mb-2">
            <Trophy className="w-5 h-5" />
          </div>
          <span className="text-xs text-slate-400 uppercase font-bold block">
            Bosses Defeated
          </span>
          <span className="text-3xl font-black text-white font-heading block">
            {playerStats.bossesDefeated}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#1a1f3a] border border-purple-500/20 text-center space-y-1">
          <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 mb-2">
            <Flame className="w-5 h-5 fill-amber-400" />
          </div>
          <span className="text-xs text-slate-400 uppercase font-bold block">
            Study Streak
          </span>
          <span className="text-3xl font-black text-amber-400 font-heading block">
            {playerStats.streak} Days
          </span>
        </div>
      </div>

      {/* Battle History Log */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white font-heading flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          <span>Battle Expedition History</span>
        </h3>

        {playerStats.history && playerStats.history.length > 0 ? (
          <div className="space-y-3">
            {playerStats.history.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#1a1f3a] border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
              >
                <div>
                  <h4 className="font-bold text-white text-base">{item.gameTitle}</h4>
                  <p className="text-xs text-slate-400">
                    {item.topic} • {new Date(item.completedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    {item.masteryPercentage}% Mastery
                  </span>
                  <span className="text-purple-300">
                    +{item.totalXpEarned} XP
                  </span>
                  <span className="text-pink-300">
                    {item.whyChallengesMet} Why Challenges
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-[#1a1f3a]/50 border border-slate-800 text-center text-slate-400 text-sm">
            No completed battles yet. Jump into the Offline Academy or Create a Battle to begin your journey!
          </div>
        )}
      </div>
    </div>
  );
};

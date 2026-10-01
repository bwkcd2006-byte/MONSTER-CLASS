import React from 'react';
import { PlayerStats, AppSettings } from '../types';
import { getPlayerTitle } from '../services/storage';
import { sound } from '../services/sound';
import { Swords, BookOpen, Trophy, Settings as SettingsIcon, Flame, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentView: 'home' | 'create' | 'academy' | 'battle' | 'results' | 'progress';
  onNavigate: (view: 'home' | 'create' | 'academy' | 'progress') => void;
  onOpenSettings: () => void;
  playerStats: PlayerStats;
  settings: AppSettings;
  hasApiKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenSettings,
  playerStats,
  settings,
  hasApiKey,
}) => {
  const currentLevelXp = playerStats.xp % 300;
  const xpNeeded = 300;
  const xpPercentage = Math.min(100, Math.round((currentLevelXp / xpNeeded) * 100));

  const handleNav = (view: 'home' | 'create' | 'academy' | 'progress') => {
    sound.playClick();
    onNavigate(view);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-900/40 bg-[#0f1221]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:shadow-purple-600/50 transition-all border border-purple-400/30">
            <span className="text-xl">🧌</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-300 via-white to-purple-200 bg-clip-text text-transparent font-heading">
                MONSTERCLASS
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                AI RPG
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block tracking-wide">
              Don&apos;t just answer. Teach the monster.
            </p>
          </div>
        </button>

        {/* Center Nav links */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#1a1f3a]/80 p-1 rounded-xl border border-purple-500/20">
          <button
            onClick={() => handleNav('academy')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentView === 'academy'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-300" />
            <span>Offline Academy</span>
          </button>

          <button
            onClick={() => handleNav('create')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentView === 'create'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Swords className="w-4 h-4 text-pink-400" />
            <span>Create Battle</span>
          </button>

          <button
            onClick={() => handleNav('progress')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              currentView === 'progress'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>Progress</span>
          </button>
        </nav>

        {/* Player Stats & Settings */}
        <div className="flex items-center gap-3">
          {/* Level & XP Capsule */}
          <button
            onClick={() => handleNav('progress')}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-[#1a1f3a] hover:bg-[#22294e] border border-purple-500/25 rounded-xl transition-all cursor-pointer text-left"
            title="View Player Stats & Mastery"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-xs text-slate-950 shadow-sm">
              {playerStats.level}
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center justify-between text-[11px] gap-2">
                <span className="font-semibold text-slate-300 truncate max-w-[110px]">
                  {getPlayerTitle(playerStats.level)}
                </span>
                <span className="text-purple-300 font-mono-code font-bold">
                  {currentLevelXp}/{xpNeeded} XP
                </span>
              </div>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-500 rounded-full"
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
            </div>
          </button>

          {/* Streak indicator */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1f3a] border border-amber-500/30 rounded-xl text-amber-400 text-xs font-bold"
            title={`${playerStats.streak} Day Learning Streak`}
          >
            <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
            <span>{playerStats.streak}d</span>
          </div>

          {/* Settings button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="p-2 rounded-xl bg-[#1a1f3a] hover:bg-[#22294e] border border-purple-500/25 text-slate-300 hover:text-white transition-all relative"
            title="Settings & AI Key"
            aria-label="Settings"
          >
            <SettingsIcon className="w-5 h-5" />
            {hasApiKey ? (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0f1221]" />
            ) : (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-[#0f1221]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

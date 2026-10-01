import React from 'react';
import { Battle, PlayerStats } from '../types';
import { sound } from '../services/sound';
import {
  Swords,
  BookOpen,
  Trophy,
  Settings,
  Sparkles,
  ShieldAlert,
  Flame,
  CheckCircle2,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: 'create' | 'academy' | 'progress') => void;
  onOpenSettings: () => void;
  onStartBattle: (battle: Battle) => void;
  playerStats: PlayerStats;
  sampleBattle: Battle;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenSettings,
  onStartBattle,
  playerStats,
  sampleBattle,
}) => {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-b from-[#1a1f3a]/90 via-[#141933]/90 to-[#0f1221] p-8 md:p-14 text-center shadow-2xl shadow-purple-950/50">
        {/* Glow backdrop blobs */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/20 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute top-1/2 right-10 w-64 h-64 bg-pink-600/15 blur-[90px] pointer-events-none rounded-full" />
        <div className="absolute bottom-4 left-10 w-64 h-64 bg-indigo-600/15 blur-[90px] pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-semibold tracking-wide">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Boss Battles • 100% Offline Capable • Built for Engineers</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-heading">
            <span className="bg-gradient-to-r from-purple-200 via-white to-purple-300 bg-clip-text text-transparent">
              MONSTERCLASS
            </span>
          </h1>

          <p className="text-2xl sm:text-3xl font-bold text-amber-300 italic tracking-wide">
            &ldquo;Don&apos;t just answer. Teach the monster.&rdquo;
          </p>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Turn your lecture notes into a high-stakes 3-boss battle. The monster has misconceptions.
            It won&apos;t let you win by keyword matching—it demands to know <span className="text-pink-400 font-bold underline decoration-pink-500 underline-offset-4">WHY</span>.
          </p>

          {/* 4-Step Rule Visualizer */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 text-left">
            <div className="p-3.5 rounded-2xl bg-[#0f1221]/80 border border-purple-500/25 flex flex-col justify-between">
              <span className="text-2xl">📄</span>
              <div>
                <span className="text-xs uppercase font-bold text-purple-400">Step 1</span>
                <p className="font-bold text-sm text-white">Upload Notes</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0f1221]/80 border border-purple-500/25 flex flex-col justify-between">
              <span className="text-2xl">🧌</span>
              <div>
                <span className="text-xs uppercase font-bold text-purple-400">Step 2</span>
                <p className="font-bold text-sm text-white">Fight 3 Monsters</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0f1221]/80 border border-pink-500/30 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-1 right-2 text-[10px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded font-mono-code font-bold">
                CORE
              </div>
              <span className="text-2xl">🧠</span>
              <div>
                <span className="text-xs uppercase font-bold text-pink-400">Step 3</span>
                <p className="font-bold text-sm text-white">Explain WHY</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0f1221]/80 border border-emerald-500/30 flex flex-col justify-between">
              <span className="text-2xl">👑</span>
              <div>
                <span className="text-xs uppercase font-bold text-emerald-400">Step 4</span>
                <p className="font-bold text-sm text-white">Master the Concept</p>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                sound.playClick();
                onNavigate('create');
              }}
              className="flex items-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-lg shadow-xl shadow-purple-600/40 hover:shadow-purple-600/60 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-purple-300/30"
            >
              <Swords className="w-6 h-6 text-pink-300" />
              <span>CREATE BATTLE</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onNavigate('academy');
              }}
              className="flex items-center gap-3 px-7 py-4 rounded-2xl bg-[#1a1f3a] hover:bg-[#232a50] text-slate-100 font-bold text-lg border border-purple-500/30 hover:border-purple-400/50 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
            >
              <BookOpen className="w-6 h-6 text-purple-400" />
              <span>OFFLINE ACADEMY</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onNavigate('progress');
              }}
              className="flex items-center gap-2.5 px-5 py-4 rounded-2xl bg-[#1a1f3a]/80 hover:bg-[#232a50] text-slate-200 font-semibold text-base border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
            >
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span>MY PROGRESS</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenSettings();
              }}
              className="flex items-center gap-2.5 px-5 py-4 rounded-2xl bg-[#1a1f3a]/80 hover:bg-[#232a50] text-slate-200 font-semibold text-base border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
            >
              <Settings className="w-5 h-5 text-slate-300" />
              <span>SETTINGS</span>
            </button>
          </div>
        </div>
      </section>

      {/* Featured Boss Battle Quickstart */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white font-heading flex items-center gap-2">
              <span>Featured Boss Gauntlet</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider font-sans font-semibold">
                Ready to Play
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              No API key required • 3 classic computer science bosses ready to be educated
            </p>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onNavigate('academy');
            }}
            className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
          >
            <span>View All Subjects</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-[#1a1f3a] border border-purple-500/25 shadow-xl hover:border-purple-500/40 transition-all relative overflow-hidden group">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Monster 1 */}
            <div className="p-4 rounded-2xl bg-[#0f1221]/90 border border-slate-700/60 relative">
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                Boss 1 • Easy
              </span>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-3xl animate-creature-bob">🧌</span>
                <div>
                  <h4 className="font-bold text-white text-base">Stack Goblin</h4>
                  <p className="text-xs text-slate-400 italic">
                    &ldquo;Stacks and queues are basically the same thing!&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Monster 2 */}
            <div className="p-4 rounded-2xl bg-[#0f1221]/90 border border-slate-700/60 relative">
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
                Boss 2 • Medium
              </span>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-3xl animate-creature-bob">🟢</span>
                <div>
                  <h4 className="font-bold text-white text-base">Linear Slime</h4>
                  <p className="text-xs text-slate-400 italic">
                    &ldquo;You must check elements one-by-one!&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Monster 3 */}
            <div className="p-4 rounded-2xl bg-[#0f1221]/90 border border-red-500/40 relative glow-red">
              <span className="text-xs uppercase font-extrabold tracking-wider text-red-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-red-400" />
                <span>Final Boss • Hard</span>
              </span>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-3xl animate-creature-bob">🐉</span>
                <div>
                  <h4 className="font-bold text-white text-base">Recursion Dragon</h4>
                  <p className="text-xs text-slate-400 italic">
                    &ldquo;Recursion is just an infinite loop crash!&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-purple-500/20">
            <div>
              <h3 className="font-bold text-lg text-white">
                {sampleBattle.gameTitle}
              </h3>
              <p className="text-xs text-slate-300">
                Teach the Goblin LIFO, prove O(log n) to the Slime, and tame the Recursion Dragon with base cases!
              </p>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onStartBattle(sampleBattle);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Swords className="w-5 h-5" />
              <span>PLAY BATTLE NOW</span>
            </button>
          </div>
        </div>
      </section>

      {/* The MonsterClass Difference */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-[#1a1f3a]/80 border border-purple-500/20 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-300 border border-purple-500/30">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-heading">
            The Monster Demands &ldquo;WHY?&rdquo;
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Unlike shallow quizzes, the monster won&apos;t accept rote keywords. If you say &ldquo;Binary Search is O(log n)&rdquo;, the monster retorts: &ldquo;That&apos;s the answer, but WHY is it logarithmic?&rdquo; You must explain the mechanism.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#1a1f3a]/80 border border-purple-500/20 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-300 border border-pink-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-heading">
            Misconception-Driven Bosses
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Every boss embodies a widespread student fallacy: confusing Stacks with Queues, forgetting base cases, or thinking UDP is pointless. Your task is pedagogy: change the monster&apos;s mind through logic.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#1a1f3a]/80 border border-purple-500/20 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-300 border border-amber-500/30">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-heading">
            Turn Any Notes Into a Boss
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Paste your raw university notes, professor slides, or documentation. Gemini extracts concepts and automatically constructs a personalized 3-boss campaign tailored strictly to your material.
          </p>
        </div>
      </section>
    </div>
  );
};

import React, { useState } from 'react';
import { OfflineSubject, Battle, PlayerStats } from '../types';
import { OFFLINE_SUBJECTS } from '../data/offlineCourses';
import { sound } from '../services/sound';
import { Swords, CheckCircle2, Flame, ArrowLeft, Sparkles, Shield } from 'lucide-react';

interface OfflineAcademyViewProps {
  onStartBattle: (battle: Battle) => void;
  onBack: () => void;
  playerStats: PlayerStats;
}

export const OfflineAcademyView: React.FC<OfflineAcademyViewProps> = ({
  onStartBattle,
  onBack,
  playerStats,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(OFFLINE_SUBJECTS[0].id);

  const selectedSubject =
    OFFLINE_SUBJECTS.find((s) => s.id === selectedSubjectId) || OFFLINE_SUBJECTS[0];

  const handleSelectSubject = (id: string) => {
    sound.playClick();
    setSelectedSubjectId(id);
  };

  const handlePlayBattle = (battle: Battle) => {
    sound.playClick();
    onStartBattle(battle);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-6">
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
            <span>🏰 OFFLINE ACADEMY</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Built-in computer science curriculum. 100% offline, zero API key needed.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>{OFFLINE_SUBJECTS.length} Engineering Courses Active</span>
        </div>
      </div>

      {/* Subject Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
        {OFFLINE_SUBJECTS.map((subject) => {
          const isSelected = subject.id === selectedSubjectId;
          return (
            <button
              key={subject.id}
              onClick={() => handleSelectSubject(subject.id)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/40 scale-102'
                  : 'bg-[#1a1f3a] text-slate-300 border-purple-500/20 hover:bg-[#22294e] hover:text-white'
              }`}
            >
              <span className="text-lg">{subject.icon}</span>
              <span>{subject.name}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Subject Details & Battles List */}
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-[#141933] border border-purple-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedSubject.icon}</span>
              <h2 className="text-2xl font-bold text-white font-heading">
                {selectedSubject.name}
              </h2>
            </div>
            <p className="text-slate-300 text-sm mt-1">{selectedSubject.description}</p>
          </div>

          <div className="text-xs text-slate-400 bg-[#0f1221] px-3 py-1.5 rounded-lg border border-slate-700/50 self-start sm:self-auto">
            {selectedSubject.battles.length} Battle{selectedSubject.battles.length > 1 ? 's' : ''} Available
          </div>
        </div>

        {/* Battles Grid */}
        <div className="grid grid-cols-1 gap-6">
          {selectedSubject.battles.map((battle) => {
            const isCompleted = playerStats.completedBattleIds?.includes(battle.id);
            const m1 = battle.monsters[0];
            const m2 = battle.monsters[1];
            const m3 = battle.monsters[2];

            return (
              <div
                key={battle.id}
                className="p-6 rounded-3xl bg-[#1a1f3a] border border-purple-500/30 hover:border-purple-400/50 shadow-xl transition-all space-y-6 relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white font-heading">
                        {battle.gameTitle}
                      </h3>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>CLEARED</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      3 Sequential Bosses • Must challenge misconceptions & explain WHY to prevail
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs uppercase font-extrabold px-2.5 py-1 rounded-lg border ${
                        battle.difficulty === 'hard'
                          ? 'bg-red-500/20 text-red-300 border-red-500/30'
                          : battle.difficulty === 'normal'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {battle.difficulty} Difficulty
                    </span>
                  </div>
                </div>

                {/* 3 Monsters in this battle */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Monster 1 */}
                  <div className="p-4 rounded-2xl bg-[#0f1221]/90 border border-slate-700/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                          Boss 1 • Easy
                        </span>
                        <span className="text-xs text-slate-400">
                          {m1.points.length} Concepts
                        </span>
                      </div>
                      <div className="flex items-center gap-3 my-2.5">
                        <span className="text-3xl">{m1.emoji}</span>
                        <div>
                          <h4 className="font-bold text-white text-sm">{m1.name}</h4>
                          <span className="text-xs text-purple-300 font-medium">
                            {m1.creature}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 italic bg-[#1a1f3a] p-2 rounded-lg border border-slate-700/40 mt-1">
                      &ldquo;{m1.belief}&rdquo;
                    </p>
                  </div>

                  {/* Monster 2 */}
                  <div className="p-4 rounded-2xl bg-[#0f1221]/90 border border-slate-700/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                          Boss 2 • Medium
                        </span>
                        <span className="text-xs text-slate-400">
                          {m2.points.length} Concepts
                        </span>
                      </div>
                      <div className="flex items-center gap-3 my-2.5">
                        <span className="text-3xl">{m2.emoji}</span>
                        <div>
                          <h4 className="font-bold text-white text-sm">{m2.name}</h4>
                          <span className="text-xs text-purple-300 font-medium">
                            {m2.creature}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 italic bg-[#1a1f3a] p-2 rounded-lg border border-slate-700/40 mt-1">
                      &ldquo;{m2.belief}&rdquo;
                    </p>
                  </div>

                  {/* Monster 3 (Boss) */}
                  <div className="p-4 rounded-2xl bg-[#0f1221]/90 border border-red-500/40 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-red-600/10 blur-xl pointer-events-none rounded-full" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-400 flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-red-400" />
                          <span>Final Boss</span>
                        </span>
                        <span className="text-xs text-red-300 font-semibold">
                          {m3.points.length} Concepts
                        </span>
                      </div>
                      <div className="flex items-center gap-3 my-2.5">
                        <span className="text-3xl">{m3.emoji}</span>
                        <div>
                          <h4 className="font-bold text-white text-sm">{m3.name}</h4>
                          <span className="text-xs text-red-300 font-medium">
                            {m3.creature}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 italic bg-[#1a1f3a] p-2 rounded-lg border border-red-500/20 mt-1">
                      &ldquo;{m3.belief}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handlePlayBattle(battle)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Swords className="w-4 h-4 text-pink-300" />
                    <span>{isCompleted ? 'REMATCH BATTLE' : 'START BATTLE'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

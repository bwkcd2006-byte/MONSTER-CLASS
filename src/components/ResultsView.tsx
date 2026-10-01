import React, { useState } from 'react';
import { BattleResultSummary, Battle } from '../types';
import { sound } from '../services/sound';
import {
  Trophy,
  Swords,
  BookOpen,
  Home,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Flame,
  HelpCircle,
  X,
} from 'lucide-react';

interface ResultsViewProps {
  summary: BattleResultSummary;
  battle: Battle;
  onRematch: () => void;
  onGoHome: () => void;
  onGoAcademy: () => void;
  leveledUp: boolean;
  newLevel: number;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  summary,
  battle,
  onRematch,
  onGoHome,
  onGoAcademy,
  leveledUp,
  newLevel,
}) => {
  const [showReviewModal, setShowReviewModal] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Victory Header */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-purple-900/60 via-[#1a1f3a] to-[#0f1221] border-2 border-purple-500/40 text-center shadow-2xl relative overflow-hidden">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/30 mb-4 animate-bounce">
          🏆
        </div>

        <span className="text-xs uppercase font-extrabold tracking-widest text-purple-300 block mb-1">
          BATTLE CAMPAIGN CONQUERED
        </span>

        <h1 className="text-4xl sm:text-5xl font-black text-white font-heading tracking-tight">
          BATTLE COMPLETE
        </h1>

        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-md mx-auto">
          You taught all 3 monsters with reason and logic. Their misconceptions have fallen!
        </p>

        {leveledUp && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-sm animate-pulse">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span>LEVEL UP! YOU ARE NOW LEVEL {newLevel}</span>
          </div>
        )}
      </div>

      {/* Concept Mastery Bar */}
      <div className="p-6 rounded-2xl bg-[#1a1f3a] border border-purple-500/25 space-y-3">
        <div className="flex justify-between items-center text-sm font-bold">
          <span className="text-slate-300 uppercase tracking-wider text-xs">
            Concept Mastery
          </span>
          <span className="text-emerald-400 font-mono-code text-base">
            {summary.masteryPercentage}%
          </span>
        </div>

        <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-purple-500/30">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-emerald-400 to-teal-400 rounded-full transition-all duration-1000"
            style={{ width: `${summary.masteryPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#1a1f3a] border border-purple-500/20 text-center">
          <span className="text-xs text-slate-400 uppercase font-bold block">
            Monsters Defeated
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white font-heading mt-1 block">
            {summary.monstersDefeated} / {summary.totalMonsters}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#1a1f3a] border border-purple-500/20 text-center">
          <span className="text-xs text-slate-400 uppercase font-bold block">
            Questions
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white font-heading mt-1 block">
            {summary.totalQuestions}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#1a1f3a] border border-purple-500/20 text-center">
          <span className="text-xs text-slate-400 uppercase font-bold block">
            Why Challenges
          </span>
          <span className="text-2xl sm:text-3xl font-black text-pink-400 font-heading mt-1 block">
            {summary.whyChallengesMet}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#1a1f3a] border border-purple-500/20 text-center">
          <span className="text-xs text-slate-400 uppercase font-bold block">
            XP Earned
          </span>
          <span className="text-2xl sm:text-3xl font-black text-yellow-300 font-heading mt-1 block">
            +{summary.totalXpEarned} XP
          </span>
        </div>
      </div>

      {/* Concepts Breakdown */}
      <div className="space-y-4">
        {/* Concepts Mastered */}
        <div className="p-6 rounded-2xl bg-[#1a1f3a] border border-emerald-500/25 space-y-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Concepts You Mastered</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {summary.conceptsMastered.map((concept, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/30"
              >
                ✓ {concept}
              </span>
            ))}
          </div>
        </div>

        {/* Concepts to Review */}
        {summary.conceptsToReview.length > 0 && (
          <div className="p-6 rounded-2xl bg-[#1a1f3a] border border-amber-500/25 space-y-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <span>Concepts You Should Review</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {summary.conceptsToReview.map((concept, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 text-xs font-semibold border border-amber-500/30"
                >
                  ⚡ {concept}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Weakest Explanation */}
        {summary.weakestExplanation && (
          <div className="p-6 rounded-2xl bg-[#1a1f3a] border border-pink-500/30 space-y-3">
            <span className="text-xs uppercase font-extrabold text-pink-400 tracking-wider block">
              Teaching Opportunity: Your Weakest Explanation
            </span>
            <div className="space-y-2">
              <p className="font-bold text-white text-sm">
                Q: {summary.weakestExplanation.question}
              </p>
              <div className="p-3 rounded-xl bg-[#0f1221] border border-slate-700 text-xs text-slate-300">
                <span className="font-bold text-slate-400 block mb-0.5">Your explanation:</span>
                &ldquo;{summary.weakestExplanation.studentAnswer}&rdquo;
              </div>
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200">
                <span className="font-bold text-purple-300 block mb-0.5">Ideal Teaching Explanation:</span>
                {summary.weakestExplanation.ideal}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <button
          onClick={() => {
            sound.playClick();
            onRematch();
          }}
          className="py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 border border-purple-400/30"
        >
          <Swords className="w-4 h-4 text-pink-300" />
          <span>REMATCH BATTLE</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setShowReviewModal(true);
          }}
          className="py-3.5 px-5 rounded-2xl bg-[#1a1f3a] hover:bg-[#22294e] text-slate-200 font-bold text-sm border border-purple-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span>REVIEW CONCEPTS</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onGoHome();
          }}
          className="py-3.5 px-5 rounded-2xl bg-[#1a1f3a] hover:bg-[#22294e] text-slate-200 font-bold text-sm border border-purple-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4 text-slate-400" />
          <span>HOME</span>
        </button>
      </div>

      {/* Review Concepts Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-[#1a1f3a] border border-purple-500/40 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white font-heading">
                  Concept Mastery Guide
                </h3>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 rounded-lg bg-[#0f1221] hover:bg-[#22294e] text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {battle.monsters.map((monster, mIdx) => (
                <div
                  key={monster.id}
                  className="p-5 rounded-2xl bg-[#0f1221] border border-purple-500/25 space-y-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{monster.emoji}</span>
                    <div>
                      <h4 className="font-bold text-white text-base">
                        Boss {mIdx + 1}: {monster.name} ({monster.creature})
                      </h4>
                      <p className="text-xs text-pink-300 italic">
                        Misconception debunked: &ldquo;{monster.belief}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#141933] border border-purple-500/20 text-xs text-slate-300 leading-relaxed">
                    <strong className="text-purple-300 block mb-1">Ideal Explanation:</strong>
                    {monster.idealExplanation}
                  </div>

                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Core Concept Points Taught:
                    </span>
                    {monster.points.map((pt, pIdx) => (
                      <div key={pIdx} className="text-xs text-slate-300 pl-3 border-l-2 border-purple-500/40">
                        <span className="font-bold text-white">{pt.label}:</span> {pt.question}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowReviewModal(false)}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

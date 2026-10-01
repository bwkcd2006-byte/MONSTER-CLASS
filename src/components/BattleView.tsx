import React, { useState, useEffect, useRef } from 'react';
import { Battle, Monster, ConceptPoint, EvaluationResult, AnswerLog, BattleResultSummary } from '../types';
import { geminiService } from '../services/geminiService';
import { sound } from '../services/sound';
import {
  Swords,
  Heart,
  Shield,
  Lightbulb,
  Flame,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  RefreshCw,
  XCircle,
  Zap,
} from 'lucide-react';

interface BattleViewProps {
  battle: Battle;
  onBattleFinished: (summary: BattleResultSummary) => void;
  onExitBattle: () => void;
  hasApiKey: boolean;
}

export const BattleView: React.FC<BattleViewProps> = ({
  battle,
  onBattleFinished,
  onExitBattle,
  hasApiKey,
}) => {
  // Battle state
  const [currentMonsterIndex, setCurrentMonsterIndex] = useState<number>(0);
  const [currentPointIndex, setCurrentPointIndex] = useState<number>(0);

  // Monster & Player stats
  const [monsterMaxHp, setMonsterMaxHp] = useState<number>(100);
  const [monsterHp, setMonsterHp] = useState<number>(100);
  const [playerMaxHp] = useState<number>(100);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [sessionXp, setSessionXp] = useState<number>(0);

  // Interaction state
  const [studentInput, setStudentInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  // The "WHY?" state
  const [isWhyChallengeActive, setIsWhyChallengeActive] = useState<boolean>(false);
  const [currentFollowUpQuestion, setCurrentFollowUpQuestion] = useState<string>('');
  const [previousAnswerForWhy, setPreviousAnswerForWhy] = useState<string>('');

  // Visual Animation States
  const [creatureAnimation, setCreatureAnimation] = useState<'idle' | 'shake' | 'taunt'>('idle');
  const [floatingDamage, setFloatingDamage] = useState<{ id: number; text: string; isCrit: boolean } | null>(null);
  const [isPlayerHeartDamaged, setIsPlayerHeartDamaged] = useState<boolean>(false);
  const [latestFeedback, setLatestFeedback] = useState<{
    text: string;
    type: 'success' | 'partial' | 'danger';
    understanding?: string;
  } | null>(null);

  // Monster Defeated Transition Modal
  const [defeatedMonster, setDefeatedMonster] = useState<Monster | null>(null);

  // Session Logging
  const [answerLogs, setAnswerLogs] = useState<AnswerLog[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentMonster: Monster = battle.monsters[currentMonsterIndex];
  const currentPoint: ConceptPoint = currentMonster.points[currentPointIndex] || currentMonster.points[0];

  // Auto-focus textarea on point change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentPointIndex, currentMonsterIndex, isWhyChallengeActive]);

  // Handle Answer Submission
  const handleAttack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    sound.playClick();

    try {
      const evaluation: EvaluationResult = await geminiService.evaluateAnswer({
        monster: currentMonster,
        point: currentPoint,
        studentAnswer: studentInput.trim(),
        isWhyFollowUp: isWhyChallengeActive,
        previousAnswer: previousAnswerForWhy,
        useOffline: !hasApiKey && !battle.isCustom,
      });

      // Log the answer
      const log: AnswerLog = {
        monsterIndex: currentMonsterIndex,
        monsterName: currentMonster.name,
        pointIndex: currentPointIndex,
        conceptLabel: currentPoint.label,
        question: isWhyChallengeActive ? currentFollowUpQuestion : currentPoint.question,
        studentAnswer: studentInput.trim(),
        evaluation,
        timestamp: Date.now(),
        wasWhyChallenge: isWhyChallengeActive,
      };
      setAnswerLogs((prev) => [...prev, log]);

      // Process Evaluation
      if (evaluation.correct) {
        // SUCCESS: Monster loses HP, Player gains XP, Positive feedback
        sound.playHit();
        sound.playCorrect();

        const damageDealt = evaluation.damage || (currentMonster.isBoss ? 28 : 34);
        const newMonsterHp = Math.max(0, monsterHp - damageDealt);

        // Visual animations
        setCreatureAnimation('shake');
        setFloatingDamage({
          id: Date.now(),
          text: `-${damageDealt}`,
          isCrit: evaluation.understanding === 'strong',
        });
        setTimeout(() => setCreatureAnimation('idle'), 600);

        setMonsterHp(newMonsterHp);
        setSessionXp((prev) => prev + (evaluation.xp || 40));

        setLatestFeedback({
          text: evaluation.feedback || 'Great explanation! You shattered that misconception.',
          type: 'success',
          understanding: evaluation.understanding,
        });

        // Reset WHY state
        setIsWhyChallengeActive(false);
        setCurrentFollowUpQuestion('');
        setPreviousAnswerForWhy('');
        setStudentInput('');
        setShowHint(false);

        // Check if monster is defeated
        if (newMonsterHp <= 0) {
          handleMonsterDefeated(currentMonster);
        } else {
          // Advance to next point or loop point if points exhausted
          const nextPointIdx = currentPointIndex + 1;
          if (nextPointIdx < currentMonster.points.length) {
            setCurrentPointIndex(nextPointIdx);
          } else {
            // All points answered, but monster still has HP -> finish him off with the final blow
            setMonsterHp(0);
            handleMonsterDefeated(currentMonster);
          }
        }
      } else if (evaluation.needsWhy) {
        // PARTIALLY CORRECT: The signature "WHY?" challenge!
        sound.playWhyChallenge();

        // Small scratch damage if score > 40
        if (evaluation.damage > 0) {
          setMonsterHp((prev) => Math.max(10, prev - evaluation.damage));
          setFloatingDamage({
            id: Date.now(),
            text: `-${evaluation.damage}`,
            isCrit: false,
          });
        }

        setIsWhyChallengeActive(true);
        setCurrentFollowUpQuestion(evaluation.followUpQuestion || currentPoint.followUp);
        setPreviousAnswerForWhy(studentInput.trim());

        setLatestFeedback({
          text: evaluation.feedback,
          type: 'partial',
          understanding: evaluation.understanding,
        });

        setStudentInput('');
      } else {
        // INCORRECT: Player loses some HP, Monster taunts
        sound.playPlayerHurt();

        const playerDamage = currentMonster.isBoss ? 20 : 15;
        setPlayerHp((prev) => Math.max(10, prev - playerDamage));

        setCreatureAnimation('taunt');
        setIsPlayerHeartDamaged(true);
        setTimeout(() => setCreatureAnimation('idle'), 700);
        setTimeout(() => setIsPlayerHeartDamaged(false), 700);

        setLatestFeedback({
          text: evaluation.feedback || `That doesn't match the reality of my belief. Remember: ${currentPoint.hint}`,
          type: 'danger',
          understanding: evaluation.understanding,
        });
      }
    } catch (err: unknown) {
      console.error('Attack error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Monster Defeated Trigger
  const handleMonsterDefeated = (monster: Monster) => {
    sound.playVictory();
    setDefeatedMonster(monster);
  };

  // Proceed to next monster or complete battle
  const handleNextMonsterOrFinish = () => {
    sound.playClick();
    setDefeatedMonster(null);
    setLatestFeedback(null);

    const nextMonsterIdx = currentMonsterIndex + 1;
    if (nextMonsterIdx < 3) {
      // Advance to next monster
      setCurrentMonsterIndex(nextMonsterIdx);
      setCurrentPointIndex(0);
      setMonsterHp(100);
      setMonsterMaxHp(100);
      setIsWhyChallengeActive(false);
      setCurrentFollowUpQuestion('');
      setPreviousAnswerForWhy('');
      setStudentInput('');
      setShowHint(false);
    } else {
      // Defeated all 3 monsters -> BATTLE VICTORY!
      finishBattleSummary();
    }
  };

  // Final summary calculation
  const finishBattleSummary = () => {
    const totalQuestions = answerLogs.length;
    const correctCount = answerLogs.filter((log) => log.evaluation.correct).length;
    const whyChallengesMet = answerLogs.filter(
      (log) => log.wasWhyChallenge && log.evaluation.correct
    ).length;

    // Concepts mastered vs to review
    const masteredLabels: string[] = [];
    const reviewLabels: string[] = [];

    // Group logs by conceptLabel
    const pointScores: Record<string, number[]> = {};
    answerLogs.forEach((log) => {
      if (!pointScores[log.conceptLabel]) pointScores[log.conceptLabel] = [];
      pointScores[log.conceptLabel].push(log.evaluation.score);
    });

    Object.entries(pointScores).forEach(([label, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg >= 70) {
        masteredLabels.push(label);
      } else {
        reviewLabels.push(label);
      }
    });

    // Find weakest explanation
    let weakestLog: AnswerLog | null = null;
    let lowestScore = 999;
    for (const log of answerLogs) {
      if (log.evaluation.score < lowestScore) {
        lowestScore = log.evaluation.score;
        weakestLog = log;
      }
    }

    const masteryPercentage =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 85;

    const weakestExplanation = weakestLog
      ? {
          concept: (weakestLog as AnswerLog).conceptLabel,
          question: (weakestLog as AnswerLog).question,
          studentAnswer: (weakestLog as AnswerLog).studentAnswer,
          feedback: (weakestLog as AnswerLog).evaluation.feedback,
          ideal: currentMonster.idealExplanation,
        }
      : null;

    const summary: BattleResultSummary = {
      battleId: battle.id,
      gameTitle: battle.gameTitle,
      topic: battle.topic,
      monstersDefeated: 3,
      totalMonsters: 3,
      totalQuestions,
      correctAnswers: correctCount,
      whyChallengesMet,
      totalXpEarned: sessionXp + 150, // Bonus XP for full completion
      masteryPercentage,
      conceptsMastered: masteredLabels.length > 0 ? masteredLabels : ['Core Definitions'],
      conceptsToReview: reviewLabels,
      weakestExplanation,
      completedAt: Date.now(),
    };

    onBattleFinished(summary);
  };

  // Calculate HP bar percentages
  const monsterHpPercent = Math.max(0, Math.min(100, Math.round((monsterHp / monsterMaxHp) * 100)));
  const playerHpPercent = Math.max(0, Math.min(100, Math.round((playerHp / playerMaxHp) * 100)));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 relative">
      {/* Top Bar: Stage & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#1a1f3a] border border-purple-500/25">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('Flee from battle? Current battle progress will be lost.')) {
                onExitBattle();
              }
            }}
            className="text-xs font-bold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-[#0f1221] border border-slate-700/50 cursor-pointer"
          >
            &larr; FLEE
          </button>

          <div>
            <h2 className="font-extrabold text-white text-base font-heading flex items-center gap-2">
              <span>{battle.gameTitle}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {battle.topic} • Concept {currentPointIndex + 1} of {currentMonster.points.length}
            </p>
          </div>
        </div>

        {/* 3 Monster Stage Nodes */}
        <div className="flex items-center gap-2">
          {battle.monsters.map((m, idx) => {
            const isPast = idx < currentMonsterIndex;
            const isCurrent = idx === currentMonsterIndex;
            return (
              <div
                key={m.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  isPast
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : isCurrent
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/40 scale-105'
                    : 'bg-[#0f1221] text-slate-500 border-slate-800'
                }`}
              >
                <span>{m.emoji}</span>
                <span className="hidden sm:inline">
                  {idx === 0 ? 'Guardian' : idx === 1 ? 'Beast' : 'Boss'}
                </span>
                {isPast && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Battle Arena Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#1a1f3a] to-[#12162b] border border-purple-500/30 shadow-2xl relative overflow-hidden">
        {/* Floating Damage Number */}
        {floatingDamage && (
          <div
            key={floatingDamage.id}
            className={`absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none z-30 font-black font-heading text-4xl animate-float-damage ${
              floatingDamage.isCrit
                ? 'text-yellow-300 drop-shadow-[0_0_12px_rgba(255,209,102,0.8)] scale-125'
                : 'text-red-500 drop-shadow-[0_0_10px_rgba(255,77,109,0.8)]'
            }`}
          >
            {floatingDamage.text}
            {floatingDamage.isCrit && ' CRIT!'}
          </div>
        )}

        {/* Creature Display Area */}
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Boss Stage Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`text-xs uppercase font-extrabold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                currentMonster.isBoss
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 glow-red'
                  : currentMonster.difficulty === 'medium'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {currentMonster.isBoss && <Flame className="w-3.5 h-3.5 fill-red-400" />}
              <span>
                {currentMonster.isBoss
                  ? 'FINAL BOSS • STAGE 3/3'
                  : `MONSTER ${currentMonsterIndex + 1}/3 • ${currentMonster.difficulty.toUpperCase()}`}
              </span>
            </span>
          </div>

          {/* Creature Avatar with dynamic CSS animations */}
          <div className="relative">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-[#0f1221]/90 border border-purple-500/30 flex items-center justify-center shadow-inner relative">
              <span
                className={`text-6xl sm:text-7xl select-none transition-transform duration-300 ${
                  creatureAnimation === 'shake'
                    ? 'animate-creature-shake'
                    : creatureAnimation === 'taunt'
                    ? 'animate-creature-taunt'
                    : 'animate-creature-bob'
                }`}
              >
                {currentMonster.emoji}
              </span>

              {/* Status Ring */}
              <div className="absolute inset-0 rounded-3xl border-2 border-purple-500/20 pointer-events-none" />
            </div>
          </div>

          {/* Monster Name & Creature Type */}
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              {currentMonster.name}
            </h3>
            <p className="text-sm font-semibold text-purple-300">
              {currentMonster.creature}
            </p>
          </div>

          {/* Monster's Core Belief / Misconception */}
          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-[#0f1221]/80 border border-pink-500/30 text-pink-200 text-sm sm:text-base italic shadow-md relative">
            <span className="text-xs uppercase font-extrabold text-pink-400 block not-italic mb-1 tracking-wider">
              Stubborn Monster Belief:
            </span>
            &ldquo;{currentMonster.belief}&rdquo;
          </div>

          {/* Monster HP Bar */}
          <div className="w-full max-w-md space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300">
              <span className="text-red-400 flex items-center gap-1">
                <span>❤️ MONSTER HP</span>
              </span>
              <span className="font-mono-code">
                {monsterHp} / {monsterMaxHp}
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-red-500/30">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-500 rounded-full transition-all duration-500"
                style={{ width: `${monsterHpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Player Vital Stats Bar */}
        <div className="mt-8 pt-4 border-t border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div
              className={`flex items-center gap-1.5 transition-transform ${
                isPlayerHeartDamaged ? 'animate-heart-break text-red-500' : 'text-emerald-400'
              }`}
            >
              <Heart className="w-5 h-5 fill-current" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                PLAYER HP
              </span>
            </div>
            <div className="flex-1 sm:w-36 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-emerald-500/30">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${playerHpPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono-code font-bold text-slate-300">
              {playerHp}/{playerMaxHp}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
            <div className="flex items-center gap-1 text-purple-300">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>+{sessionXp} XP EARNED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge / Question Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#1a1f3a] border border-purple-500/30 shadow-xl space-y-6">
        {/* The "WHY?" follow-up banner */}
        {isWhyChallengeActive ? (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-950/80 via-purple-950/80 to-pink-950/80 border-2 border-pink-500/60 shadow-lg glow-red space-y-2 animate-pulse-glow">
            <div className="flex items-center gap-2 text-pink-400 font-extrabold text-sm uppercase tracking-wider">
              <AlertTriangle className="w-5 h-5 text-pink-400 animate-bounce" />
              <span>THE MONSTER CHALLENGES YOUR REASONING: &ldquo;WHY?&rdquo;</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-white leading-snug">
              {currentFollowUpQuestion || currentPoint.followUp}
            </p>
            <p className="text-xs text-pink-300/80">
              You gave the fact or keyword, but you haven&apos;t taught the monster <em>why</em> it is true. Explain the mechanism!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold tracking-wider text-purple-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>Concept: {currentPoint.label}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowHint(!showHint);
                }}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
              </button>
            </div>

            <h4 className="text-xl sm:text-2xl font-bold text-white leading-snug font-heading">
              {currentPoint.question}
            </h4>

            {showHint && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm">
                <strong>Pedagogical Clue:</strong> {currentPoint.hint}
              </div>
            )}
          </div>
        )}

        {/* Latest Feedback Bubble */}
        {latestFeedback && (
          <div
            className={`p-4 rounded-2xl border text-sm flex items-start gap-3 ${
              latestFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : latestFeedback.type === 'partial'
                ? 'bg-pink-500/10 border-pink-500/30 text-pink-200'
                : 'bg-red-500/10 border-red-500/30 text-red-200'
            }`}
          >
            {latestFeedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : latestFeedback.type === 'partial' ? (
              <Zap className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-extrabold uppercase text-xs tracking-wider block">
                {currentMonster.creature}&apos;s Reaction:
              </span>
              <p className="leading-relaxed">{latestFeedback.text}</p>
            </div>
          </div>
        )}

        {/* Student Answer Form */}
        <form onSubmit={handleAttack} className="space-y-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={4}
              value={studentInput}
              onChange={(e) => setStudentInput(e.target.value)}
              placeholder={
                isWhyChallengeActive
                  ? "Explain WHY this happens... 'Because when the function calls itself, it must have a base case to...'"
                  : "Type your explanation... Teach the monster why their belief is wrong."
              }
              className="w-full p-4 rounded-2xl bg-[#0f1221] border border-purple-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 text-base leading-relaxed resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              💡 Tip: Explain <strong>what</strong> happens and <strong>why</strong> to inflict full damage.
            </p>

            <button
              type="submit"
              disabled={isSubmitting || !studentInput.trim()}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-extrabold text-base transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-lg border ${
                isWhyChallengeActive
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border-pink-400/40 shadow-pink-600/30'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-400/40 shadow-purple-600/30'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>EVALUATING REASONING...</span>
                </>
              ) : isWhyChallengeActive ? (
                <>
                  <Zap className="w-5 h-5 text-yellow-300" />
                  <span>🧠 EXPLAIN WHY</span>
                </>
              ) : (
                <>
                  <Swords className="w-5 h-5 text-pink-300" />
                  <span>⚔️ ATTACK MONSTER</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Monster Defeated Transition Modal */}
      {defeatedMonster && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-8 rounded-3xl bg-[#1a1f3a] border-2 border-emerald-500/50 shadow-2xl text-center space-y-6 animate-scale-in">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-6xl shadow-lg">
              {defeatedMonster.emoji}
            </div>

            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                Boss Defeated!
              </span>
              <h3 className="text-3xl font-extrabold text-white font-heading mt-1">
                {defeatedMonster.name} Enlightened!
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-[#0f1221] border border-emerald-500/30 text-emerald-200 italic text-base">
              &ldquo;{defeatedMonster.victoryLine}&rdquo;
            </div>

            <div className="flex items-center justify-center gap-2 text-sm font-bold text-yellow-300">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span>+100 BONUS VICTORY XP</span>
            </div>

            <button
              onClick={handleNextMonsterOrFinish}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg shadow-xl shadow-emerald-600/40 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>
                {currentMonsterIndex + 1 < 3
                  ? `ADVANCE TO MONSTER ${currentMonsterIndex + 2} OF 3`
                  : 'VIEW BATTLE VICTORY RESULTS'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

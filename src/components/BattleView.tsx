import React, { useState, useEffect, useRef } from 'react';
import { Battle, Monster, ConceptPoint, EvaluationResult, AnswerLog, BattleResultSummary } from '../types';
import { geminiService } from '../services/geminiService';
import { sound } from '../services/sound';
import { CreatureArt } from './CreatureArt';
import {
  Swords,
  Heart,
  Mic,
  MicOff,
  Lightbulb,
  Play,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
  RefreshCw,
  XCircle,
  HelpCircle,
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
  const [monsterMaxHp] = useState<number>(100);
  const [monsterHp, setMonsterHp] = useState<number>(100);
  const [playerMaxHp] = useState<number>(100);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [sessionXp, setSessionXp] = useState<number>(0);

  // Interaction state
  const [studentInput, setStudentInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hintsLeft, setHintsLeft] = useState<number>(2);
  const [activeHint, setActiveHint] = useState<string | null>(null);

  // Speech Recognition state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechLang, setSpeechLang] = useState<string>('en-IN');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Auto-Demo automated boss finish state
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const autoDemoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // The "WHY?" state
  const [isWhyChallengeActive, setIsWhyChallengeActive] = useState<boolean>(false);
  const [currentFollowUpQuestion, setCurrentFollowUpQuestion] = useState<string>('');
  const [previousAnswerForWhy, setPreviousAnswerForWhy] = useState<string>('');

  // Visual Animation States
  const [creatureAnimation, setCreatureAnimation] = useState<'idle' | 'shake' | 'taunt'>('idle');
  const [floatingDamage, setFloatingDamage] = useState<{ id: number; text: string; isCrit: boolean } | null>(null);
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

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Web Speech API handler
  const handleToggleVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = false;
      recognition.interimResults = true;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setStudentInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      sound.playClick();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Toggle Auto-Demo automated boss finish
  const handleToggleAutoDemo = () => {
    sound.playClick();
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      if (autoDemoTimeoutRef.current) {
        clearTimeout(autoDemoTimeoutRef.current);
      }
    } else {
      setIsAutoPlaying(true);
    }
  };

  // Automated Auto-Demo Loop to finish the boss
  useEffect(() => {
    if (!isAutoPlaying) {
      if (autoDemoTimeoutRef.current) {
        clearTimeout(autoDemoTimeoutRef.current);
      }
      return;
    }

    if (defeatedMonster || monsterHp <= 0) {
      setIsAutoPlaying(false);
      return;
    }

    if (isSubmitting) return;

    // Compose ideal response guaranteed to teach the creature and defeat the misconception
    const kw =
      currentPoint.keywords && currentPoint.keywords.length > 0
        ? currentPoint.keywords.join(', ')
        : currentPoint.label;

    const answerToType = isWhyChallengeActive
      ? `Because ${currentPoint.hint || currentPoint.label}, which governs the core computational invariant. When operations take place, this principle ensures the structure operates predictably without ambiguity. Therefore: ${currentMonster.idealExplanation}`
      : `${currentPoint.label} operates under strict principles: ${currentPoint.hint || 'it ensures deterministic and predictable execution'}. Specifically, it relies on ${kw}. ${currentMonster.idealExplanation}`;

    let charIdx = 0;
    setStudentInput('');

    const interval = setInterval(() => {
      charIdx += 4;
      if (charIdx >= answerToType.length) {
        clearInterval(interval);
        setStudentInput(answerToType);

        // Pause briefly after typing so user can read, then attack
        autoDemoTimeoutRef.current = setTimeout(async () => {
          if (!isAutoPlaying) return;
          await handleAttack(undefined, answerToType);
        }, 750);
      } else {
        setStudentInput(answerToType.slice(0, charIdx));
      }
    }, 16);

    return () => {
      clearInterval(interval);
      if (autoDemoTimeoutRef.current) {
        clearTimeout(autoDemoTimeoutRef.current);
      }
    };
  }, [
    isAutoPlaying,
    currentPointIndex,
    currentMonsterIndex,
    isWhyChallengeActive,
    defeatedMonster,
    monsterHp,
    isSubmitting,
  ]);

  // Hint Handler
  const handleUseHint = () => {
    if (hintsLeft <= 0) return;
    sound.playClick();
    setHintsLeft((prev) => Math.max(0, prev - 1));
    setActiveHint(currentPoint.hint || 'Think about the core definitions and how the mechanism operates step by step.');
  };

  // Word count calculator
  const wordCount = studentInput.trim() ? studentInput.trim().split(/\s+/).length : 0;

  // Handle Answer Submission
  const handleAttack = async (e?: React.FormEvent, overrideAnswer?: string) => {
    if (e) e.preventDefault();
    const answerToUse = overrideAnswer !== undefined ? overrideAnswer.trim() : studentInput.trim();
    if (!answerToUse || isSubmitting) return;

    setIsSubmitting(true);
    sound.playClick();
    setActiveHint(null);

    try {
      const evaluation: EvaluationResult = await geminiService.evaluateAnswer({
        monster: currentMonster,
        point: currentPoint,
        studentAnswer: answerToUse,
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
        studentAnswer: answerToUse,
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
        setTimeout(() => setCreatureAnimation('idle'), 700);

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
    setIsAutoPlaying(false);
    if (autoDemoTimeoutRef.current) {
      clearTimeout(autoDemoTimeoutRef.current);
    }
    sound.playVictory();
    setDefeatedMonster(monster);
  };

  // Proceed to next monster or complete battle
  const handleNextMonsterOrFinish = () => {
    setIsAutoPlaying(false);
    if (autoDemoTimeoutRef.current) {
      clearTimeout(autoDemoTimeoutRef.current);
    }
    sound.playClick();
    setDefeatedMonster(null);
    setLatestFeedback(null);
    setActiveHint(null);

    const nextMonsterIdx = currentMonsterIndex + 1;
    if (nextMonsterIdx < 3) {
      // Advance to next monster
      setCurrentMonsterIndex(nextMonsterIdx);
      setCurrentPointIndex(0);
      setMonsterHp(100);
      setHintsLeft(2);
      setIsWhyChallengeActive(false);
      setCurrentFollowUpQuestion('');
      setPreviousAnswerForWhy('');
      setStudentInput('');
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
      totalXpEarned: sessionXp + 150,
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

  // Calculate hearts (3 hearts = >=67 HP, 2 hearts = >=34 HP, 1 heart = >0 HP)
  const heartsCount = playerHp >= 67 ? 3 : playerHp >= 34 ? 2 : playerHp > 0 ? 1 : 0;

  // Build 4 slots for "What the creature must understand"
  const conceptSlots = Array.from({ length: 4 }).map((_, idx) => {
    const point = currentMonster.points[idx];
    const isPast = idx < currentPointIndex;
    const isCurrent = idx === currentPointIndex;
    return {
      index: idx,
      point,
      isPast,
      isCurrent,
    };
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-16 relative">
      {/* Top Bar: Matches Screenshot exactly */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-2">
        {/* Left: Map Button */}
        <button
          onClick={() => {
            sound.playClick();
            if (confirm('Return to map? Battle progress will be saved in your log.')) {
              onExitBattle();
            }
          }}
          className="px-4 py-1.5 rounded-lg bg-[#141938] hover:bg-[#1f2756] border border-[#2b3566] text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 shadow"
        >
          <span>&larr;</span>
          <span>Map</span>
        </button>

        {/* Center: Level & Monster Title */}
        <h2 className="text-base sm:text-lg font-extrabold text-white text-center font-heading tracking-wide">
          Level {currentMonsterIndex + 1}: {currentMonster.name}
        </h2>

        {/* Right: Three Hearts */}
        <div className="flex items-center gap-1.5 text-base sm:text-lg select-none">
          {[1, 2, 3].map((heartIndex) => (
            <span
              key={heartIndex}
              className={`transition-all duration-300 ${
                heartIndex <= heartsCount
                  ? 'text-red-500 scale-100 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : 'text-slate-700 opacity-40 scale-95'
              }`}
            >
              ❤️
            </span>
          ))}
        </div>
      </div>

      {/* Main Upper Section: Two Columns (Monster Card on Left, Checklist on Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Card: Monster Artwork, Health Bar, Misconception Speech Bubble */}
        <div className="rounded-2xl bg-[#0e122b] border border-[#242b58] p-6 flex flex-col justify-between shadow-xl min-h-[360px] relative overflow-hidden">
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

          {/* Creature Artwork */}
          <div className="py-2 flex items-center justify-center">
            <CreatureArt monster={currentMonster} animation={creatureAnimation} />
          </div>

          {/* Name & HP row */}
          <div className="space-y-2 mt-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-white tracking-wide">
                {currentMonster.name}
              </h3>
              <span className="text-sm font-bold text-[#22c55e] font-mono-code">
                {monsterHp} / {monsterMaxHp} HP
              </span>
            </div>

            {/* Neon Green HP Bar */}
            <div className="w-full h-3 bg-[#161c3e] rounded-full overflow-hidden p-0.5 border border-[#242b58]">
              <div
                className="h-full bg-[#22c55e] rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                style={{ width: `${monsterHpPercent}%` }}
              />
            </div>

            {/* Speech Bubble Arrow & Box */}
            <div className="pt-2">
              <div className="w-3.5 h-3.5 bg-[#141938] border-t border-l border-[#273060] rotate-45 mx-auto -mb-2 z-10" />
              <div className="p-4 rounded-xl bg-[#141938] border border-[#273060] text-sm text-slate-200 text-center leading-relaxed shadow-sm">
                &ldquo;{currentMonster.belief}&rdquo;
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: What the creature must understand */}
        <div className="rounded-2xl bg-[#0e122b] border border-[#242b58] p-6 flex flex-col justify-between shadow-xl min-h-[360px] space-y-4">
          <div className="space-y-3.5">
            {/* Header with Scroll Icon */}
            <h3 className="text-base font-extrabold text-[#f6bd60] flex items-center gap-2">
              <span>📜</span>
              <span>What the creature must understand:</span>
            </h3>

            {/* Concept checklist items */}
            <div className="space-y-3">
              {conceptSlots.map((slot) => {
                return (
                  <div
                    key={slot.index}
                    className={`p-3.5 sm:p-4 rounded-xl border flex items-center gap-3 transition-all ${
                      slot.isPast
                        ? 'bg-[#101b33] border-emerald-500/40 text-emerald-300'
                        : slot.isCurrent
                        ? 'bg-[#151c3f] border-purple-500/50 text-white shadow-md shadow-purple-600/10'
                        : 'bg-[#121630] border-[#222952] text-slate-400'
                    }`}
                  >
                    {/* Icon */}
                    <div className="shrink-0 flex items-center justify-center">
                      {slot.isPast ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className="text-red-400 font-bold text-sm">❓</span>
                      )}
                    </div>

                    {/* Content text */}
                    <div className="text-sm font-semibold flex-1">
                      {slot.isPast && slot.point ? (
                        <span className="text-emerald-300">
                          {slot.point.label} (Understood)
                        </span>
                      ) : slot.isCurrent && slot.point ? (
                        <div className="space-y-0.5">
                          <span className="text-white block font-bold">
                            {slot.point.question}
                          </span>
                          <span className="text-[11px] text-purple-300 block">
                            Key concept: {slot.point.label}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 tracking-wider">???</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Hint Popup Banner (if triggered) */}
          {activeHint && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-start gap-2.5 animate-scale-in">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Hint:</strong> {activeHint}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* The "WHY?" follow-up banner (when the monster demands why) */}
      {isWhyChallengeActive && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-950/80 via-purple-950/80 to-pink-950/80 border-2 border-pink-500/60 shadow-lg space-y-2 animate-pulse-glow">
          <div className="flex items-center gap-2 text-pink-400 font-extrabold text-sm uppercase tracking-wider">
            <AlertTriangle className="w-5 h-5 text-pink-400 animate-bounce" />
            <span>THE CREATURE CHALLENGES YOUR REASONING: &ldquo;WHY?&rdquo;</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-white leading-snug">
            {currentFollowUpQuestion || currentPoint.followUp}
          </p>
          <p className="text-xs text-pink-300/80">
            You gave the answer, but the monster doesn&apos;t understand the underlying reason. Explain the mechanism!
          </p>
        </div>
      )}

      {/* Latest Feedback Bubble (if feedback exists) */}
      {latestFeedback && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-start gap-3 animate-scale-in ${
            latestFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : latestFeedback.type === 'partial'
              ? 'bg-pink-500/10 border-pink-500/30 text-pink-200'
              : 'bg-red-500/10 border-red-500/30 text-red-200'
          }`}
        >
          {latestFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : latestFeedback.type === 'partial' ? (
            <Zap className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <span className="font-extrabold uppercase text-xs tracking-wider block">
              {currentMonster.name}&apos;s Reaction:
            </span>
            <p className="leading-relaxed">{latestFeedback.text}</p>
          </div>
        </div>
      )}

      {/* Bottom Card: Large Textarea & Action Controls (Matches Screenshot) */}
      <div className="rounded-2xl bg-[#0e122b] border border-[#242b58] p-5 sm:p-6 shadow-xl space-y-4">
        {/* Active Auto-Demo Banner */}
        {isAutoPlaying && (
          <div className="p-3.5 rounded-xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-between text-xs text-purple-200 animate-pulse">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold">
                ⚡ Auto-Demo Active: Automated AI is teaching and finishing {currentMonster.name}...
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleAutoDemo}
              className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow transition"
            >
              Stop Auto-Demo
            </button>
          </div>
        )}

        {/* Explanation Textarea with word count indicator */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={4}
            value={studentInput}
            onChange={(e) => setStudentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleAttack();
              }
            }}
            placeholder="Explain it to the creature in your own words..."
            className="w-full p-4 pb-8 rounded-xl bg-transparent border border-[#1e254a] text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-500/30 text-sm sm:text-base leading-relaxed resize-none"
          />

          {/* Word count inside the bottom-right corner of the textarea card */}
          <div className="absolute bottom-3 right-4 text-xs text-slate-500 font-mono-code pointer-events-none">
            {wordCount} words
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Left Buttons: Explain!, Speak, Language Dropdown */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Explain! Button */}
            <button
              type="button"
              onClick={() => handleAttack()}
              disabled={isSubmitting || !studentInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/30 transition-all hover:scale-101 active:scale-99 border border-purple-400/30"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4 text-pink-300" />
                  <span>Explain!</span>
                </>
              )}
            </button>

            {/* Speak Button (with Web Speech API) */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                isListening
                  ? 'bg-red-600 text-white border-red-400 animate-pulse'
                  : 'bg-[#141938] hover:bg-[#1c234e] text-slate-200 border-[#2b3566]'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-purple-300" />
                  <span>Speak</span>
                </>
              )}
            </button>

            {/* Language Selector Dropdown */}
            <select
              value={speechLang}
              onChange={(e) => setSpeechLang(e.target.value)}
              className="bg-[#141938] hover:bg-[#1c234e] border border-[#2b3566] text-xs font-semibold text-slate-300 px-3 py-2.5 rounded-xl cursor-pointer focus:outline-none transition"
            >
              <option value="en-IN">English (en-IN)</option>
              <option value="en-US">English (en-US)</option>
              <option value="en-GB">English (en-GB)</option>
              <option value="en-AU">English (en-AU)</option>
            </select>
          </div>

          {/* Right Buttons: Hint, Auto-Demo */}
          <div className="flex items-center gap-2.5 justify-end">
            {/* Hint Button */}
            <button
              type="button"
              onClick={handleUseHint}
              disabled={hintsLeft <= 0}
              className="px-4 py-2.5 rounded-xl bg-[#141938] hover:bg-[#1c234e] disabled:opacity-40 text-slate-200 border border-[#2b3566] text-xs font-semibold flex items-center gap-2 cursor-pointer transition shadow"
            >
              <span className="text-amber-400">💡</span>
              <span>Hint ( {hintsLeft} left)</span>
            </button>

            {/* Auto-Demo Button */}
            <button
              type="button"
              onClick={handleToggleAutoDemo}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition shadow ${
                isAutoPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400 animate-pulse'
                  : 'bg-[#141938] hover:bg-[#1c234e] text-slate-200 border-[#2b3566]'
              }`}
            >
              {isAutoPlaying ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <span>Stop Auto-Demo</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                  <span>Auto-Demo (Finish Boss)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Monster Defeated Transition Modal */}
      {defeatedMonster && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-8 rounded-3xl bg-[#0e122b] border-2 border-emerald-500/50 shadow-2xl text-center space-y-6 animate-scale-in">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-6xl shadow-lg">
              {defeatedMonster.emoji || '🧌'}
            </div>

            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
                Boss Enlightened!
              </span>
              <h3 className="text-3xl font-extrabold text-white font-heading mt-1">
                {defeatedMonster.name} Defeated!
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-[#141938] border border-emerald-500/30 text-emerald-200 italic text-base">
              &ldquo;{defeatedMonster.victoryLine}&rdquo;
            </div>

            <div className="flex items-center justify-center gap-2 text-sm font-bold text-yellow-300">
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

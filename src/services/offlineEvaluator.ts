import { ConceptPoint, Monster, EvaluationResult } from '../types';

export function evaluateOfflineAnswer(
  monster: Monster,
  point: ConceptPoint,
  studentAnswer: string,
  isWhyFollowUp: boolean = false,
  previousAnswer: string = ''
): EvaluationResult {
  const cleanAnswer = studentAnswer.trim().toLowerCase();
  const wordCount = cleanAnswer.split(/\s+/).filter(Boolean).length;

  if (wordCount < 2) {
    return {
      correct: false,
      score: 15,
      understanding: 'weak',
      feedback: `That's much too brief! I am ${monster.creature}. You need to actually explain your reasoning so I can understand!`,
      needsWhy: false,
      followUpQuestion: point.followUp,
      hint: point.hint,
      damage: 0,
      xp: 5,
    };
  }

  // Check matching keywords
  const matchedKeywords = point.keywords.filter((kw) =>
    cleanAnswer.includes(kw.toLowerCase())
  );

  // Check for reasoning / explanatory conjunctions
  const reasoningMarkers = [
    'because',
    'so that',
    'therefore',
    'since',
    'which means',
    'due to',
    'in order to',
    'as a result',
    'instead of',
    'whereas',
    'unlike',
    'why',
    'leads to',
    'ensures',
    'prevents',
    'halves',
    'pops',
    'pushes',
    'removes',
    'adds',
  ];

  const hasReasoningMarker = reasoningMarkers.some((marker) => cleanAnswer.includes(marker));

  // Check overlap with ideal explanation key tokens
  const idealTokens = monster.idealExplanation
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 4);

  const matchedIdealTokens = idealTokens.filter((token) => cleanAnswer.includes(token));

  // Determine quality
  const keywordRatio = point.keywords.length > 0 ? matchedKeywords.length / point.keywords.length : 0;
  const isSurfaceOnly = (matchedKeywords.length >= 1 || matchedIdealTokens.length >= 2) && wordCount < 9 && !hasReasoningMarker;

  // Case 1: Surface keyword dropped without explaining WHY
  if (!isWhyFollowUp && (isSurfaceOnly || (matchedKeywords.length >= 1 && !hasReasoningMarker && wordCount < 14))) {
    return {
      correct: false, // Not fully correct yet, must explain WHY!
      score: 55,
      understanding: 'partial',
      feedback: `You mentioned "${matchedKeywords[0] || 'the concept'}", but that's just the label! I believe: "${monster.belief}". WHY does that actually work?`,
      needsWhy: true,
      followUpQuestion: point.followUp || `That's the result, but WHY? What is the underlying reason?`,
      hint: point.hint,
      damage: 8, // small chip damage for knowing the keyword
      xp: 15,
    };
  }

  // Case 2: In a WHY follow-up round
  if (isWhyFollowUp) {
    const combinedTokens = `${previousAnswer} ${cleanAnswer}`;
    const combinedMatched = point.keywords.filter((kw) => combinedTokens.includes(kw.toLowerCase()));

    if (hasReasoningMarker || wordCount >= 7 || combinedMatched.length >= 1 || matchedIdealTokens.length >= 2) {
      const score = Math.min(100, 78 + matchedKeywords.length * 7 + (hasReasoningMarker ? 10 : 0));
      return {
        correct: true,
        score,
        understanding: score >= 90 ? 'strong' : 'good',
        feedback: `Aha! Now I see the logic! You explained WHY: "${cleanAnswer}". My misconception is crumbling!`,
        needsWhy: false,
        followUpQuestion: '',
        hint: '',
        damage: monster.isBoss ? 28 : 34,
        xp: 45,
      };
    } else {
      return {
        correct: false,
        score: 35,
        understanding: 'weak',
        feedback: `I still don't get the reasoning behind that. Remember: ${point.hint}`,
        needsWhy: true,
        followUpQuestion: point.followUp,
        hint: point.hint,
        damage: 0,
        xp: 10,
      };
    }
  }

  // Case 3: Initial answer is thorough and explains WHY from the start
  if (matchedKeywords.length >= 1 && (hasReasoningMarker || wordCount >= 12 || matchedIdealTokens.length >= 3)) {
    const score = Math.min(100, 82 + matchedKeywords.length * 6 + (hasReasoningMarker ? 10 : 0));
    return {
      correct: true,
      score,
      understanding: score >= 90 ? 'strong' : 'good',
      feedback: `Brilliant explanation! You tackled my belief head-on. "${monster.creature}" is deeply convinced!`,
      needsWhy: false,
      followUpQuestion: '',
      hint: '',
      damage: monster.isBoss ? 25 : 32,
      xp: 40,
    };
  }

  // Case 4: Answer misses core concept
  if (matchedKeywords.length === 0 && matchedIdealTokens.length < 2) {
    return {
      correct: false,
      score: 25,
      understanding: 'weak',
      feedback: `That doesn't quite address my belief: "${monster.belief}". Think about what is happening under the hood!`,
      needsWhy: false,
      followUpQuestion: point.followUp,
      hint: point.hint,
      damage: 0,
      xp: 5,
    };
  }

  // Default partial fallback
  return {
    correct: false,
    score: 50,
    understanding: 'partial',
    feedback: `You are on the right track, but you haven't convinced me yet!`,
    needsWhy: true,
    followUpQuestion: point.followUp,
    hint: point.hint,
    damage: 5,
    xp: 15,
  };
}

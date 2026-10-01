import { Battle, Monster, ConceptPoint } from '../types';

/**
 * Intelligent local note analysis engine that constructs a 3-boss battle
 * directly from raw text when external AI services experience temporary 503 outages.
 */
export function generateLocalBattleFromNotes(
  notes: string,
  topic: string = 'Lecture Notes',
  difficulty: 'easy' | 'normal' | 'hard' = 'normal'
): Battle {
  const cleanNotes = notes.trim();

  // Split into sentences and paragraphs
  const paragraphs = cleanNotes
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const sentences = cleanNotes
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && s.length < 250);

  // Extract key phrases / terminology candidates
  const terms = extractKeyTerms(cleanNotes);

  // Build 3 monsters
  const m1Terms = terms.slice(0, 3);
  const m2Terms = terms.slice(3, 6);
  const m3Terms = terms.slice(6, 10);

  const defaultTopic = topic.trim() || 'Core Lecture Concepts';

  const m1: Monster = {
    id: 1,
    name: `${m1Terms[0] || 'Fundamentals'} Guardian`,
    creature: 'Concept Imp',
    emoji: '🧌',
    difficulty: 'easy',
    isBoss: false,
    belief: `The terms in ${defaultTopic} are all interchangeable and there is no strict definition!`,
    intro: `Hehe! I am the Concept Imp. Convince me that your definitions actually mean anything!`,
    victoryLine: `Urrggh! Clear definitions and core principles... I understand now!`,
    idealExplanation: `In ${defaultTopic}, foundational concepts require precise definitions. ${sentences[0] || cleanNotes.slice(0, 150)}`,
    points: buildPointsFromSentences(
      sentences.slice(0, Math.min(3, sentences.length)),
      m1Terms,
      1
    ),
  };

  const m2: Monster = {
    id: 2,
    name: `${m2Terms[0] || 'Mechanism'} Beast`,
    creature: 'Reasoning Chimera',
    emoji: '🦁',
    difficulty: 'medium',
    isBoss: false,
    belief: `You only need to know the name of the concept, knowing HOW or WHY it works is completely useless!`,
    intro: `ROAR! I am the Reasoning Chimera. You might know the labels, but you can never explain WHY!`,
    victoryLine: `The mechanisms connect... the logic is sound! My reasoning is enlightened!`,
    idealExplanation: `Beyond surface terms, mechanisms explain why concepts work: ${sentences[Math.floor(sentences.length / 2)] || cleanNotes.slice(0, 200)}`,
    points: buildPointsFromSentences(
      sentences.slice(3, Math.min(6, sentences.length)),
      m2Terms.length > 0 ? m2Terms : m1Terms,
      2
    ),
  };

  const m3: Monster = {
    id: 3,
    name: `${m3Terms[0] || defaultTopic} Overlord`,
    creature: 'Mastery Dragon',
    emoji: '🐉',
    difficulty: 'hard',
    isBoss: true,
    belief: `Edge cases and real-world constraints don't matter, simple assumptions always hold true!`,
    intro: `I am the Final Boss of ${defaultTopic}. Only someone who can dismantle subtle misconceptions can defeat me!`,
    victoryLine: `Incredible! You didn't just answer—you taught me WHY. The mastery is yours!`,
    idealExplanation: `Mastery requires applying concepts to complex scenarios and edge cases. ${sentences[sentences.length - 1] || cleanNotes.slice(0, 250)}`,
    points: buildPointsFromSentences(
      sentences.slice(6, Math.min(10, sentences.length)),
      m3Terms.length > 0 ? m3Terms : terms.slice(0, 4),
      3
    ),
  };

  return {
    id: `local-battle-${Date.now()}`,
    gameTitle: `${defaultTopic} Boss Gauntlet`,
    topic: defaultTopic,
    difficulty,
    isCustom: true,
    monsters: [m1, m2, m3],
    createdAt: Date.now(),
  };
}

function extractKeyTerms(text: string): string[] {
  // Find capitalized terms or quoted words
  const matches = text.match(/\b[A-Z][a-zA-Z0-9_-]{2,}\b/g) || [];
  const frequency: Record<string, number> = {};
  const stopWords = new Set([
    'The', 'This', 'That', 'These', 'Those', 'With', 'From', 'When',
    'Where', 'What', 'Which', 'Then', 'There', 'They', 'Some', 'Many',
    'Also', 'Each', 'Every', 'Other', 'Such', 'Both', 'Only', 'Over'
  ]);

  matches.forEach((word) => {
    if (!stopWords.has(word)) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });

  const sorted = Object.keys(frequency).sort((a, b) => frequency[b] - frequency[a]);
  if (sorted.length >= 6) return sorted;

  // Fallback to top noun-like words
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4);

  const wordFreq: Record<string, number> = {};
  words.forEach((w) => {
    wordFreq[w] = (wordFreq[w] || 0) + 1;
  });

  const fallback = Object.keys(wordFreq).sort((a, b) => wordFreq[b] - wordFreq[a]);
  return Array.from(new Set([...sorted, ...fallback])).slice(0, 10);
}

function buildPointsFromSentences(
  sentencesList: string[],
  terms: string[],
  difficulty: number
): ConceptPoint[] {
  if (sentencesList.length === 0) {
    return [
      {
        label: `${terms[0] || 'Core'} Principle`,
        question: `Explain the fundamental concept of ${terms[0] || 'the topic'} based on the lecture material.`,
        hint: `Think about how ${terms[0] || 'this concept'} is defined and what purpose it serves.`,
        followUp: `That states what it is, but WHY does it operate that way under the hood?`,
        keywords: terms.slice(0, 3).map((t) => t.toLowerCase()),
        difficulty,
      },
    ];
  }

  return sentencesList.map((sentence, idx) => {
    const term = terms[idx % terms.length] || `Concept ${idx + 1}`;
    return {
      label: `${term} Mechanism`,
      question: `According to the lecture notes: "${sentence.slice(0, 100)}..." How does this principle work?`,
      hint: `Recall the relationship between the key components mentioned in the lecture.`,
      followUp: `You explained the general idea, but WHY is this condition or rule strictly necessary?`,
      keywords: [
        term.toLowerCase(),
        ...sentence
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 4)
          .slice(0, 3),
      ],
      difficulty,
    };
  });
}

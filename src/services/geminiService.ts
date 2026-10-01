import { Battle, EvaluationResult, Monster, ConceptPoint } from '../types';
import { storage } from './storage';
import { evaluateOfflineAnswer } from './offlineEvaluator';

export const geminiService = {
  async testApiKey(customKey?: string): Promise<{ ok: boolean; message: string }> {
    const key = customKey !== undefined ? customKey : storage.getApiKey();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (key.trim()) {
      headers['x-gemini-api-key'] = key.trim();
    }

    try {
      const res = await fetch('/api/gemini/test-key', {
        method: 'POST',
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        return { ok: false, message: data.error || 'Failed to connect with Gemini API.' };
      }
      return { ok: true, message: data.message || 'Gemini API connection successful!' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, message: `Network error connecting to Gemini service: ${msg}` };
    }
  },

  async generateBattleFromNotes(
    notes: string,
    topic: string,
    difficulty: 'easy' | 'normal' | 'hard'
  ): Promise<Battle> {
    const key = storage.getApiKey();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (key.trim()) {
      headers['x-gemini-api-key'] = key.trim();
    }

    const res = await fetch('/api/gemini/generate-battle', {
      method: 'POST',
      headers,
      body: JSON.stringify({ notes, topic, difficulty }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Battle generation failed (${res.status})`);
    }

    const data = await res.json();
    const battle: Battle = {
      id: `custom-${Date.now()}`,
      gameTitle: data.gameTitle || `${topic} Boss Battle`,
      topic: topic || 'Custom Lecture Notes',
      difficulty,
      isCustom: true,
      monsters: data.monsters as [Monster, Monster, Monster],
      createdAt: Date.now(),
    };

    return battle;
  },

  async extractPdf(
    base64: string,
    filename?: string
  ): Promise<{ text: string; numpages: number; filename: string }> {
    const res = await fetch('/api/extract-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64, filename }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to extract text from PDF.');
    }
    return data;
  },

  async extractUrl(
    url: string
  ): Promise<{ text: string; title: string; url: string; isPdf?: boolean; numpages?: number }> {
    const res = await fetch('/api/extract-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch content from URL.');
    }
    return data;
  },

  async evaluateAnswer(params: {
    monster: Monster;
    point: ConceptPoint;
    studentAnswer: string;
    isWhyFollowUp?: boolean;
    previousAnswer?: string;
    notes?: string;
    useOffline?: boolean;
  }): Promise<EvaluationResult> {
    const { monster, point, studentAnswer, isWhyFollowUp = false, previousAnswer = '', notes = '', useOffline = false } = params;

    // If offline mode requested or no API key and offline mode is fallback
    if (useOffline) {
      return evaluateOfflineAnswer(monster, point, studentAnswer, isWhyFollowUp, previousAnswer);
    }

    const key = storage.getApiKey();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (key.trim()) {
      headers['x-gemini-api-key'] = key.trim();
    }

    try {
      const res = await fetch('/api/gemini/evaluate-answer', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          monster,
          point,
          studentAnswer,
          isWhyFollowUp,
          previousAnswer,
          notes,
        }),
      });

      if (!res.ok) {
        // Fallback to offline evaluator gracefully
        console.warn('Backend evaluation failed, falling back to offline evaluator');
        return evaluateOfflineAnswer(monster, point, studentAnswer, isWhyFollowUp, previousAnswer);
      }

      const data = await res.json();
      return data as EvaluationResult;
    } catch (err) {
      console.warn('Network error in evaluateAnswer, falling back to offline evaluator:', err);
      return evaluateOfflineAnswer(monster, point, studentAnswer, isWhyFollowUp, previousAnswer);
    }
  },
};

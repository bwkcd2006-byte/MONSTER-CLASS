import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { generateLocalBattleFromNotes } from './src/services/localBattleGenerator';
import { evaluateOfflineAnswer } from './src/services/offlineEvaluator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get GoogleGenAI client with user-supplied key or env key
function getGenAIClient(req: Request): GoogleGenAI | null {
  const clientKey = req.headers['x-gemini-api-key'] as string | undefined;
  const apiKey = (clientKey && clientKey.trim()) || process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    return null;
  }

  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Resilient Gemini runner with automatic retry on 503/429 and fallback cascade across flash models
async function generateContentWithFallback(
  ai: GoogleGenAI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any,
  models: string[] = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite']
) {
  let lastError: unknown = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await ai.models.generateContent({
          ...params,
          model,
        });
        return { response: res, usedModel: model };
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isTemporary =
          msg.includes('503') ||
          msg.includes('high demand') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('429');

        if (isTemporary && attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        console.warn(`Gemini model ${model} attempt ${attempt} failed (${msg}). Trying fallback cascade...`);
        break;
      }
    }
  }

  throw lastError;
}

// 1. Test API Key Endpoint
app.post('/api/gemini/test-key', async (req: Request, res: Response) => {
  try {
    const ai = getGenAIClient(req);
    if (!ai) {
      return res.status(400).json({
        ok: false,
        error: 'No Gemini API key provided. Enter your API key in Settings or configure GEMINI_API_KEY.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Ping: Respond with {"status":"ok","msg":"MonsterClass AI is active"} in JSON.',
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    return res.json({
      ok: true,
      message: 'Gemini API key is valid and connected!',
      response: JSON.parse(text),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({
      ok: false,
      error: `Gemini API test failed: ${message}`,
    });
  }
});

// Extract PDF endpoint
app.post('/api/extract-pdf', async (req: Request, res: Response) => {
  try {
    const { base64, filename } = req.body;
    if (!base64) {
      return res.status(400).json({ error: 'No PDF data provided.' });
    }

    // Strip data URL header if present
    const base64Data = base64.replace(/^data:application\/pdf;base64,/, '').replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Run pdf-parse
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const parsed = await parser.getText();
    const numpages = parsed.total || parsed.pages?.length || 1;
    await parser.destroy().catch(() => {});

    const rawText = parsed.text || '';
    // Clean up excessive whitespace but preserve paragraphs
    const cleanText = rawText
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!cleanText || cleanText.length < 15) {
      return res.status(400).json({
        error: 'Could not extract readable text from this PDF. It may contain scanned images or be password-protected.',
      });
    }

    return res.json({
      ok: true,
      text: cleanText,
      numpages,
      filename: filename || 'lecture.pdf',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('PDF parsing error:', message);
    return res.status(500).json({
      error: `Failed to extract PDF: ${message}`,
    });
  }
});

// Extract URL endpoint
app.post('/api/extract-url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required.' });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.trim());
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Only HTTP and HTTPS URLs are supported.');
      }
    } catch {
      return res.status(400).json({ error: 'Please enter a valid HTTP or HTTPS URL.' });
    }

    // Fetch the URL
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,text/plain;q=0.8,*/*;q=0.7',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(400).json({
        error: `Failed to fetch URL (${response.status}: ${response.statusText}). Make sure the URL is publicly accessible.`,
      });
    }

    const contentType = response.headers.get('content-type') || '';

    // If PDF
    if (contentType.includes('application/pdf') || parsedUrl.pathname.endsWith('.pdf')) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const parsed = await parser.getText();
      const numpages = parsed.total || parsed.pages?.length || 1;
      await parser.destroy().catch(() => {});

      const cleanText = (parsed.text || '')
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const filename = path.basename(parsedUrl.pathname) || 'lecture.pdf';
      return res.json({
        ok: true,
        title: filename.replace(/\.pdf$/i, ''),
        text: cleanText,
        url: parsedUrl.toString(),
        isPdf: true,
        numpages,
      });
    }

    // HTML or Text
    const rawHtml = await response.text();

    // Extract title
    const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;

    // Clean HTML
    let cleaned = rawHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(h[1-6])[^>]*>(.*?)<\/\1>/gi, '\n\n# $2\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '\n• $1')
      .replace(/<(?:p|div|br|tr)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    cleaned = cleaned
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&mdash;/gi, '—')
      .replace(/&ndash;/gi, '–');

    // Clean lines
    const lines = cleaned
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const extractedText = lines.join('\n\n').slice(0, 30000); // limit to reasonable size

    if (!extractedText || extractedText.length < 30) {
      return res.status(400).json({
        error: 'Unable to extract readable lecture notes from this webpage. It may require JavaScript rendering or login credentials.',
      });
    }

    return res.json({
      ok: true,
      title: title.replace(/\s+/g, ' ').slice(0, 100),
      text: extractedText,
      url: parsedUrl.toString(),
      isPdf: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('URL extraction error:', message);
    return res.status(500).json({
      error: `Failed to read URL: ${message}`,
    });
  }
});

// 2. Generate Battle from Lecture Notes
app.post('/api/gemini/generate-battle', async (req: Request, res: Response) => {
  try {
    const { notes, topic, difficulty = 'normal' } = req.body;

    if (!notes || notes.trim().length < 20) {
      return res.status(400).json({
        error: 'Lecture notes are too brief. Please paste at least 2-3 sentences of lecture notes.',
      });
    }

    const ai = getGenAIClient(req);
    if (!ai) {
      return res.status(400).json({
        error: 'No Gemini API key configured. Please enter your API key in Settings or use Offline Academy.',
      });
    }

    const systemInstruction = `
You are the master game designer and pedagogue for MONSTERCLASS: "Don't just answer. Teach the monster."
Your goal: Convert the student's submitted lecture notes into an epic 3-boss learning battle.

CRITICAL RULES:
1. ONLY generate questions and concepts based on the submitted notes. DO NOT hallucinate concepts outside these notes.
2. Generate EXACTLY 3 monsters with increasing difficulty:
   - Monster 1: Easy / Concept Guardian. Fundamental definitions and basic relationships.
   - Monster 2: Medium / Reasoning Beast. Reasoning, mechanism, comparison, application, and "why" questions.
   - Monster 3: Hard / Final Boss. Complex scenarios, edge cases, deep mechanisms, and subtle misconceptions. Must feel noticeably harder!
3. Every monster MUST have a stubborn, humorous BELIEF or MISCONCEPTION that directly contradicts the truth in the notes (e.g. "Recursion is just an infinite loop that crashes programs!").
4. Every point MUST have:
   - label: short concept name (e.g. "LIFO Principle")
   - question: a thoughtful conceptual prompt (NOT multiple choice; open-ended inquiry)
   - hint: helpful pedagogical clue without giving away the full answer
   - followUp: A penetrating "WHY?" challenge question (e.g. "That's the formula, but WHY does halving the search space result in logarithmic time?")
   - keywords: 3-6 critical keywords/phrases essential to a sound explanation
   - difficulty: 1, 2, or 3
5. Provide an idealExplanation for each monster that shows how to completely debunk the misconception.
`;

    const prompt = `
TOPIC: ${topic || 'Lecture Concepts'}
OVERALL DIFFICULTY: ${difficulty}

LECTURE NOTES:
"""
${notes}
"""

Generate the 3-monster battle JSON strictly adhering to the schema.
`;

    let parsed: any;
    try {
      const { response, usedModel } = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              gameTitle: { type: Type.STRING, description: 'Catchy title for the battle' },
              monsters: {
                type: Type.ARRAY,
                description: 'Array of exactly 3 monsters',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    name: { type: Type.STRING, description: 'Monster battle title, e.g. "Stack vs Queue"' },
                    creature: { type: Type.STRING, description: 'Monster fantasy species, e.g. "Stack Goblin"' },
                    emoji: { type: Type.STRING, description: 'Single emoji representing monster, e.g. "🧌"' },
                    difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
                    isBoss: { type: Type.BOOLEAN },
                    belief: { type: Type.STRING, description: 'The stubborn misconception held by the monster' },
                    intro: { type: Type.STRING, description: 'Aggressive or humorous battle dialogue' },
                    victoryLine: { type: Type.STRING, description: 'Monster acknowledgment of being enlightened upon defeat' },
                    idealExplanation: { type: Type.STRING, description: 'Comprehensive ideal explanation teaching the monster' },
                    points: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          question: { type: Type.STRING },
                          hint: { type: Type.STRING },
                          followUp: { type: Type.STRING, description: 'The challenging "WHY?" follow-up question' },
                          keywords: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                          difficulty: { type: Type.INTEGER },
                        },
                        required: ['label', 'question', 'hint', 'followUp', 'keywords', 'difficulty'],
                      },
                    },
                  },
                  required: [
                    'id',
                    'name',
                    'creature',
                    'emoji',
                    'difficulty',
                    'isBoss',
                    'belief',
                    'intro',
                    'victoryLine',
                    'idealExplanation',
                    'points',
                  ],
                },
              },
            },
            required: ['gameTitle', 'monsters'],
          },
        },
      });

      parsed = JSON.parse(response.text || '{}');
      if (!parsed.monsters || parsed.monsters.length !== 3) {
        throw new Error('AI must return exactly 3 monsters.');
      }
      parsed.generatedBy = usedModel;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`Online Gemini generation temporarily unavailable (${message}). Activating intelligent local note analysis engine...`);
      parsed = generateLocalBattleFromNotes(notes, topic, difficulty);
      parsed.isLocalFallback = true;
      parsed.fallbackNotice = 'Google Gemini was temporarily at capacity (503). Generated via local note analysis engine so you can play without delay!';
    }

    return res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error in generate-battle route:', message);
    return res.status(500).json({
      error: `Battle generation failed: ${message}`,
    });
  }
});

// 3. Evaluate Student Answer
app.post('/api/gemini/evaluate-answer', async (req: Request, res: Response) => {
  try {
    const {
      monster,
      point,
      studentAnswer,
      isWhyFollowUp = false,
      previousAnswer = '',
      notes = '',
    } = req.body;

    if (!studentAnswer || !studentAnswer.trim()) {
      return res.status(400).json({ error: 'Student answer cannot be empty.' });
    }

    const ai = getGenAIClient(req);
    if (!ai) {
      // Use offline evaluator immediately if no key
      const offlineResult = evaluateOfflineAnswer(
        monster,
        point,
        studentAnswer,
        isWhyFollowUp,
        previousAnswer
      );
      return res.json(offlineResult);
    }

    const systemInstruction = `
You are the harsh yet encouraging educational combat judge for MONSTERCLASS.
The student is in a boss battle against: "${monster.name}" (${monster.creature}).
The monster stubbornly believes: "${monster.belief}".
Current concept being taught: "${point.label}".
Question asked: "${point.question}".
Ideal explanation: "${monster.idealExplanation}".
Keywords expected: ${JSON.stringify(point.keywords || [])}.
Is this a follow-up answer to the monster demanding "WHY?": ${isWhyFollowUp ? 'YES' : 'NO'}.
${isWhyFollowUp ? `Previous answer: "${previousAnswer}"` : ''}

EVALUATION CRITERIA:
1. Conceptual correctness based strictly on the course domain.
2. Explanation quality and reasoning depth.
3. Did the student explain *WHY* their statement is true, or did they merely drop a buzzword?
   - If the student simply states a fact without explanation (e.g., "It is O(log n)" or "It uses LIFO"), they did NOT sufficiently teach the monster!
   - In that case, you MUST set needsWhy = true, and formulate a sharp followUpQuestion asking WHY (or use "${point.followUp}").
4. If this is already a follow-up round and they provided sound reasoning, award correct = true, score >= 80, needsWhy = false.
5. In your feedback, stay in character as an engaging game master addressing the student's impact on the monster.

SCORING SCHEMA:
- correct: boolean (true if understanding is "good" or "strong", false if "weak" or "partial" requiring more explanation)
- score: integer 0 to 100
- understanding: "weak" | "partial" | "good" | "strong"
- feedback: string explaining what hit home and what misconception was corrected
- needsWhy: boolean (true if student only named a keyword or shallow fact and needs to explain WHY)
- followUpQuestion: string (the "WHY?" challenge if needsWhy is true, else empty string)
- hint: string (useful pedagogical guidance without solving it outright)
- damage: integer (0 to 35) to monster HP
- xp: integer (10 to 50)
`;

    try {
      const { response } = await generateContentWithFallback(ai, {
        contents: `Student Answer: "${studentAnswer}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              correct: { type: Type.BOOLEAN },
              score: { type: Type.INTEGER },
              understanding: {
                type: Type.STRING,
                enum: ['weak', 'partial', 'good', 'strong'],
              },
              feedback: { type: Type.STRING },
              needsWhy: { type: Type.BOOLEAN },
              followUpQuestion: { type: Type.STRING },
              hint: { type: Type.STRING },
              damage: { type: Type.INTEGER },
              xp: { type: Type.INTEGER },
            },
            required: [
              'correct',
              'score',
              'understanding',
              'feedback',
              'needsWhy',
              'followUpQuestion',
              'hint',
              'damage',
              'xp',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (apiErr: unknown) {
      console.warn('Gemini evaluate-answer unavailable, using offline evaluator:', apiErr);
      const offlineResult = evaluateOfflineAnswer(
        monster,
        point,
        studentAnswer,
        isWhyFollowUp,
        previousAnswer
      );
      return res.json(offlineResult);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error evaluating answer:', message);
    return res.status(500).json({
      error: `Answer evaluation failed: ${message}`,
    });
  }
});

// Download Project Documentation route
app.get('/README.md', (_req: Request, res: Response) => {
  const filePath = path.join(__dirname, 'README.md');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="MONSTERCLASS.md"');
    return res.sendFile(filePath);
  }
  return res.status(404).send('README.md not found');
});

// Serve frontend with Vite in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');

  if (!isProd) {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serve
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚔️ MonsterClass server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

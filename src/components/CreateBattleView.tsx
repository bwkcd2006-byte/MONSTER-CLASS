import React, { useState, useRef } from 'react';
import { Battle } from '../types';
import { geminiService } from '../services/geminiService';
import { sound } from '../services/sound';
import { storage } from '../services/storage';
import {
  Swords,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  FileText,
  Key,
  BookOpen,
  Loader2,
  CheckCircle,
  Upload,
  Globe,
  FileUp,
  X,
  Link as LinkIcon,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface CreateBattleViewProps {
  onBattleCreated: (battle: Battle) => void;
  onBack: () => void;
  onOpenSettings: () => void;
  onNavigateToAcademy: () => void;
  hasApiKey: boolean;
}

type InputMode = 'paste' | 'pdf' | 'url';

const SAMPLE_NOTES = [
  {
    title: 'Binary Search & Trees',
    topic: 'Data Structures: Searching & Binary Trees',
    notes: `Binary search is an efficient search algorithm designed exclusively for sorted lists and arrays. It compares the target key to the middle element: if equal, search succeeds; if target is smaller, the entire upper half of the array is discarded; if larger, the lower half is discarded. This halves the candidate search space each step, achieving O(log n) worst-case time complexity.

In contrast, binary search trees (BSTs) organize elements hierarchically where all nodes in a node's left subtree have smaller keys, and all nodes in its right subtree have larger keys. In-order traversal of a BST yields sorted order. However, if values are inserted in sorted order without balancing (e.g. 1, 2, 3, 4), the BST degenerates into a linear linked list with O(n) worst-case search time.`,
  },
  {
    title: 'ACID Database Transactions',
    topic: 'Database Systems: ACID Transactions',
    notes: `A database transaction is a logical unit of work that must satisfy ACID properties to ensure reliable processing:
1. Atomicity: The "all-or-nothing" rule. If any part of the transaction fails, the entire transaction is rolled back so no partial modifications persist.
2. Consistency: Transactions must preserve all database invariants and constraints, bringing the database from one valid state to another.
3. Isolation: Multiple concurrent transactions must not interfere with each other. Without adequate isolation, phenomena like dirty reads (reading uncommitted data) and non-repeatable reads occur.
4. Durability: Once a transaction commits, its modifications are permanently recorded on non-volatile storage (via write-ahead logging) and survive system crashes.`,
  },
  {
    title: 'TCP vs UDP Protocols',
    topic: 'Computer Networks: Transport Layer',
    notes: `The Transport layer provides process-to-process communication using TCP and UDP.
TCP (Transmission Control Protocol) is connection-oriented, establishing a reliable full-duplex connection via a three-way handshake (SYN, SYN-ACK, ACK). It guarantees in-order delivery and packet integrity using sequence numbers, cumulative ACKs, and timeouts that trigger retransmission upon packet loss. It also enforces flow and congestion control.

UDP (User Datagram Protocol) is a connectionless, best-effort transport protocol. It does not perform handshakes, sequence tracking, or retransmissions. Lost packets are discarded without notice. While unreliable, UDP has minimal header overhead (8 bytes vs 20+ bytes) and near-zero latency, making it the preferred choice for real-time video streaming, DNS lookups, and multiplayer games.`,
  },
];

const SAMPLE_URLS = [
  { label: 'Wiki: Binary Search', url: 'https://en.wikipedia.org/wiki/Binary_search_algorithm' },
  { label: 'Wiki: Recursion (CS)', url: 'https://en.wikipedia.org/wiki/Recursion_(computer_science)' },
  { label: 'Wiki: ACID Transactions', url: 'https://en.wikipedia.org/wiki/ACID' },
];

export const CreateBattleView: React.FC<CreateBattleViewProps> = ({
  onBattleCreated,
  onBack,
  onOpenSettings,
  onNavigateToAcademy,
  hasApiKey,
}) => {
  const [inputMode, setInputMode] = useState<InputMode>('paste');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // PDF Upload State
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [attachedPdfInfo, setAttachedPdfInfo] = useState<{
    filename: string;
    numpages: number;
    sizeKb: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL Input State
  const [urlInput, setUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [attachedUrlInfo, setAttachedUrlInfo] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const handleUseSample = (sample: { title: string; topic: string; notes: string }) => {
    sound.playClick();
    setTopic(sample.topic);
    setNotes(sample.notes);
    setAttachedPdfInfo(null);
    setAttachedUrlInfo(null);
    setErrorMessage(null);
  };

  // Process PDF or Text File Upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    sound.playClick();
    setErrorMessage(null);

    // If plain text or markdown
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          setNotes(text);
          if (!topic) {
            setTopic(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
          }
          setAttachedPdfInfo({
            filename: file.name,
            numpages: 1,
            sizeKb: Math.round(file.size / 1024),
          });
          sound.playCorrect();
        }
      };
      reader.readAsText(file);
      return;
    }

    // If PDF
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setIsExtractingPdf(true);
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          try {
            const result = await geminiService.extractPdf(base64, file.name);
            setNotes(result.text);
            if (!topic) {
              setTopic(file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
            }
            setAttachedPdfInfo({
              filename: file.name,
              numpages: result.numpages,
              sizeKb: Math.round(file.size / 1024),
            });
            sound.playCorrect();
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setErrorMessage(`PDF extraction failed: ${msg}`);
            sound.playPlayerHurt();
          } finally {
            setIsExtractingPdf(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (err: unknown) {
        setIsExtractingPdf(false);
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(`Failed to read file: ${msg}`);
      }
      return;
    }

    setErrorMessage('Unsupported file format. Please upload a PDF (.pdf), Text file (.txt), or Markdown (.md).');
  };

  // Fetch from URL
  const handleFetchUrl = async (targetUrl?: string) => {
    const toFetch = targetUrl || urlInput;
    if (!toFetch.trim()) {
      setErrorMessage('Please enter a valid website or online PDF URL.');
      return;
    }

    sound.playClick();
    setIsFetchingUrl(true);
    setErrorMessage(null);

    try {
      const result = await geminiService.extractUrl(toFetch.trim());
      setNotes(result.text);
      if (result.title) {
        setTopic(result.title);
      }
      setAttachedUrlInfo({
        url: result.url,
        title: result.title,
      });
      sound.playCorrect();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`URL extraction failed: ${msg}`);
      sound.playPlayerHurt();
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() || notes.trim().length < 20) {
      setErrorMessage('Please provide lecture notes (paste text, attach a PDF, or fetch from a URL) with at least 2-3 sentences.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    sound.playClick();

    try {
      const battle = await geminiService.generateBattleFromNotes(
        notes.trim(),
        topic.trim() || 'Custom Lecture Topic',
        difficulty
      );

      // Save custom battle to local storage
      storage.saveCustomBattle(battle);
      sound.playCorrect();
      onBattleCreated(battle);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(
        msg.includes('No Gemini API key')
          ? 'No Gemini API key detected. Please configure your key in Settings, or use our rich Offline Academy.'
          : `AI Battle Generation failed: ${msg}. Check your API key in Settings or try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-purple-500/20 pb-6">
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
          <span>⚔️ CREATE BATTLE</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Attach your lecture notes via <strong>PDF</strong>, <strong>URL</strong>, or <strong>direct paste</strong>. Gemini will construct 3 customized boss battles.
        </p>
      </div>

      {/* API Key status banner */}
      {!hasApiKey && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 text-sm">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>Note:</strong> Online AI generation uses Gemini. Stored 100% locally on your device.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onOpenSettings();
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 cursor-pointer"
            >
              Add Key
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onNavigateToAcademy();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#1a1f3a] hover:bg-[#22294e] text-slate-300 font-bold text-xs border border-purple-500/25 cursor-pointer"
            >
              Play Offline Academy
            </button>
          </div>
        </div>
      )}

      {/* Source Selection Tabs */}
      <div className="space-y-3">
        <label className="block text-xs uppercase font-extrabold tracking-wider text-slate-300">
          Step 1: Choose How to Attach Lecture Notes
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setInputMode('paste');
            }}
            className={`p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-2 font-bold text-sm transition-all border cursor-pointer ${
              inputMode === 'paste'
                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/40 scale-102'
                : 'bg-[#141933] text-slate-300 border-purple-500/20 hover:bg-[#1a1f3a]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Text</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setInputMode('pdf');
            }}
            className={`p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-2 font-bold text-sm transition-all border cursor-pointer ${
              inputMode === 'pdf'
                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/40 scale-102'
                : 'bg-[#141933] text-slate-300 border-purple-500/20 hover:bg-[#1a1f3a]'
            }`}
          >
            <FileUp className="w-4 h-4 text-emerald-400" />
            <span>Upload PDF / File</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setInputMode('url');
            }}
            className={`p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-2 font-bold text-sm transition-all border cursor-pointer ${
              inputMode === 'url'
                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/40 scale-102'
                : 'bg-[#141933] text-slate-300 border-purple-500/20 hover:bg-[#1a1f3a]'
            }`}
          >
            <Globe className="w-4 h-4 text-pink-400" />
            <span>Paste Web URL</span>
          </button>
        </div>
      </div>

      {/* Input Mode 1: PDF Upload Box */}
      {inputMode === 'pdf' && (
        <div className="p-6 rounded-3xl bg-[#141933] border-2 border-dashed border-purple-500/40 hover:border-purple-400/60 transition-all text-center space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
          />

          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 border border-emerald-500/30">
            <Upload className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-white text-base">
              Upload Lecture PDF or Document
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Drag and drop your syllabus slides, textbook chapters, or lecture notes. Supports <strong>.pdf</strong>, <strong>.txt</strong>, and <strong>.md</strong>.
            </p>
          </div>

          <button
            type="button"
            disabled={isExtractingPdf}
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
          >
            {isExtractingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                <span>PARSING PDF TEXT...</span>
              </>
            ) : (
              <>
                <FileUp className="w-4 h-4" />
                <span>Select PDF File</span>
              </>
            )}
          </button>

          {/* Attached PDF badge */}
          {attachedPdfInfo && (
            <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 inline-flex items-center gap-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>{attachedPdfInfo.filename}</strong> • {attachedPdfInfo.numpages} page(s) • {attachedPdfInfo.sizeKb} KB extracted
              </span>
              <button
                type="button"
                onClick={() => {
                  setAttachedPdfInfo(null);
                  setNotes('');
                }}
                className="text-slate-400 hover:text-white ml-2 cursor-pointer"
                title="Remove attached PDF"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input Mode 2: URL Input Box */}
      {inputMode === 'url' && (
        <div className="p-6 rounded-3xl bg-[#141933] border border-purple-500/30 space-y-4">
          <div className="flex items-center gap-2 text-pink-400 text-sm font-bold">
            <Globe className="w-4 h-4" />
            <span>Fetch Lecture Notes from Web Page or Online Document</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://en.wikipedia.org/wiki/Binary_search_algorithm"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0f1221] border border-purple-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 text-sm"
              />
              <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>

            <button
              type="button"
              disabled={isFetchingUrl || !urlInput.trim()}
              onClick={() => handleFetchUrl()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              {isFetchingUrl ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-pink-200" />
                  <span>FETCHING CONTENT...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>FETCH NOTES</span>
                </>
              )}
            </button>
          </div>

          {/* Sample URLs */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Try Sample URL:</span>
            {SAMPLE_URLS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setUrlInput(sample.url);
                  handleFetchUrl(sample.url);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#0f1221] hover:bg-[#1a1f3a] text-purple-300 border border-purple-500/20 hover:border-purple-400/40 transition-all cursor-pointer"
              >
                🔗 {sample.label}
              </button>
            ))}
          </div>

          {/* Attached URL badge */}
          {attachedUrlInfo && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2 truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">
                  Extracted from: <strong>{attachedUrlInfo.title}</strong> ({attachedUrlInfo.url})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAttachedUrlInfo(null);
                  setNotes('');
                }}
                className="text-slate-400 hover:text-white shrink-0 cursor-pointer"
                title="Remove attached URL"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Sample Notes */}
      {inputMode === 'paste' && (
        <div className="space-y-2">
          <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Quick Sample Notes (Click to load):</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_NOTES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleUseSample(sample)}
                className="px-3 py-1.5 rounded-xl bg-[#1a1f3a] hover:bg-[#22294e] text-xs font-semibold text-purple-300 hover:text-white border border-purple-500/20 hover:border-purple-400/40 transition-all cursor-pointer"
              >
                📋 {sample.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Topic Input */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-white uppercase tracking-wider">
            Step 2: Battle Topic / Subject Title
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Data Structures: Binary Trees, Operating Systems, Computer Architecture"
            className="w-full px-4 py-3 rounded-xl bg-[#141933] border border-purple-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 text-base"
          />
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-white uppercase tracking-wider">
            Step 3: Difficulty Tier
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['easy', 'normal', 'hard'] as const).map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setDifficulty(diff);
                }}
                className={`py-3 px-4 rounded-xl font-bold text-sm capitalize transition-all border cursor-pointer ${
                  difficulty === diff
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/40'
                    : 'bg-[#141933] text-slate-400 border-purple-500/20 hover:text-white hover:bg-[#1a1f3a]'
                }`}
              >
                {diff === 'easy' && '🟢 Easy'}
                {diff === 'normal' && '🟡 Normal'}
                {diff === 'hard' && '🔴 Hard'}
              </button>
            ))}
          </div>
        </div>

        {/* Notes Textarea (Always accessible so users can inspect/edit what was pasted or extracted) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Lecture Notes Material</span>
            </label>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="font-mono-code font-semibold text-purple-300">
                {notes.split(/\s+/).filter(Boolean).length} words
              </span>
              <span>•</span>
              <span className="font-mono-code">{notes.length} characters</span>
            </div>
          </div>

          <textarea
            rows={8}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste notes, or upload a PDF/URL above to auto-populate...&#10;&#10;The 3 monsters will generate questions based ONLY on this text!"
            className="w-full p-4 rounded-2xl bg-[#141933] border border-purple-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 text-sm sm:text-base leading-relaxed font-sans resize-y"
          />
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{errorMessage}</p>
              {!hasApiKey && (
                <p className="text-xs text-slate-300">
                  Tip: If you do not have an API key, our{' '}
                  <button
                    type="button"
                    onClick={onNavigateToAcademy}
                    className="underline text-purple-400 font-bold hover:text-purple-300 cursor-pointer"
                  >
                    Offline Academy
                  </button>{' '}
                  has 15+ rich computer science boss battles ready right now!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !notes.trim()}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-lg shadow-xl shadow-purple-600/40 transition-all hover:scale-101 active:scale-99 cursor-pointer flex items-center justify-center gap-3 border border-purple-300/30"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-purple-200" />
                <span>SUMMONING 3 BOSSES WITH GEMINI...</span>
              </>
            ) : (
              <>
                <Swords className="w-6 h-6 text-pink-300" />
                <span>⚔️ CREATE BATTLE (3 BOSSES)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

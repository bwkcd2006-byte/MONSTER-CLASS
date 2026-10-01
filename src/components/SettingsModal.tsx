import React, { useState } from 'react';
import { AppSettings } from '../types';
import { storage } from '../services/storage';
import { sound } from '../services/sound';
import { geminiService } from '../services/geminiService';
import {
  X,
  Key,
  ShieldCheck,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Sparkles,
  Loader2,
  FileText,
  Download,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsUpdated: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsUpdated,
}) => {
  const [apiKey, setApiKey] = useState(storage.getApiKey());
  const [showKey, setShowKey] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [animationsEnabled, setAnimationsEnabled] = useState(settings.animationsEnabled);
  const [difficulty, setDifficulty] = useState(settings.difficulty);

  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  if (!isOpen) return null;

  const handleTestKey = async () => {
    sound.playClick();
    if (!apiKey.trim()) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'Please type an API key before testing.',
      });
      return;
    }

    setTestStatus({ loading: true });
    const result = await geminiService.testApiKey(apiKey.trim());
    setTestStatus({
      loading: false,
      success: result.ok,
      message: result.message,
    });
    if (result.ok) {
      sound.playCorrect();
    } else {
      sound.playPlayerHurt();
    }
  };

  const handleDeleteKey = () => {
    sound.playClick();
    if (confirm('Delete your locally stored Gemini API key?')) {
      storage.deleteApiKey();
      setApiKey('');
      setTestStatus({
        loading: false,
        success: true,
        message: 'API Key deleted from local storage.',
      });
      const updated = storage.saveSettings({ geminiApiKey: '' });
      onSettingsUpdated(updated);
    }
  };

  const handleSave = () => {
    sound.playClick();
    storage.setApiKey(apiKey);
    sound.setEnabled(soundEnabled);
    const updated = storage.saveSettings({
      geminiApiKey: apiKey.trim(),
      soundEnabled,
      animationsEnabled,
      difficulty,
    });
    onSettingsUpdated(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-[#1a1f3a] border border-purple-500/40 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-heading">
                Settings &amp; AI Configuration
              </h3>
              <p className="text-xs text-slate-400">
                Manage your Gemini API key and game preferences
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-[#0f1221] hover:bg-[#22294e] text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI SETTINGS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-400">
              AI Settings
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
              Provider: Google Gemini
            </span>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Gemini API Key
            </label>
            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-4 pr-11 py-3 rounded-xl bg-[#0f1221] border border-purple-500/30 text-white placeholder-slate-600 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 text-sm font-mono-code"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 text-slate-400 hover:text-white cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Test & Delete Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={testStatus.loading}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              {testStatus.loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>TESTING KEY...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>TEST API KEY</span>
                </>
              )}
            </button>

            {apiKey && (
              <button
                type="button"
                onClick={handleDeleteKey}
                className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-xs border border-red-500/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>DELETE KEY</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 text-xs font-semibold ml-auto">
              <span className="text-slate-400">Status:</span>
              {apiKey.trim() ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Configured
                </span>
              ) : (
                <span className="text-slate-400">Offline Mode Active</span>
              )}
            </div>
          </div>

          {/* Test Result Message */}
          {testStatus.message && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testStatus.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {testStatus.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testStatus.message}</span>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="p-3.5 rounded-xl bg-[#0f1221] border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PRIVACY &amp; SECURITY NOTICE</span>
            </div>
            <p>
              Your API key is stored <strong>locally on your device</strong> in browser storage.
              It is never hardcoded and is never sent anywhere except the Google Gemini API endpoint.
            </p>
            <p className="text-[10px] text-slate-500">
              Use your own Gemini API key. API usage may incur charges according to Google&apos;s current API terms.
            </p>
          </div>
        </div>

        {/* GAME SETTINGS */}
        <div className="space-y-4 border-t border-purple-500/20 pt-4">
          <span className="text-xs uppercase font-extrabold tracking-wider text-purple-400">
            Game Settings
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sound Toggle */}
            <div className="p-3.5 rounded-xl bg-[#0f1221] border border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <span>Sound FX</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  sound.setEnabled(!soundEnabled);
                  if (!soundEnabled) sound.playClick();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  soundEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Animations Toggle */}
            <div className="p-3.5 rounded-xl bg-[#0f1221] border border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Animations</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setAnimationsEnabled(!animationsEnabled);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  animationsEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {animationsEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Difficulty selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Default Battle Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'normal', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setDifficulty(diff);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border ${
                    difficulty === diff
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                      : 'bg-[#0f1221] text-slate-400 border-purple-500/20 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Project Markdown Documentation */}
          <div className="p-4 rounded-2xl bg-[#0f1221] border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-xs font-bold text-white">Project Documentation (README.md)</p>
                <p className="text-[11px] text-slate-400">Download the complete architectural markdown file for this app.</p>
              </div>
            </div>

            <a
              href="/README.md"
              download="MONSTERCLASS.md"
              className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </a>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-purple-500/20 pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-[#0f1221] hover:bg-[#22294e] text-slate-300 font-bold text-sm cursor-pointer border border-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 cursor-pointer border border-purple-300/30"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Battle, BattleResultSummary, PlayerStats, AppSettings } from './types';
import { OFFLINE_SUBJECTS } from './data/offlineCourses';
import { storage } from './services/storage';
import { sound } from './services/sound';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { OfflineAcademyView } from './components/OfflineAcademyView';
import { CreateBattleView } from './components/CreateBattleView';
import { BattleView } from './components/BattleView';
import { ResultsView } from './components/ResultsView';
import { ProgressView } from './components/ProgressView';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [currentView, setCurrentView] = useState<
    'home' | 'create' | 'academy' | 'battle' | 'results' | 'progress'
  >('home');

  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [battleSummary, setBattleSummary] = useState<BattleResultSummary | null>(null);
  const [leveledUpState, setLeveledUpState] = useState<{ leveledUp: boolean; newLevel: number }>({
    leveledUp: false,
    newLevel: 1,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [playerStats, setPlayerStats] = useState<PlayerStats>(storage.getPlayerStats());

  // Initialize sound settings on mount
  useEffect(() => {
    sound.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  const refreshPlayerStats = () => {
    setPlayerStats(storage.getPlayerStats());
  };

  const hasApiKey = Boolean(storage.getApiKey().trim());

  // Handle starting a battle
  const handleStartBattle = (battle: Battle) => {
    setActiveBattle(battle);
    setCurrentView('battle');
  };

  // Handle battle completion
  const handleBattleFinished = (summary: BattleResultSummary) => {
    const levelResult = storage.addBattleResult(summary);
    setBattleSummary(summary);
    setLeveledUpState(levelResult);
    refreshPlayerStats();
    setCurrentView('results');
  };

  // Handle rematch
  const handleRematch = () => {
    if (activeBattle) {
      setCurrentView('battle');
    } else {
      setCurrentView('academy');
    }
  };

  const sampleBattle = OFFLINE_SUBJECTS[0].battles[0];

  return (
    <div className="min-h-screen bg-[#0f1221] text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        playerStats={playerStats}
        settings={settings}
        hasApiKey={hasApiKey}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        {currentView === 'home' && (
          <HomeView
            onNavigate={(view) => setCurrentView(view)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onStartBattle={handleStartBattle}
            playerStats={playerStats}
            sampleBattle={sampleBattle}
          />
        )}

        {currentView === 'academy' && (
          <OfflineAcademyView
            onStartBattle={handleStartBattle}
            onBack={() => setCurrentView('home')}
            playerStats={playerStats}
          />
        )}

        {currentView === 'create' && (
          <CreateBattleView
            onBattleCreated={handleStartBattle}
            onBack={() => setCurrentView('home')}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onNavigateToAcademy={() => setCurrentView('academy')}
            hasApiKey={hasApiKey}
          />
        )}

        {currentView === 'battle' && activeBattle && (
          <BattleView
            battle={activeBattle}
            onBattleFinished={handleBattleFinished}
            onExitBattle={() => setCurrentView('home')}
            hasApiKey={hasApiKey}
          />
        )}

        {currentView === 'results' && battleSummary && activeBattle && (
          <ResultsView
            summary={battleSummary}
            battle={activeBattle}
            onRematch={handleRematch}
            onGoHome={() => setCurrentView('home')}
            onGoAcademy={() => setCurrentView('academy')}
            leveledUp={leveledUpState.leveledUp}
            newLevel={leveledUpState.newLevel}
          />
        )}

        {currentView === 'progress' && (
          <ProgressView
            playerStats={playerStats}
            onBack={() => setCurrentView('home')}
            onRefreshStats={refreshPlayerStats}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-900/30 bg-[#0c0e1a] py-6 px-4 text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">
          MONSTERCLASS • &ldquo;Don&apos;t just answer. Teach the monster.&rdquo;
        </p>
        <p>
          AI-powered boss battles for computer science &amp; engineering. 100% offline-ready curriculum included.
        </p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsUpdated={(newSettings) => setSettings(newSettings)}
      />
    </div>
  );
}

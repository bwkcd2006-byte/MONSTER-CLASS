# 🐉 MONSTERCLASS
> *"Don't just answer. Teach the monster."*

**MONSTERCLASS** is an interactive educational RPG battle game grounded in the **Protégé Effect** and the **Feynman Technique**. Instead of passive multiple-choice quizzes, students engage in combat against stubborn fantasy creatures holding deeply rooted misconceptions. To deal damage and progress through the 3-boss gauntlet, the student must explain the core concepts and underlying mechanisms in their own words.

---

## 🎮 Core Gameplay & Educational Mechanics

1. **The Protégé Effect & Feynman Technique**
   - Research demonstrates that students retain up to 90% of what they learn when tasked with teaching someone else.
   - Each monster stubbornly defends a believable misconception (e.g., *"A stack and a queue are the same thing! Whoever arrives first always leaves first, right?"*).
   - Buzzword answers are recognized and rejected: if a student simply recites a formula or name without explaining the mechanism, the creature counters with an assertive **"WHY?"** challenge.

2. **The 3-Boss Progressive Gauntlet**
   - **Boss 1: The Concept Guardian** *(Easy)* — Challenges basic definitions, boundaries, and terminology.
   - **Boss 2: The Reasoning Beast** *(Medium)* — Challenges functional mechanisms, causal links, and "how it works under the hood."
   - **Boss 3: The Final Overlord** *(Hard)* — Challenges subtle edge cases, trade-offs, constraints, and complex real-world application.

3. **Autonomous Lecture Material Processing**
   - **Upload PDF / Document**: The system parses the document server-side and Gemini automatically identifies the core concepts, definitions, and common student errors.
   - **Paste Web URL**: Extracts article or lecture content and generates tailored progressive bosses.
   - **Paste Text**: Direct text paste with quick sample scenarios.

4. **Combat Arena Interface**
   - **Creature Artwork**: High-fidelity pixel-art (*Stack Goblin* with staff) and dynamic stylized creature avatars.
   - **Neon Green HP Bar**: Real-time HP damage deduction based on explanation depth.
   - **Speech Bubble**: Creature's active misconception with an upward dialogue notch.
   - **"What the creature must understand"**: Progressive checklist starting with `❓ ???` and unlocking into `✅ (Understood)` as points are mastered.
   - **Player Vitality**: 3-Heart (`❤️ ❤️ ❤️`) health meter that depletes if misconceptions remain uncorrected.
   - **Explanation Area**: Spacious textarea with real-time word counter.
   - **Voice Input (`🎤 Speak`)**: Real Web Speech API transcription supporting multiple accents (`en-IN`, `en-US`, `en-GB`, `en-AU`).
   - **Auto-Demo (`▶️ Auto-Demo`)**: Autonomous teaching agent that demonstrates ideal answers with an animated typewriter effect, automatically evaluates and attacks, answers any follow-up "WHY?" challenges, and finishes the boss battle on its own.
   - **Pedagogical Hints (`💡 Hint`)**: Contextual clues that guide thinking without giving away the answer.

5. **Offline Academy**
   - Over 15+ pre-loaded computer science boss battles across:
     - Data Structures & Algorithms
     - Operating Systems & Concurrency
     - Computer Networking & Protocols
     - Database Systems & Transactions
   - Fully playable offline without any Gemini API key.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**:
  - React 19 (Functional components, hooks)
  - TypeScript
  - Tailwind CSS
  - Lucide React Icons
  - Web Audio API (synthesized retro RPG sound effects)
  - Web Speech API (browser voice-to-text recognition)

- **Backend**:
  - Express.js with Node.js
  - `@google/genai` TypeScript SDK
  - `pdf-parse` for server-side PDF extraction
  - URL text sanitizer & scraper

- **Resilient AI Pipeline**:
  - **Primary Model**: `gemini-3.8-flash`
  - **Automatic Retry & Backoff**: Handles temporary 503 / 429 capacity spikes gracefully.
  - **Model Fallback Cascade**: `gemini-3.8-flash` $\to$ `gemini-flash-latest` $\to$ `gemini-3.1-flash-lite`.
  - **Local Note Analysis Engine**: If external APIs are unavailable, the built-in local parser extracts definitions and keywords to synthesize a 3-boss battle so gameplay is never blocked.

---

## 📂 Project Structure

```
├── server.ts                       # Express backend with Gemini API proxy & PDF parser
├── index.html                      # HTML entry point with retro fantasy styling
├── package.json                    # Dependencies & build scripts
├── vite.config.ts                  # Vite build & development configuration
├── tsconfig.json                   # TypeScript configuration
└── src/
    ├── App.tsx                     # Main state container & view router
    ├── main.tsx                    # React root mount
    ├── types.ts                    # TypeScript data models (Monster, Battle, ConceptPoint, etc.)
    ├── components/
    │   ├── BattleView.tsx          # Combat arena matching the reference interface
    │   ├── CreatureArt.tsx         # SVG / pixel-art character illustrations (Stack Goblin, etc.)
    │   ├── CreateBattleView.tsx    # PDF / URL / Text lecture battle creator
    │   ├── HomeView.tsx            # Hero landing screen & quick-start battle launcher
    │   ├── Navbar.tsx              # Top navigation bar with XP, Level & Settings
    │   ├── OfflineAcademyView.tsx  # 15+ curated computer science boss encounters
    │   ├── ProgressView.tsx        # Player stats, level progression & history logs
    │   ├── ResultsView.tsx         # Post-battle analytics & concept mastery breakdown
    │   └── SettingsModal.tsx       # Gemini API key configuration & audio settings
    ├── data/
    │   └── offlineCourses.ts       # Built-in curriculum & boss battle definitions
    └── services/
        ├── geminiService.ts        # Client-side API bridge for generation & evaluation
        ├── localBattleGenerator.ts # Local fallback battle generator
        ├── offlineEvaluator.ts     # Local heuristic evaluation engine
        ├── sound.ts                # Web Audio API sound generator
        └── storage.ts              # LocalStorage persistence for battles & user stats
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 2. Installation
```bash
npm install
```

### 3. Environment Variables (Optional)
Create a `.env` file in the root directory:
```env
# Optional server-side Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```
> *Note: Users can also input their own Gemini API key directly in the in-app **Settings** modal, which stores it securely in the browser's `localStorage`.*

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Building for Production
```bash
npm run build
npm start
```

---

## 🔑 Obtaining a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **"Get API key"** and copy the generated key (`AIzaSy...`).
4. In MONSTERCLASS, click the ⚙️ **Settings** button in the top navigation bar.
5. Paste your key and click **"Save Key"**.

---

## 📜 License
MIT License. Built for interactive learning with Google Gemini.

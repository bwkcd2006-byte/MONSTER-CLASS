import React from 'react';
import { Monster } from '../types';

interface CreatureArtProps {
  monster: Monster;
  animation?: 'idle' | 'shake' | 'taunt';
  className?: string;
}

export const CreatureArt: React.FC<CreatureArtProps> = ({
  monster,
  animation = 'idle',
  className = '',
}) => {
  const isGoblin =
    monster.creature.toLowerCase().includes('goblin') ||
    monster.name.toLowerCase().includes('goblin') ||
    monster.name.toLowerCase().includes('stack');

  const animationClass =
    animation === 'shake'
      ? 'animate-creature-shake'
      : animation === 'taunt'
      ? 'animate-creature-taunt'
      : 'animate-creature-bob';

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* If monster is Stack Goblin, render the exact pixel-art / illustrated goblin character from the screenshot */}
      {isGoblin ? (
        <svg
          viewBox="0 0 160 160"
          className={`w-36 h-36 select-none transition-transform duration-300 drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] ${animationClass}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Wooden Staff on right */}
          <path
            d="M110 35 L125 45 L118 60 L122 80 L115 130 L108 135 L106 75 L112 50 Z"
            fill="#8B5A2B"
          />
          <path d="M120 40 L130 38 L126 50 Z" fill="#654321" />
          <path d="M107 70 L98 75 L102 82 Z" fill="#654321" />
          <circle cx="116" cy="42" r="3" fill="#2E8B57" />

          {/* Goblin Body / Tunic */}
          <path
            d="M50 110 L110 110 L118 145 L42 145 Z"
            fill="#8B5A2B"
          />
          {/* Inner dark vest / collar */}
          <path
            d="M70 110 L90 110 L84 135 L76 135 Z"
            fill="#3E2723"
          />
          <path
            d="M80 110 L80 135"
            stroke="#212121"
            strokeWidth="2"
          />

          {/* Shoulders / Arms */}
          <path
            d="M45 112 C40 120 42 135 52 140 C58 138 60 125 56 115 Z"
            fill="#6B8E23"
          />
          <path
            d="M115 112 C120 120 118 135 108 140 C102 138 100 125 104 115 Z"
            fill="#6B8E23"
          />

          {/* Hand holding staff */}
          <circle cx="112" cy="100" r="7" fill="#7CB342" />

          {/* Pointy Goblin Ears */}
          {/* Left Ear */}
          <polygon
            points="54,65 30,55 48,78"
            fill="#7CB342"
          />
          <polygon
            points="50,66 36,58 46,75"
            fill="#558B2F"
          />
          {/* Right Ear */}
          <polygon
            points="106,65 130,55 112,78"
            fill="#7CB342"
          />
          <polygon
            points="110,66 124,58 114,75"
            fill="#558B2F"
          />

          {/* Goblin Head */}
          <rect
            x="52"
            y="48"
            width="56"
            height="56"
            rx="14"
            fill="#8BC34A"
          />

          {/* Brow ridges */}
          <rect x="58" y="58" width="18" height="6" rx="3" fill="#689F38" />
          <rect x="84" y="58" width="18" height="6" rx="3" fill="#689F38" />

          {/* Eyes */}
          <circle cx="68" cy="68" r="5" fill="#FFF9C4" />
          <circle cx="68" cy="68" r="2.5" fill="#BF360C" />
          <circle cx="92" cy="68" r="5" fill="#FFF9C4" />
          <circle cx="92" cy="68" r="2.5" fill="#BF360C" />

          {/* Goblin Nose */}
          <polygon points="80,72 74,82 86,82" fill="#689F38" />

          {/* Beard / Goatee */}
          <path
            d="M62 86 C62 86 64 104 80 108 C96 104 98 86 98 86 C92 90 88 92 80 92 C72 92 68 90 62 86 Z"
            fill="#4E342E"
          />

          {/* Mouth / Smile */}
          <path
            d="M74 88 Q80 92 86 88"
            stroke="#271810"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Small goblin tusks */}
          <polygon points="73,90 75,85 77,90" fill="#ECEFF1" />
          <polygon points="83,90 85,85 87,90" fill="#ECEFF1" />
        </svg>
      ) : (
        /* Dynamic avatar for other monsters */
        <div className="flex flex-col items-center justify-center">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-[#141938]/80 border border-purple-500/30 flex items-center justify-center shadow-inner relative">
            <span className={`text-6xl sm:text-7xl select-none ${animationClass}`}>
              {monster.emoji || '👾'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Difficulty, GameMode, GameSettings, Tense, Topic } from '../types';
import { TrophyIcon, BoltIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface GameSetupProps {
  onStart: (settings: GameSettings) => void;
}

const SelectionCard = ({ 
  label, 
  options, 
  selected, 
  onSelect 
}: { 
  label: string; 
  options: string[]; 
  selected: string; 
  onSelect: (val: any) => void 
}) => (
  <div className="mb-6">
    <h3 className="text-gray-700 font-bold mb-3 uppercase text-sm tracking-wider flex items-center gap-2">
      <span className="w-2 h-2 bg-honey-400 rotate-45"></span>
      {label}
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`
            clip-hex-btn p-3 text-sm font-bold transition-all duration-200 border-b-4 flex items-center justify-center gap-2 relative overflow-hidden
            ${selected === opt 
              ? 'bg-indigo-600 border-indigo-800 text-white shadow-lg translate-y-[-2px]' 
              : 'bg-white border-gray-200 text-gray-600 hover:border-honey-400 hover:bg-honey-100'}
          `}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

export const GameSetup: React.FC<GameSetupProps> = ({ onStart }) => {
  const [mode, setMode] = React.useState<GameMode>(GameMode.STANDARD);
  const [topic, setTopic] = React.useState<Topic>(Topic.DAILY_LIFE);
  const [customTopic, setCustomTopic] = React.useState('');
  const [tense, setTense] = React.useState<Tense>(Tense.PRESENT);
  const [difficulty, setDifficulty] = React.useState<Difficulty>(Difficulty.BEGINNER);

  const handleStartGame = () => {
    onStart({ 
        mode, 
        topic, 
        customTopic: topic === Topic.CUSTOM ? customTopic : undefined,
        tense, 
        difficulty 
    });
  };

  const modeDetails = [
    {
      id: GameMode.STANDARD,
      label: 'Standard',
      description: 'Build 10 sentences at your own pace.',
      icon: TrophyIcon,
      color: 'text-yellow-500'
    },
    {
      id: GameMode.BLITZ,
      label: 'Blitz',
      description: 'Race against the clock! 60 seconds to build as many sentences as you can.',
      icon: BoltIcon,
      color: 'text-red-500'
    },
    {
      id: GameMode.ZEN,
      label: 'Zen',
      description: 'Endless practice, no pressure, no timers. Click finish whenever you\'re ready.',
      icon: SparklesIcon,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-honeycomb bg-fixed">
      <div className="max-w-4xl w-full bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 overflow-hidden relative border-t-8 border-honey-400">
        
        {/* Hexagonal decorative accents */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-honey-100 opacity-50 rotate-12 clip-hex-btn"></div>
        <div className="absolute top-20 -left-10 w-20 h-20 bg-french-blue opacity-5 rotate-45 clip-hex-btn"></div>

        <div className="relative z-10">
          <header className="mb-10 text-center">
            <div className="inline-flex items-center justify-center mb-2">
                {/* Hexagon Logo Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-honey-400 to-honey-500 flex items-center justify-center text-white font-black text-2xl mr-3 shadow-lg" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                    H
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                Hexa<span className="text-french-blue">Grammar</span>
                </h1>
            </div>
            <p className="text-gray-500 font-medium">Master French syntax, one cell at a time.</p>
          </header>

          {/* Game Mode Selection Cards */}
          <div className="mb-8">
            <h3 className="text-gray-700 font-bold mb-3 uppercase text-sm tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-honey-400 rotate-45"></span>
                Game Mode
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {modeDetails.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`
                            relative p-5 text-left clip-hex-btn border-b-4 transition-all duration-200 group h-full flex flex-col
                            ${mode === m.id
                                ? 'bg-indigo-600 border-indigo-800 text-white shadow-lg translate-y-[-2px]'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-honey-400 hover:bg-honey-50'}
                        `}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className={`font-black text-lg ${mode === m.id ? 'text-white' : 'text-gray-800 group-hover:text-indigo-600'}`}>
                                {m.label}
                            </span>
                            <m.icon className={`w-6 h-6 ${mode === m.id ? 'text-white opacity-80' : m.color}`} />
                        </div>
                        <p className={`text-xs leading-relaxed font-semibold mt-auto ${mode === m.id ? 'text-indigo-100' : 'text-gray-400'}`}>
                            {m.description}
                        </p>
                    </button>
                ))}
            </div>
          </div>
          
          <SelectionCard 
            label="Topic" 
            options={Object.values(Topic)} 
            selected={topic} 
            onSelect={setTopic} 
          />

          {topic === Topic.CUSTOM && (
             <div className="mb-6 animate-fadeIn">
                <label className="text-gray-700 font-bold mb-2 uppercase text-sm tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-honey-400 rotate-45"></span>
                    Custom Theme
                </label>
                <div className="relative">
                    <input 
                        type="text"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        placeholder="e.g. Star Wars, Minecraft, Underwater..."
                        className="w-full bg-indigo-600 border-2 border-indigo-600 rounded-xl p-4 text-lg font-bold text-white placeholder-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition clip-hex-btn"
                    />
                </div>
             </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectionCard 
                label="Target Tense" 
                options={Object.values(Tense)} 
                selected={tense} 
                onSelect={setTense} 
            />

            <SelectionCard 
                label="Difficulty" 
                options={Object.values(Difficulty)} 
                selected={difficulty} 
                onSelect={setDifficulty} 
            />
          </div>

          <div className="mt-12 flex justify-center">
            <button
              onClick={handleStartGame}
              disabled={topic === Topic.CUSTOM && !customTopic.trim()}
              className={`
                text-lg font-bold py-4 px-16 clip-hex-btn shadow-lg transition-all duration-300 transform
                ${topic === Topic.CUSTOM && !customTopic.trim() 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-french-red to-red-600 text-white hover:shadow-xl hover:-translate-y-1 hover:scale-105'}
              `}
            >
              ENTER THE HIVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
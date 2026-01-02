import React from 'react';
import { SentenceSlot } from '../types';
import { FireIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface ForgeLoadingProps {
  slots: SentenceSlot[];
}

export const ForgeLoading: React.FC<ForgeLoadingProps> = ({ slots }) => {
  return (
    <div className="absolute inset-0 z-50 bg-gray-900 rounded-3xl overflow-hidden flex flex-col items-center justify-center font-sans">
      <style>{`
        @keyframes driftIn {
          0% { transform: translateY(100px) scale(0.8); opacity: 0; }
          20% { opacity: 1; }
          80% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-50px) scale(0); opacity: 0; }
        }
        @keyframes hammerStrike {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-45deg); }
          60% { transform: rotate(10deg); }
        }
        @keyframes sparkFly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        .word-scrap {
          animation: driftIn 2s ease-in-out infinite;
        }
        .hammer-arm {
          transform-origin: bottom right;
          animation: hammerStrike 1.5s infinite;
        }
        .spark {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #FCD34D;
          border-radius: 50%;
          animation: sparkFly 0.8s linear infinite;
        }
      `}</style>

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/50 via-gray-900 to-gray-900"></div>
      
      {/* Falling Words "Scraps" */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
        {slots.map((slot, i) => (
          <div 
            key={slot.id} 
            className="word-scrap absolute text-gray-500 font-bold text-lg whitespace-nowrap"
            style={{ 
              animationDelay: `${i * 0.2}s`,
              left: `${20 + (i % 3) * 30}%`,
              top: '60%' 
            }}
          >
            {slot.value?.text}
          </div>
        ))}
      </div>

      {/* Main Furnace Visual */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* The Hammer & Anvil */}
        <div className="relative w-48 h-48 mb-8">
            {/* Anvil Base (Hexagon Style) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-gray-800 rounded-lg border-t-4 border-orange-500/50 shadow-[0_0_50px_rgba(249,115,22,0.4)]"></div>
            
            {/* The Fire Core */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-orange-600 rounded-full blur-xl animate-pulse opacity-80"></div>
            <FireIcon className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-24 text-orange-500 animate-bounce-short drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />

            {/* Hammer */}
            <div className="hammer-arm absolute top-0 right-4 w-32 h-32 flex items-end justify-end">
                 <div className="w-4 h-24 bg-gray-700 -rotate-45 rounded-full relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-8 bg-gray-400 rounded-sm shadow-lg border-b-4 border-gray-600"></div>
                 </div>
            </div>

            {/* Sparks */}
            <div className="absolute bottom-16 left-1/2">
                {[...Array(6)].map((_, i) => (
                    <div 
                        key={i} 
                        className="spark" 
                        style={{ 
                            '--tx': `${(Math.random() - 0.5) * 100}px` as any, 
                            '--ty': `${-50 - Math.random() * 50}px` as any,
                            animationDelay: `${Math.random()}s`
                        }} 
                    />
                ))}
            </div>
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600 uppercase tracking-widest animate-pulse">
            Forging Sentence
          </h2>
          <p className="text-gray-500 text-sm mt-2 font-mono">Tempering Grammar...</p>
        </div>
      </div>

      {/* Grid overlay for texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
    </div>
  );
};
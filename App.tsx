import React, { useState } from 'react';
import { GameSetup } from './components/GameSetup';
import { GameScreen } from './components/GameScreen';
import { GameSettings } from './types';

const App: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState<GameSettings | null>(null);

  const handleStartGame = (newSettings: GameSettings) => {
    setSettings(newSettings);
    setIsPlaying(true);
  };

  const handleExitGame = () => {
    setIsPlaying(false);
    setSettings(null);
  };

  return (
    <div className="antialiased text-gray-900">
      {!isPlaying ? (
        <GameSetup onStart={handleStartGame} />
      ) : (
        settings && <GameScreen settings={settings} onExit={handleExitGame} />
      )}
    </div>
  );
};

export default App;
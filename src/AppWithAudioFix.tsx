import React, { useEffect, useState } from 'react';
import { CircularWaveform } from './CircularWaveform';
import { useAudioLevel } from './hooks/useAudioLevel';
import { resumeAudioContext } from './hooks/resumeAudioContext';

export default function AppWithAudioFix() {
  const [isMicActive, setIsMicActive] = useState(false);
  const { audioLevel, isSpeaking } = useAudioLevel(isMicActive);

  useEffect(() => {
    const unlockAudioContext = () => {
      resumeAudioContext();
      window.removeEventListener('click', unlockAudioContext);
      window.removeEventListener('touchstart', unlockAudioContext);
    };

    window.addEventListener('click', unlockAudioContext);
    window.addEventListener('touchstart', unlockAudioContext);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-2xl mb-4">NOVA 1000™ Audio Debug</h1>

      <button
        onClick={() => setIsMicActive(prev => !prev)}
        className={`px-6 py-3 rounded-full font-semibold mb-6 transition ${
          isMicActive ? 'bg-red-600' : 'bg-green-600'
        }`}
      >
        {isMicActive ? 'Deactivate Mic' : 'Activate Mic'}
      </button>

      <CircularWaveform
        isActive={isMicActive || isSpeaking}
        isUserInput={isMicActive && !isSpeaking}
        audioLevel={audioLevel}
        size={220}
      />

      <div className="mt-6 text-center">
        <p>🎤 Mic Active: <strong>{isMicActive ? 'Yes' : 'No'}</strong></p>
        <p>📊 Audio Level: <strong>{audioLevel.toFixed(4)}</strong></p>
        <p>🗣️ Is Speaking: <strong>{isSpeaking ? 'Yes' : 'No'}</strong></p>
      </div>
    </div>
  );
}

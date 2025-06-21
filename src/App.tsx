import React, { useState, useEffect, useRef } from 'react';
import { VoiceControls } from './components/VoiceControls';
import { ChatMessage } from './components/ChatMessage';
import { LoadingScreen } from './components/LoadingScreen';
import { TextInput } from './components/TextInput';
import { CircularWaveform } from './components/CircularWaveform';
import { MenuOverlay } from './components/MenuOverlay';
import { useChat } from './hooks/useChat';
import { useAudioLevel } from './hooks/useAudioLevel';
import { resumeAudioContext } from './hooks/resumeAudioContext';
import { forceIOSSpeechPriming } from './hooks/iosSpeechPriming';
import { Volume2, Plus, Menu } from 'lucide-react';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { messages, processMessage } = useChat();
  const { isSpeaking, stopSpeaking, speakWithAnalysis, audioLevel, isUserSpeaking } = useAudioLevel(isListening);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastProcessedMessageRef = useRef<string>('');

  const [isIOS, setIsIOS] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      setIsDesktop(window.innerWidth >= 768);
    };

    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDesktop) return;
      if (e.key === 'Escape' && isSpeaking) {
        stopSpeaking();
      }
      if (e.key === ' ' && e.ctrlKey) {
        e.preventDefault();
        setIsListening(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktop, isSpeaking, isListening, stopSpeaking]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (messagesEndRef.current && chatContainerRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isProcessing]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const primeAudio = () => {
      resumeAudioContext();
      forceIOSSpeechPriming();
      window.removeEventListener('click', primeAudio);
    };
    window.addEventListener('click', primeAudio);
    return () => window.removeEventListener('click', primeAudio);
  }, []);

  const handleVoiceInput = (text: string) => {
    setInputValue(text);
    processMessage(text);
    setInputValue('');
  };

  const handleSpeechStart = () => setIsProcessing(true);
  const handleSpeechEnd = () => setIsProcessing(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      processMessage(inputValue);
      setInputValue('');
    }
  };

  const handleTextSubmit = (text: string) => {
    if (text.trim()) {
      processMessage(text);
    }
  };

  const speakLastMessage = async () => {
    await resumeAudioContext();
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    const lastAiMessage = messages.filter(m => !m.isUser).pop();
    if (lastAiMessage) {
      speakWithAnalysis(lastAiMessage.text);
    }
  };

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && !lastMessage.isUser && lastMessage.id !== lastProcessedMessageRef.current && !isSpeaking && messages.length >= 2) {
      lastProcessedMessageRef.current = lastMessage.id;
      setTimeout(() => {
        resumeAudioContext().then(() => speakWithAnalysis(lastMessage.text));
      }, 800);
    }
  }, [messages, isSpeaking, speakWithAnalysis]);

  if (isLoading) return <LoadingScreen progress={loadingProgress} />;

  return (
    <>
      <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden" style={{ height: `${viewportHeight}px` }}>
        {/* Circular Waveform and Logo Section */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center pt-4 sm:pt-6 pb-3 sm:pb-4 mobile-safe-top">
          {/* Circular Waveform - Now with dynamic audio level for both user and AI */}
          <div className="mb-3 sm:mb-4">
            <CircularWaveform 
              isActive={isListening || isSpeaking} 
              isUserInput={isListening && !isSpeaking}
              audioLevel={audioLevel} // Pass audio level for both user input and AI speech
              size={isDesktop ? 200 : 160}
              className="mx-auto"
            />
          </div>
          
          {/* NOVA 1000 Logo */}
          <div className="text-center">
            <h1 className="text-2xl pl-3 sm:text-4xl md:text-5xl font-light tracking-wider text-white ml-2 sm:ml-0">
              NOVA 1000<span className="text-xs sm:text-sm align-top ml-1 text-gray-400">™</span>
            </h1>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 min-h-0">
          <div className="h-full flex flex-col">
            <div ref={chatContainerRef} className="flex-1 px-4 py-4 overflow-y-auto scrollbar-hide min-h-0">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message.text} isUser={message.isUser} timestamp={message.timestamp} />
              ))}
              {isProcessing && (
                <div className="flex justify-end mb-6">
                  <div className="bg-slate-800/80 px-4 py-3 rounded-2xl max-w-xs">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100" />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Controls */}
            <div className="flex-shrink-0 px-4 pb-6 sm:pb-4">
              <div className="mb-4">
                <TextInput
                  onSubmit={handleTextSubmit}
                  placeholder="Message NOVA 1000™"
                  disabled={isProcessing}
                />
              </div>

              <div className="flex items-center justify-between mb-4 sm:mb-0">
                <div className="flex items-center space-x-3">
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </div>

                {/* Voice Controls */}
                <div className="flex items-center space-x-10 relative pl-2">
                  {!isDesktop && isIOS && permissionStatus === 'denied' && (
                    <div className="absolute bottom-full right-0 mb-2 text-center text-red-400 text-xs bg-slate-800/90 px-3 py-2 rounded-lg whitespace-nowrap">
                      🎤 Microphone blocked.{' '}
                      <a href="/mic-access" className="underline text-blue-300 hover:text-blue-400">
                        Tap here to enable
                      </a>
                    </div>
                  )}

                  <VoiceControls
                    onVoiceInput={handleVoiceInput}
                    onSpeechStart={handleSpeechStart}
                    onSpeechEnd={handleSpeechEnd}
                    isListening={isListening}
                    setIsListening={setIsListening}
                    permissionStatusCallback={setPermissionStatus}
                  />

                  <button
                    type="button"
                    onClick={speakLastMessage}
                    className={`p-3 rounded-full transition-all duration-300 ${
                      isSpeaking
                        ? 'text-blue-400 bg-blue-500/20'
                        : 'text-gray-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60'
                    }`}
                    title={isSpeaking ? 'Stop speaking' : 'Speak last response'}
                  >
                    <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex-shrink-0 text-center pb-2" style={{ minHeight: '40px' }}>
          {(isSpeaking || isListening) && (
            <div className="flex flex-col items-center justify-center py-2">
              <p className={`text-xs animate-pulse ${
                isSpeaking ? 'text-blue-400' : 'text-emerald-400'
              }`}>
                {isSpeaking ? 'NOVA 1000™ is speaking...' : isUserSpeaking ? 'Voice detected...' : 'Listening...'}
              </p>
              <div className="flex justify-center mt-1 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full animate-pulse ${
                      isSpeaking ? 'bg-blue-500 h-2' : 'bg-emerald-500'
                    }`}
                    style={{ 
                      animationDelay: `${i * 0.1}s`,
                      height: isListening && !isSpeaking ? `${4 + audioLevel * 8}px` : '8px'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 text-center py-2 text-gray-500 text-sm">
          <p>Powered by the Dimensional Integrity Engine</p>
        </div>
      </div>

      {/* Menu Overlay */}
      <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}

export default App;
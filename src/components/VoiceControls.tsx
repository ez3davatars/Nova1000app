import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square } from 'lucide-react';

interface VoiceControlsProps {
  onVoiceInput: (text: string) => void;
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  permissionStatusCallback?: (status: 'unknown' | 'granted' | 'denied') => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  onVoiceInput,
  onSpeechStart,
  onSpeechEnd,
  isListening,
  setIsListening,
  permissionStatusCallback
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [isInitializing, setIsInitializing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isStartingRef = useRef(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setIsSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setIsPressed(true);
      setIsInitializing(false);
      isStartingRef.current = false;
      onSpeechStart();
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) onVoiceInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsPressed(false);
      setIsInitializing(false);
      isStartingRef.current = false;
      onSpeechEnd();
      cleanupMedia();
    };

    recognition.onerror = (event: any) => {
      setPermissionStatus('denied');
      setIsListening(false);
      setIsPressed(false);
      setIsInitializing(false);
      onSpeechEnd();
      cleanupMedia();
    };

    recognitionRef.current = recognition;
  }, [onVoiceInput, onSpeechStart, onSpeechEnd, setIsListening]);

  useEffect(() => {
    if (permissionStatusCallback) {
      permissionStatusCallback(permissionStatus);
    }
  }, [permissionStatus, permissionStatusCallback]);

  const cleanupMedia = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setPermissionStatus('granted');
      return true;
    } catch {
      setPermissionStatus('denied');
      return false;
    }
  };

  const startListening = async () => {
    if (!recognitionRef.current || isListening || isStartingRef.current) return;
    setIsInitializing(true);
    isStartingRef.current = true;
    const allowed = await requestMic();
    if (!allowed) {
      setIsInitializing(false);
      return;
    }
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current && (isListening || isStartingRef.current)) {
      recognitionRef.current.stop();
    }
    cleanupMedia();
    setIsInitializing(false);
    setIsListening(false);
    isStartingRef.current = false;
  };

  if (!isSupported) {
    return (
      <div className="p-3 text-gray-600 rounded-full bg-slate-800/60">
        <Mic className="w-5 h-5" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      disabled={isInitializing}
      className={`p-3 rounded-full transition-all duration-300 ${
        isListening
          ? 'text-white bg-slate-700/60'
          : isInitializing
          ? 'text-yellow-400 bg-slate-800/60 animate-pulse'
          : 'text-gray-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60'
      }`}
      title={isListening ? 'Stop listening' : isInitializing ? 'Initializing...' : 'Start voice input'}
    >
      {isListening ? (
        <Square className="w-5 h-5" />
      ) : isInitializing ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
};
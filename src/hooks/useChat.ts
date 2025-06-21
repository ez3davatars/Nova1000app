import { useState, useCallback } from 'react';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);

  const addMessage = useCallback((text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const processMessage = useCallback(async (userMessage: string) => {
    setIsProcessing(true);
    addMessage(userMessage, true);

    // Simulate AI processing
    setTimeout(() => {
      const responses = [
        "I understand your question. Let me help you with that.",
        "That's an interesting point. Here's what I think about it.",
        "Based on your input, I can provide you with some insights.",
        "I'm processing your request. Here's my response.",
        "Thank you for your question. Let me address that for you."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addMessage(randomResponse, false);
      setIsProcessing(false);
    }, 1500);
  }, [addMessage]);

  return {
    messages,
    isProcessing,
    addMessage,
    processMessage
  };
};
import { useState } from 'react';

interface ChatMessageData {
  id: string;
  text: string;
  isUser: boolean;
  timestamp?: Date;
}

async function getGPTResponse(prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response generated.";
}

async function speakWithElevenLabs(text: string): Promise<void> {
  window.speechSynthesis.cancel(); // Stop any system TTS

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${import.meta.env.VITE_ELEVEN_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': import.meta.env.VITE_ELEVEN_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  const blob = await response.blob();
  const audioUrl = URL.createObjectURL(blob);
  const audio = new Audio(audioUrl);
  audio.play();
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const append = async (input: string) => {
    setIsLoading(true);

    const userMessage: ChatMessageData = {
      id: generateId(),
      text: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await getGPTResponse(input);

      const aiMessage: ChatMessageData = {
        id: generateId(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      await speakWithElevenLabs(response);
    } catch (error) {
      console.error("AI processing failed:", error);
      const fallback = "I'm having trouble processing your request right now.";

      const fallbackMessage: ChatMessageData = {
        id: generateId(),
        text: fallback,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fallbackMessage]);
    }

    setIsLoading(false);
  };

  return {
    messages,
    isLoading,
    processMessage: append
  };
}

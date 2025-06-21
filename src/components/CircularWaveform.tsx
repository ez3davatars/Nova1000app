import React, { useEffect, useRef } from 'react';

interface CircularWaveformProps {
  isActive: boolean;
  isUserInput?: boolean;
  audioLevel?: number;
  className?: string;
  size?: number;
}

export const CircularWaveform: React.FC<CircularWaveformProps> = ({ 
  isActive, 
  isUserInput = false,
  audioLevel = 0,
  className = "",
  size = 200
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4; // Inner radius for waveform
    const frameRadius = size * 0.45; // Outer frame radius

    const animate = () => {
      // Slower time increment for more gentle animation
      timeRef.current += 0.04; // Reduced from 0.08 to 0.04 (50% slower)
      
      // Clear canvas
      ctx.clearRect(0, 0, size, size);
      
      // Draw the circular frame with gradient
      drawCircularFrame(ctx, centerX, centerY, frameRadius, isActive, isUserInput);
      
      // Draw the waveform inside the circle
      if (isUserInput) {
        drawCircularUserWaveform(ctx, centerX, centerY, radius, timeRef.current, isActive, audioLevel);
      } else {
        drawCircularAIWaveform(ctx, centerX, centerY, radius, timeRef.current, isActive, audioLevel);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, isUserInput, size, audioLevel]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
      
      {/* Outer glow effect when active */}
      {isActive && (
        <>
          <div className={`absolute inset-0 rounded-full blur-lg animate-pulse ${
            isUserInput 
              ? 'bg-gradient-to-r from-emerald-500/20 via-emerald-400/30 to-emerald-500/20' 
              : 'bg-gradient-to-r from-blue-500/20 via-cyan-400/30 to-blue-500/20'
          }`} />
          <div className={`absolute inset-0 rounded-full blur-xl animate-pulse ${
            isUserInput 
              ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-400/20 to-emerald-500/10' 
              : 'bg-gradient-to-r from-blue-500/10 via-cyan-400/20 to-blue-500/10'
          }`} style={{ animationDelay: '0.5s' }} />
        </>
      )}
    </div>
  );
};

// Draw the circular frame with gradient
function drawCircularFrame(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  isActive: boolean,
  isUserInput: boolean
) {
  // Create gradient for the frame
  const gradient = ctx.createLinearGradient(
    centerX - radius, centerY - radius,
    centerX + radius, centerY + radius
  );
  
  if (isUserInput) {
    // Green gradient for user input
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)'); // emerald-500
    gradient.addColorStop(0.25, 'rgba(52, 211, 153, 0.8)'); // emerald-400
    gradient.addColorStop(0.5, 'rgba(16, 185, 129, 1)'); // emerald-500
    gradient.addColorStop(0.75, 'rgba(52, 211, 153, 0.8)'); // emerald-400
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.3)'); // emerald-500
  } else {
    // Blue gradient for AI
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)'); // blue-500
    gradient.addColorStop(0.25, 'rgba(34, 211, 238, 0.8)'); // cyan-400
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 1)'); // blue-500
    gradient.addColorStop(0.75, 'rgba(34, 211, 238, 0.8)'); // cyan-400
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.3)'); // blue-500
  }

  // Draw the frame
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = isActive ? 3 : 2;
  ctx.stroke();

  // Add inner glow when active
  if (isActive) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
    ctx.strokeStyle = isUserInput 
      ? 'rgba(52, 211, 153, 0.3)' 
      : 'rgba(34, 211, 238, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// Draw AI waveform inside the circle - ALWAYS HAS SUBTLE FLOW + AUDIO RESPONSIVE
function drawCircularAIWaveform(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  isActive: boolean,
  audioLevel: number
) {
  // Save context for clipping
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 1, 0, Math.PI * 2);
  ctx.clip();

  const numWaves = 6;
  
  for (let waveIndex = 0; waveIndex < numWaves; waveIndex++) {
    ctx.beginPath();
    
    // ALWAYS show subtle flowing waves (never completely flat) - slower movement
    const baseAmplitude = 5 + Math.sin(time * 0.8 + waveIndex * 0.5) * 3; // Reduced from 1.5 to 0.8
    
    // Audio-responsive amplitude that scales with actual speech - slower movement
    const audioAmplitude = audioLevel > 0.01 ? 25 + Math.sin(time * 1.5 + waveIndex * 0.5) * 20 * audioLevel : 0; // Reduced from 3 to 1.5
    
    // Combine base flow + audio response
    const dynamicAmplitude = baseAmplitude + audioAmplitude;
    
    const frequency = 0.015 + waveIndex * 0.002;
    const phase = time * 1.0 + waveIndex * 0.6; // Reduced from 2.0 to 1.0
    
    // Opacity: always visible with subtle flow, brighter when speaking - slower changes
    const baseOpacity = 0.3 + Math.sin(time * 1.2 + waveIndex * 0.8) * 0.15; // Reduced from 2.5 to 1.2
    const audioOpacity = audioLevel > 0.01 ? 0.3 + Math.sin(time * 1.2 + waveIndex * 0.8) * 0.25 : 0; // Reduced from 2.5 to 1.2
    const totalOpacity = Math.min(1, baseOpacity + audioOpacity);
    
    ctx.strokeStyle = `rgba(59, 130, 246, ${totalOpacity})`;
    ctx.lineWidth = isActive ? 2 : 1;
    
    const startX = centerX - radius + 1;
    const endX = centerX + radius - 1;
    
    for (let x = startX; x <= endX; x += 2) {
      const y = centerY + 
        Math.sin(x * frequency + phase) * dynamicAmplitude * 
        Math.sin(time * 0.6 + waveIndex * 0.3); // Reduced from 1.2 to 0.6
      
      if (x === startX) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }

  // Add flowing particles only when there's significant audio - slower movement
  if (audioLevel > 0.1) {
    const numParticles = 12;
    for (let i = 0; i < numParticles; i++) {
      const x = (time * 25 + i * 30) % (radius * 2 - 2) + (centerX - radius + 1); // Reduced from 50 to 25
      const y = centerY + Math.sin(x * 0.01 + time * 0.5 + i) * (15 + audioLevel * 20); // Reduced time multiplier from 1 to 0.5
      
      const particleOpacity = Math.sin(time * 1.0 + i) * 0.3 + (audioLevel * 0.4); // Reduced from 2 to 1.0
      ctx.fillStyle = `rgba(34, 211, 238, ${Math.min(1, particleOpacity)})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// Draw user input waveform inside the circle - VOICE RESPONSIVE
function drawCircularUserWaveform(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  isActive: boolean,
  audioLevel: number
) {
  // Save context for clipping
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 1, 0, Math.PI * 2);
  ctx.clip();

  const numWaves = 6;
  
  for (let waveIndex = 0; waveIndex < numWaves; waveIndex++) {
    ctx.beginPath();
    
    // Base amplitude for idle flow (subtle movement)
    const baseAmplitude = 5;
    
    // Voice-responsive amplitude (stronger when speaking) - slower movement
    const dynamicAmplitude = audioLevel > 0.01 ? 25 + Math.sin(time * 1.2 + waveIndex * 0.4) * 18 * audioLevel : baseAmplitude; // Reduced from 2.5 to 1.2
    
    const frequency = 0.015 + waveIndex * 0.002;
    const phase = time * 0.9 + waveIndex * 0.5; // Reduced from 1.8 to 0.9
    
    // Opacity: subtle when idle, bright when speaking - slower changes
    const opacity = audioLevel > 0.01 ? 0.4 + Math.sin(time * 1.0 + waveIndex * 0.6) * 0.3 : 0.2; // Reduced from 2 to 1.0
    
    ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
    ctx.lineWidth = isActive ? 2 : 1;
    
    const startX = centerX - radius + 1;
    const endX = centerX + radius - 1;
    
    for (let x = startX; x <= endX; x += 2) {
      const y = centerY + 
        Math.sin(x * frequency + phase) * dynamicAmplitude * 
        Math.sin(time * 0.4 + waveIndex * 0.25); // Reduced from 0.8 to 0.4
      
      if (x === startX) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Add glow effect for loud voice input
    if (isActive && dynamicAmplitude > 30) {
      ctx.strokeStyle = `rgba(52, 211, 153, ${opacity * 0.4})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }

  // Add voice-responsive particles - slower movement
  if (audioLevel > 0.1) {
    const numParticles = 15;
    for (let i = 0; i < numParticles; i++) {
      const x = (time * 30 + i * 25) % (radius * 2 - 2) + (centerX - radius + 1); // Reduced from 60 to 30
      const y = centerY + Math.sin(x * 0.012 + time * 0.75 + i * 0.8) * (12 + audioLevel * 25); // Reduced from 1.5 to 0.75
      
      const particleOpacity = Math.sin(time * 1.2 + i * 0.7) * 0.4 + (audioLevel * 0.5); // Reduced from 2.5 to 1.2
      ctx.fillStyle = `rgba(52, 211, 153, ${Math.min(1, particleOpacity)})`;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
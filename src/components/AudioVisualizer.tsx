import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../utils/audioEngine';
import { BarChart3, Waves, CircleDot } from 'lucide-react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  accentColor?: string;
  secondaryColor?: string;
  mode?: 'bars' | 'wave' | 'circle';
  height?: number;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  accentColor = '#06b6d4',
  secondaryColor = '#ec4899',
  mode: initialMode = 'bars',
  height = 90,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'bars' | 'wave' | 'circle'>(initialMode);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // HiDPI backing store setup
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width > 0 ? rect.width : 400;
    const displayHeight = height;

    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);
    ctx.scale(dpr, dpr);

    const analyser = audioEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    // Pre-cache bar gradient to avoid re-allocating inside the render loop
    let cachedBarGradient: CanvasGradient | null = null;
    let cachedWaveGradient: CanvasGradient | null = null;
    let lastWidth = displayWidth;
    let lastHeight = displayHeight;

    const getBarGradient = () => {
      if (!cachedBarGradient || lastWidth !== displayWidth || lastHeight !== displayHeight) {
        cachedBarGradient = ctx.createLinearGradient(0, displayHeight, 0, 0);
        cachedBarGradient.addColorStop(0, accentColor);
        cachedBarGradient.addColorStop(1, secondaryColor);
      }
      return cachedBarGradient;
    };

    const getWaveGradient = () => {
      if (!cachedWaveGradient || lastWidth !== displayWidth) {
        cachedWaveGradient = ctx.createLinearGradient(0, 0, displayWidth, 0);
        cachedWaveGradient.addColorStop(0, accentColor);
        cachedWaveGradient.addColorStop(1, secondaryColor);
      }
      return cachedWaveGradient;
    };

    const render = () => {
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      if (isPlaying && analyser) {
        audioEngine.getVisualizerData(freqData, timeData);
      } else {
        // Ambient resting bars when paused
        for (let i = 0; i < bufferLength; i++) {
          freqData[i] = 10;
          timeData[i] = 128;
        }
      }

      if (mode === 'bars') {
        const barCount = 42;
        const barWidth = (displayWidth / barCount) * 0.72;
        const gap = (displayWidth / barCount) * 0.28;
        const barGrad = getBarGradient();
        ctx.fillStyle = barGrad;

        for (let i = 0; i < barCount; i++) {
          const index = Math.floor((i / barCount) * (bufferLength * 0.7));
          const val = freqData[index] || 0;
          const barHeight = Math.max(4, (val / 255) * displayHeight * 0.95);
          const x = i * (barWidth + gap) + gap / 2;
          const y = displayHeight - barHeight;
          const radius = Math.min(barWidth / 2, 4);

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
          ctx.fill();

          // Top highlight glowing cap without re-pathing
          if (val > 110) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 1, y - 2, barWidth - 2, 2);
            ctx.fillStyle = barGrad;
          }
        }
      } else if (mode === 'wave') {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = getWaveGradient();
        ctx.beginPath();

        const sliceWidth = displayWidth / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * displayHeight) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(displayWidth, displayHeight / 2);
        ctx.stroke();
      } else if (mode === 'circle') {
        const centerX = displayWidth / 2;
        const centerY = displayHeight / 2;
        const baseRadius = Math.min(displayWidth, displayHeight) * 0.28;

        ctx.beginPath();
        const numPoints = 48;
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const dataIdx = Math.floor((i / numPoints) * (bufferLength * 0.6));
          const amp = ((freqData[dataIdx] || 0) / 255) * 16;
          const r = baseRadius + amp;

          const px = centerX + Math.cos(angle) * r;
          const py = centerY + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        const grad = ctx.createRadialGradient(
          centerX,
          centerY,
          baseRadius * 0.5,
          centerX,
          centerY,
          baseRadius * 1.5
        );
        grad.addColorStop(0, accentColor);
        grad.addColorStop(1, secondaryColor);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Schedule next frame ONLY if playing, analyzer active, and document is visible
      if (isPlaying && analyser && !document.hidden) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameRef.current !== null) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
      } else if (isPlaying && analyser) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    render();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying, accentColor, secondaryColor, mode, height]);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl will-change-transform transform-gpu"
        style={{ transform: 'translateZ(0)' }}
      />
      <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black/40 backdrop-blur-md rounded-lg p-1 border border-white/10 opacity-70 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setMode('bars')}
          className={`p-1 rounded ${mode === 'bars' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white'}`}
          title="Frequency Bars"
        >
          <BarChart3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setMode('wave')}
          className={`p-1 rounded ${mode === 'wave' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white'}`}
          title="Waveform"
        >
          <Waves className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setMode('circle')}
          className={`p-1 rounded ${mode === 'circle' ? 'bg-white/20 text-white' : 'text-zinc-400 hover:text-white'}`}
          title="Circular Pulse"
        >
          <CircleDot className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

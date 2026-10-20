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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'bars' | 'wave' | 'circle'>(initialMode);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);

      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);

      if (isPlaying && analyser) {
        audioEngine.getVisualizerData(freqData, timeData);
      } else {
        // Subtle ambient idle wave when paused
        const time = Date.now() / 1000;
        for (let i = 0; i < bufferLength; i++) {
          freqData[i] = Math.sin(time * 2 + i * 0.2) * 8 + 12;
          timeData[i] = 128 + Math.sin(time * 3 + i * 0.3) * 6;
        }
      }

      if (mode === 'bars') {
        const barCount = 42;
        const barWidth = (width / barCount) * 0.75;
        const gap = (width / barCount) * 0.25;

        for (let i = 0; i < barCount; i++) {
          const index = Math.floor((i / barCount) * (bufferLength * 0.7));
          const val = freqData[index] || 0;
          const barHeight = Math.max(4, (val / 255) * h * 0.95);

          const gradient = ctx.createLinearGradient(0, h, 0, h - barHeight);
          gradient.addColorStop(0, accentColor);
          gradient.addColorStop(1, secondaryColor);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          const x = i * (barWidth + gap) + gap / 2;
          const y = h - barHeight;
          const radius = Math.min(barWidth / 2, 4);

          // Rounded top bar
          ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
          ctx.fill();

          // Top highlight glowing cap
          if (val > 100) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 1, y - 2, barWidth - 2, 2);
          }
        }
      } else if (mode === 'wave') {
        ctx.lineWidth = 3;
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, accentColor);
        gradient.addColorStop(1, secondaryColor);
        ctx.strokeStyle = gradient;
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * h) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, h / 2);
        ctx.stroke();

        // Soft glow shadow
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 12;
      } else if (mode === 'circle') {
        const centerX = width / 2;
        const centerY = h / 2;
        const baseRadius = Math.min(width, h) * 0.28;

        ctx.beginPath();
        const numPoints = 64;
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const dataIdx = Math.floor((i / numPoints) * (bufferLength * 0.6));
          const amp = ((freqData[dataIdx] || 0) / 255) * 18;
          const r = baseRadius + amp;

          const px = centerX + Math.cos(angle) * r;
          const py = centerY + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        const grad = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, baseRadius * 1.5);
        grad.addColorStop(0, accentColor);
        grad.addColorStop(1, secondaryColor);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, accentColor, secondaryColor, mode]);

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={400}
        height={height}
        className="w-full h-full rounded-xl transition-all"
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

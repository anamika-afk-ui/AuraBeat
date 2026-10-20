import React, { useRef, useState, useCallback, useEffect } from 'react';
import { formatTime } from '../utils/lyricsParser';

interface SparkProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isPlaying: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  accentColor?: string;
}

export const SparkProgressBar: React.FC<SparkProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
  isPlaying,
  className = '',
  size = 'md',
  accentColor = '#06b6d4',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; time: number } | null>(null);

  const displayTime = isDragging && dragTime !== null ? dragTime : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (displayTime / duration) * 100)) : 0;

  const calculateTimeFromX = useCallback(
    (clientX: number) => {
      if (!containerRef.current || duration <= 0) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const ratio = clickX / rect.width;
      return ratio * duration;
    },
    [duration]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (duration <= 0) return;
    const newTime = calculateTimeFromX(e.clientX);
    setIsDragging(true);
    setDragTime(newTime);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      const newTime = calculateTimeFromX(e.clientX);
      setDragTime(newTime);
    } else if (containerRef.current && duration > 0) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const time = (x / rect.width) * duration;
      setHoverPosition({ x, time });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      const finalTime = dragTime !== null ? dragTime : calculateTimeFromX(e.clientX);
      onSeek(finalTime);
      setIsDragging(false);
      setDragTime(null);
    }
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoverPosition(null);
    }
  };

  // Spark distribution markers along the covered distance
  const sparkPoints = [10, 25, 42, 60, 78, 92];

  const trackHeight = size === 'sm' ? 'h-1.5 group-hover:h-2.5' : size === 'lg' ? 'h-3 group-hover:h-3.5' : 'h-2 group-hover:h-3';
  const dotSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={`group relative w-full cursor-pointer select-none py-2 touch-none ${className}`}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={displayTime}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') onSeek(Math.min(duration, currentTime + 5));
        if (e.key === 'ArrowLeft') onSeek(Math.max(0, currentTime - 5));
      }}
    >
      {/* Background Track Rail */}
      <div
        className={`relative w-full ${trackHeight} bg-zinc-800/80 rounded-full overflow-visible transition-all duration-200 border border-white/5 backdrop-blur-sm`}
      >
        {/* Covered Distance with Glowing Cyan-to-Emerald Trail & Sparks */}
        <div
          className="absolute top-0 left-0 bottom-0 rounded-full transition-all duration-75 relative overflow-hidden"
          style={{
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #06b6d4 0%, #0ea5e9 35%, #10b981 75%, #34d399 100%)',
            boxShadow: '0 0 14px rgba(6, 182, 212, 0.7), 0 0 24px rgba(16, 185, 129, 0.4)',
          }}
        >
          {/* Animated Continuous Sparkle Shimmer along entire covered track */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-sweep" />

          {/* Spark Particles distributed across the covered distance ("jitna distance cover krega utna dur tak spark rhega") */}
          {sparkPoints.map((pt, idx) => {
            if (progressPercent < pt) return null;
            const isGreen = idx % 2 === 0;
            return (
              <span
                key={pt}
                className="absolute top-1/2 -translate-y-1/2 animate-spark-flicker pointer-events-none select-none text-[8px] font-black leading-none"
                style={{
                  left: `${(pt / progressPercent) * 100}%`,
                  color: isGreen ? '#6ee7b7' : '#7dd3fc',
                  textShadow: isGreen ? '0 0 6px #10b981, 0 0 10px #34d399' : '0 0 6px #06b6d4, 0 0 10px #38bdf8',
                  animationDelay: `${idx * 0.3}s`,
                }}
              >
                ✦
              </span>
            );
          })}
        </div>

        {/* Floating Sparks Behind the Scrubber Dot (Moving with dot timing) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-75 z-20"
          style={{ left: `${progressPercent}%` }}
        >
          {/* The Scrubber Dot */}
          <div
            className={`relative ${dotSize} rounded-full bg-white border-2 border-cyan-300 ring-2 ring-emerald-400 spark-dot-glow group-hover:scale-125 transition-transform duration-150 flex items-center justify-center`}
          >
            {/* Inner Core Dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
          </div>

          {/* Spark Particle Jet emitting backwards in Light Blue & Light Green */}
          {(isPlaying || isDragging) && (
            <div className="absolute top-1/2 -translate-y-1/2 right-full mr-1 pointer-events-none flex items-center">
              {/* Spark 1 (Light Cyan) */}
              <span
                className="absolute -top-3.5 right-1 animate-spark-float-1 text-[11px] font-bold"
                style={{ color: '#38bdf8', textShadow: '0 0 8px #38bdf8, 0 0 14px #06b6d4' }}
              >
                ✦
              </span>

              {/* Spark 2 (Spring Green) */}
              <span
                className="absolute top-1.5 right-3 animate-spark-float-2 text-[10px] font-bold"
                style={{ color: '#34d399', textShadow: '0 0 8px #34d399, 0 0 14px #10b981' }}
              >
                ✧
              </span>

              {/* Spark 3 (Mint / Aqua) */}
              <span
                className="absolute -top-1.5 right-5 animate-spark-float-3 text-[9px] font-bold"
                style={{ color: '#67e8f9', textShadow: '0 0 7px #67e8f9' }}
              >
                ✦
              </span>

              {/* Spark 4 (Emerald Green particle dot) */}
              <span
                className="absolute top-3 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-spark-float-4"
                style={{ boxShadow: '0 0 8px #34d399, 0 0 12px #10b981' }}
              />

              {/* Spark 5 (Sky Blue particle dot) */}
              <span
                className="absolute -top-2.5 right-6 w-1.5 h-1.5 rounded-full bg-cyan-300 animate-spark-float-2"
                style={{ boxShadow: '0 0 8px #38bdf8, 0 0 12px #06b6d4' }}
              />

              {/* Behind-the-dot subtle glowing spark trail mist */}
              <div
                className="w-12 h-2.5 rounded-full opacity-80 blur-[2px]"
                style={{
                  background: 'linear-gradient(270deg, rgba(56, 189, 248, 0.9), rgba(52, 211, 153, 0.7), transparent)',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Hover preview timestamp tooltip */}
      {hoverPosition && !isDragging && (
        <div
          className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md bg-zinc-900 border border-white/20 text-[10px] font-mono text-cyan-300 shadow-xl pointer-events-none z-30"
          style={{ left: `${hoverPosition.x}px` }}
        >
          {formatTime(hoverPosition.time)}
        </div>
      )}

      {/* Dragging preview timestamp tooltip */}
      {isDragging && dragTime !== null && (
        <div
          className="absolute -top-8 -translate-x-1/2 px-2.5 py-1 rounded-md bg-zinc-900/95 border border-cyan-400/50 text-[11px] font-mono font-bold text-emerald-300 shadow-2xl pointer-events-none z-30 animate-pulse"
          style={{ left: `${progressPercent}%` }}
        >
          {formatTime(dragTime)}
        </div>
      )}
    </div>
  );
};

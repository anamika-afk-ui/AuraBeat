import React, { useRef, useState, useCallback, useMemo } from 'react';
import { formatTime } from '../utils/lyricsParser';

export interface SparkColorPalette {
  id: string;
  name: string;
  trackGradient: string;
  trackGlow: string;
  dotBorder: string;
  dotRing: string;
  dotCore: string;
  dotShadow: string;
  sparkColors: string[];
  sparkShadows: string[];
  mistGradient: string;
}

export const SPARK_COLOR_PALETTES: SparkColorPalette[] = [
  // 1. Neon Electric Cyan & Emerald Mint
  {
    id: 'cyan_emerald',
    name: 'Neon Cyan & Emerald',
    trackGradient: 'linear-gradient(90deg, #06b6d4 0%, #0ea5e9 35%, #10b981 75%, #34d399 100%)',
    trackGlow: '0 0 14px rgba(6, 182, 212, 0.8), 0 0 24px rgba(16, 185, 129, 0.6)',
    dotBorder: '#67e8f9',
    dotRing: 'ring-emerald-400',
    dotCore: '#06b6d4',
    dotShadow: '0 0 16px #06b6d4, 0 0 28px #10b981',
    sparkColors: ['#6ee7b7', '#7dd3fc', '#34d399', '#38bdf8'],
    sparkShadows: [
      '0 0 8px #10b981, 0 0 16px #34d399',
      '0 0 8px #06b6d4, 0 0 16px #38bdf8',
    ],
    mistGradient: 'linear-gradient(270deg, rgba(56, 189, 248, 0.95), rgba(52, 211, 153, 0.8), transparent)',
  },
  // 2. Cosmic Violet & Electric Pink
  {
    id: 'cosmic_violet_pink',
    name: 'Cosmic Violet & Pink',
    trackGradient: 'linear-gradient(90deg, #8b5cf6 0%, #a855f7 35%, #ec4899 75%, #f472b6 100%)',
    trackGlow: '0 0 14px rgba(139, 92, 246, 0.8), 0 0 24px rgba(236, 72, 153, 0.6)',
    dotBorder: '#e879f9',
    dotRing: 'ring-pink-400',
    dotCore: '#a855f7',
    dotShadow: '0 0 16px #a855f7, 0 0 28px #ec4899',
    sparkColors: ['#f472b6', '#c084fc', '#fbcfe8', '#e879f9'],
    sparkShadows: [
      '0 0 8px #ec4899, 0 0 16px #f472b6',
      '0 0 8px #8b5cf6, 0 0 16px #c084fc',
    ],
    mistGradient: 'linear-gradient(270deg, rgba(236, 72, 153, 0.95), rgba(168, 85, 247, 0.8), transparent)',
  },
  // 3. Blazing Sunburst & Fiery Amber
  {
    id: 'blazing_amber',
    name: 'Blazing Amber & Gold',
    trackGradient: 'linear-gradient(90deg, #ea580c 0%, #f97316 35%, #eab308 75%, #fde047 100%)',
    trackGlow: '0 0 14px rgba(249, 115, 22, 0.8), 0 0 24px rgba(234, 179, 8, 0.6)',
    dotBorder: '#fed7aa',
    dotRing: 'ring-amber-400',
    dotCore: '#ea580c',
    dotShadow: '0 0 16px #f97316, 0 0 28px #eab308',
    sparkColors: ['#fdba74', '#fde047', '#fb923c', '#fef08a'],
    sparkShadows: [
      '0 0 8px #f97316, 0 0 16px #fb923c',
      '0 0 8px #eab308, 0 0 16px #fde047',
    ],
    mistGradient: 'linear-gradient(270deg, rgba(249, 115, 22, 0.95), rgba(234, 179, 8, 0.8), transparent)',
  },
  // 4. Laser Crimson & Radiant Coral
  {
    id: 'laser_crimson',
    name: 'Laser Crimson & Coral',
    trackGradient: 'linear-gradient(90deg, #e11d48 0%, #f43f5e 35%, #fb7185 75%, #fda4af 100%)',
    trackGlow: '0 0 14px rgba(225, 29, 72, 0.8), 0 0 24px rgba(251, 113, 133, 0.6)',
    dotBorder: '#fecdd3',
    dotRing: 'ring-rose-400',
    dotCore: '#e11d48',
    dotShadow: '0 0 16px #e11d48, 0 0 28px #f43f5e',
    sparkColors: ['#fda4af', '#f87171', '#fecdd3', '#fb7185'],
    sparkShadows: [
      '0 0 8px #e11d48, 0 0 16px #f43f5e',
      '0 0 8px #fb7185, 0 0 16px #fda4af',
    ],
    mistGradient: 'linear-gradient(270deg, rgba(244, 63, 94, 0.95), rgba(251, 113, 133, 0.8), transparent)',
  },
  // 5. Radioactive Acid Lime & Chartreuse
  {
    id: 'acid_lime',
    name: 'Radioactive Lime & Neon Green',
    trackGradient: 'linear-gradient(90deg, #65a30d 0%, #84cc16 35%, #a3e635 75%, #bef264 100%)',
    trackGlow: '0 0 14px rgba(132, 204, 22, 0.8), 0 0 24px rgba(163, 230, 53, 0.6)',
    dotBorder: '#d9f99d',
    dotRing: 'ring-lime-400',
    dotCore: '#65a30d',
    dotShadow: '0 0 16px #84cc16, 0 0 28px #a3e635',
    sparkColors: ['#bef264', '#a3e635', '#d9f99d', '#84cc16'],
    sparkShadows: [
      '0 0 8px #65a30d, 0 0 16px #84cc16',
      '0 0 8px #a3e635, 0 0 16px #bef264',
    ],
    mistGradient: 'linear-gradient(270deg, rgba(132, 204, 22, 0.95), rgba(163, 230, 53, 0.8), transparent)',
  },
  // 6. Deep Ocean Aqua & Electric Turquoise
  {
    id: 'ocean_turquoise',
    name: 'Electric Turquoise & Deep Ocean',
    trackGradient: 'linear-gradient(90deg, #0d9488 0%, #14b8a6 35%, #2dd4bf 75%, #5eead4 100%)',
    trackGlow: '0 0 14px rgba(20, 184, 166, 0.8), 0 0 24px rgba(45, 212, 191, 0.6)',
    dotBorder: '#99f6e4',
    dotRing: 'ring-teal-400',
    dotCore: '#0d9488',
    dotShadow: '0 0 16px #14b8a6, 0 0 28px #2dd4bf',
    sparkColors: ['#5eead4', '#2dd4bf', '#99f6e4', '#14b8a6'],
    sparkShadows: [
      '0 0 8px #0d9488, 0 0 16px #14b8a6',
      '0 0 8px #2dd4bf, 0 0 16px #5eead4',
    ],
    mistGradient: 'linear-gradient(270deg, rgba(20, 184, 166, 0.95), rgba(45, 212, 191, 0.8), transparent)',
  },
  // 7. Royal Sapphire & Laser Sky
  {
    id: 'royal_sapphire',
    name: 'Royal Sapphire & Laser Sky',
    trackGradient: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 35%, #60a5fa 75%, #93c5fd 100%)',
    trackGlow: '0 0 14px rgba(37, 99, 235, 0.8), 0 0 24px rgba(96, 165, 250, 0.6)',
    dotBorder: '#bfdbfe',
    dotRing: 'ring-blue-400',
    dotCore: '#2563eb',
    dotShadow: '0 0 16px #3b82f6, 0 0 28px #60a5fa',
    sparkColors: ['#93c5fd', '#60a5fa', '#bfdbfe', '#3b82f6'],
    sparkShadows: [
      '0 0 8px #2563eb, 0 0 16px #3b82f6',
      '0 0 8px #60a5fa, 0 0 16px #93c5fd',
    ],
    mistGradient: 'linear-gradient(270deg, rgba(59, 130, 246, 0.95), rgba(96, 165, 250, 0.8), transparent)',
  },
  // 8. Vivid Magenta & Hologram Indigo
  {
    id: 'hologram_magenta',
    name: 'Vivid Magenta & Indigo',
    trackGradient: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 35%, #c026d3 75%, #e879f9 100%)',
    trackGlow: '0 0 14px rgba(124, 58, 237, 0.8), 0 0 24px rgba(192, 38, 211, 0.6)',
    dotBorder: '#f0abfc',
    dotRing: 'ring-fuchsia-400',
    dotCore: '#7c3aed',
    dotShadow: '0 0 16px #7c3aed, 0 0 28px #c026d3',
    sparkColors: ['#e879f9', '#c084fc', '#f5d0fe', '#a855f7'],
    sparkShadows: [
      '0 0 8px #7c3aed, 0 0 16px #c026d3',
      '0 0 8px #c084fc, 0 0 16px #e879f9',
    ],
    mistGradient: 'linear-gradient(270deg, rgba(192, 38, 211, 0.95), rgba(124, 58, 237, 0.8), transparent)',
  },
];

export function getSongColorPalette(songId?: string, songTitle?: string): SparkColorPalette {
  const seed = `${songId || ''}_${songTitle || ''}`.trim() || 'default';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SPARK_COLOR_PALETTES.length;
  return SPARK_COLOR_PALETTES[index];
}

interface SparkProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isPlaying: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  accentColor?: string;
  songId?: string;
  songTitle?: string;
  palette?: SparkColorPalette;
}

// Generate continuous spark distribution points from 2% to 98%
const DENSE_SPARK_POINTS = Array.from({ length: 39 }, (_, i) => 2 + i * 2.5);

export const SparkProgressBar: React.FC<SparkProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
  isPlaying,
  className = '',
  size = 'md',
  accentColor = '#06b6d4',
  songId,
  songTitle,
  palette: explicitPalette,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; time: number } | null>(null);

  // Compute distinct dynamic color palette per song
  const palette = useMemo(() => {
    if (explicitPalette) return explicitPalette;
    return getSongColorPalette(songId, songTitle);
  }, [songId, songTitle, explicitPalette]);

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

  const trackHeight =
    size === 'sm'
      ? 'h-1.5 group-hover:h-2.5'
      : size === 'lg'
      ? 'h-3 group-hover:h-3.5'
      : 'h-2 group-hover:h-3';

  const dotSize =
    size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={`group relative w-full cursor-pointer select-none py-3 touch-none ${className}`}
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
        {/* 1. Covered Distance Glowing Bar from 0% to dot position */}
        <div
          className="absolute top-0 left-0 bottom-0 rounded-full overflow-hidden will-change-[width] transition-[background,box-shadow] duration-500"
          style={{
            width: `${progressPercent}%`,
            background: palette.trackGradient,
            boxShadow: palette.trackGlow,
          }}
        >
          {/* Animated Continuous Sparkle Shimmer along entire covered track */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer-sweep pointer-events-none" />
        </div>

        {/* 2. CONTINUOUS SPARK TRAIL: Always spans from Start Point (0%) to Dot Position */}
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {DENSE_SPARK_POINTS.map((pt, idx) => {
            // Only render sparks up to the current dot position
            if (pt > progressPercent) return null;

            const glyphs = ['✦', '✧', '⋆', '•'];
            const glyph = glyphs[idx % glyphs.length];

            // Stagger vertical offsets above, center, and below the bar
            const vOffsets = [
              '-top-3',
              'top-1/2 -translate-y-1/2',
              'top-2.5',
              '-top-1.5',
              'top-1',
            ];
            const vOffsetClass = vOffsets[idx % vOffsets.length];

            const color = palette.sparkColors[idx % palette.sparkColors.length];
            const shadow = palette.sparkShadows[idx % palette.sparkShadows.length];

            return (
              <span
                key={pt}
                className={`absolute ${vOffsetClass} -translate-x-1/2 animate-spark-flicker pointer-events-none select-none text-[9px] font-black leading-none gpu-accelerated`}
                style={{
                  left: `${pt}%`,
                  color,
                  textShadow: shadow,
                  animationDelay: `${(idx * 0.12) % 2}s`,
                  fontSize: idx % 3 === 0 ? '11px' : idx % 3 === 1 ? '9px' : '8px',
                }}
              >
                {glyph}
              </span>
            );
          })}
        </div>

        {/* 3. The Scrubber Dot + Emission Jet at Current Position */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-20 will-change-[left] gpu-accelerated"
          style={{ left: `${progressPercent}%` }}
        >
          {/* Main Scrubber Dot with Dynamic Per-Song Color */}
          <div
            className={`relative ${dotSize} rounded-full bg-white border-2 ${palette.dotRing} ring-2 group-hover:scale-125 transition-all duration-300 flex items-center justify-center`}
            style={{
              borderColor: palette.dotBorder,
              boxShadow: palette.dotShadow,
            }}
          >
            {/* Inner Core Dot */}
            <div
              className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
              style={{ backgroundColor: palette.dotCore }}
            />
          </div>

          {/* Spark Particle Jet emitting backwards from dot into the covered trail */}
          <div className="absolute top-1/2 -translate-y-1/2 right-full mr-0.5 pointer-events-none flex items-center gpu-accelerated">
            {/* Spark 1 */}
            <span
              className="absolute -top-3.5 right-1 animate-spark-float-1 text-[11px] font-bold"
              style={{
                color: palette.sparkColors[0] || '#38bdf8',
                textShadow: palette.sparkShadows[0] || '0 0 8px #38bdf8',
              }}
            >
              ✦
            </span>

            {/* Spark 2 */}
            <span
              className="absolute top-1.5 right-3 animate-spark-float-2 text-[10px] font-bold"
              style={{
                color: palette.sparkColors[1] || '#34d399',
                textShadow: palette.sparkShadows[1] || '0 0 8px #34d399',
              }}
            >
              ✧
            </span>

            {/* Spark 3 */}
            <span
              className="absolute -top-1.5 right-5 animate-spark-float-3 text-[9px] font-bold"
              style={{
                color: palette.sparkColors[2] || palette.sparkColors[0] || '#67e8f9',
                textShadow: palette.sparkShadows[0] || '0 0 7px #67e8f9',
              }}
            >
              ✦
            </span>

            {/* Spark 4 particle dot */}
            <span
              className="absolute top-3 right-2 w-1.5 h-1.5 rounded-full animate-spark-float-4"
              style={{
                backgroundColor: palette.sparkColors[0] || '#34d399',
                boxShadow: palette.sparkShadows[0] || '0 0 8px #34d399',
              }}
            />

            {/* Spark 5 particle dot */}
            <span
              className="absolute -top-2.5 right-6 w-1.5 h-1.5 rounded-full animate-spark-float-2"
              style={{
                backgroundColor: palette.sparkColors[1] || '#38bdf8',
                boxShadow: palette.sparkShadows[1] || '0 0 8px #38bdf8',
              }}
            />

            {/* Behind-the-dot subtle glowing spark trail mist */}
            <div
              className="w-14 h-2.5 rounded-full opacity-90 blur-[2px] transition-all duration-500"
              style={{
                background: palette.mistGradient,
              }}
            />
          </div>
        </div>
      </div>

      {/* Hover preview timestamp tooltip */}
      {hoverPosition && !isDragging && (
        <div
          className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md bg-zinc-900 border border-white/20 text-[10px] font-mono text-cyan-300 shadow-xl pointer-events-none z-30 will-change-[left]"
          style={{ left: `${hoverPosition.x}px` }}
        >
          {formatTime(hoverPosition.time)}
        </div>
      )}

      {/* Dragging preview timestamp tooltip */}
      {isDragging && dragTime !== null && (
        <div
          className="absolute -top-8 -translate-x-1/2 px-2.5 py-1 rounded-md bg-zinc-900/95 border border-cyan-400/50 text-[11px] font-mono font-bold text-emerald-300 shadow-2xl pointer-events-none z-30 animate-pulse will-change-[left]"
          style={{ left: `${progressPercent}%` }}
        >
          {formatTime(dragTime)}
        </div>
      )}
    </div>
  );
};

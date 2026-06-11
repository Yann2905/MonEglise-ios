'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Gauge, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string;
  title?: string;
  downloadable?: boolean;
}

const SPEEDS = [1, 1.25, 1.5, 2];

/** Lecteur audio premium : play/pause, skip ±10s, scrubber, vitesse */
export function AudioPlayer({ src, title, downloadable = true }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoaded = () => {
      setDuration(a.duration || 0);
      setLoading(false);
    };
    const onTime = () => setCurrent(a.currentTime);
    const onEnd = () => setPlaying(false);
    a.addEventListener('loadedmetadata', onLoaded);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('loadedmetadata', onLoaded);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnd);
    };
  }, []);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      try {
        await a.play();
        setPlaying(true);
      } catch (e) {
        console.error('Audio play failed', e);
      }
    }
  };

  const skip = (delta: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(duration, a.currentTime + delta));
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    const v = Number(e.target.value);
    a.currentTime = v;
    setCurrent(v);
  };

  const cycleSpeed = () => {
    const a = audioRef.current;
    if (!a) return;
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    a.playbackRate = next;
    setSpeed(next);
  };

  const fmt = (t: number) => {
    if (!isFinite(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Scrubber */}
      <div className="px-1">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={seek}
          disabled={loading}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-brand-600
            bg-gradient-to-r from-brand-600 to-brand-600
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-brand-600
            [&::-webkit-slider-thumb]:shadow-ios-sm"
          style={{
            background: duration
              ? `linear-gradient(to right, #234A87 0%, #234A87 ${(current / duration) * 100}%, #E5E5EA ${(current / duration) * 100}%, #E5E5EA 100%)`
              : '#E5E5EA',
          }}
        />
        <div className="flex justify-between mt-1.5 text-[12px] text-ios-gray tabular-nums">
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-6">
        <button
          onClick={() => skip(-10)}
          disabled={loading}
          className="relative flex h-12 w-12 items-center justify-center text-ios-label-light active:opacity-60 disabled:opacity-30"
          aria-label="-10 secondes"
        >
          <SkipBack className="h-7 w-7" strokeWidth={1.5} />
          <span className="absolute text-[9px] font-bold pointer-events-none">10</span>
        </button>

        <button
          onClick={toggle}
          disabled={loading}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white shadow-ios-lg active:scale-95 transition-transform disabled:opacity-50"
          aria-label={playing ? 'Pause' : 'Lecture'}
        >
          {loading ? (
            <div className="h-6 w-6 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
          ) : playing ? (
            <Pause className="h-7 w-7" fill="currentColor" />
          ) : (
            <Play className="h-7 w-7 ml-0.5" fill="currentColor" />
          )}
        </button>

        <button
          onClick={() => skip(10)}
          disabled={loading}
          className="relative flex h-12 w-12 items-center justify-center text-ios-label-light active:opacity-60 disabled:opacity-30"
          aria-label="+10 secondes"
        >
          <SkipForward className="h-7 w-7" strokeWidth={1.5} />
          <span className="absolute text-[9px] font-bold pointer-events-none">10</span>
        </button>
      </div>

      {/* Secondary controls */}
      <div className="mt-5 flex items-center justify-between px-1">
        <button
          onClick={cycleSpeed}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold',
            speed === 1
              ? 'bg-ios-gray6 text-ios-label-light'
              : 'bg-brand-600 text-white'
          )}
        >
          <Gauge className="h-3.5 w-3.5" />
          {speed}×
        </button>

        {downloadable && (
          <a
            href={src}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-ios-gray6 text-brand-600 active:opacity-70"
          >
            <Download className="h-3.5 w-3.5" />
            Télécharger
          </a>
        )}
      </div>
    </div>
  );
}

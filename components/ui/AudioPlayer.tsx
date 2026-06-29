'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Gauge, Download, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cldAudioUrl } from '@/lib/cloudinary';

interface AudioPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  downloadable?: boolean;
  shareable?: boolean;
  /** Type de contenu : 'speech' (par défaut, parole) ou 'music' (chant/musique) */
  audioType?: 'speech' | 'music';
}

const SPEEDS = [1, 1.25, 1.5, 2];

/** Lecteur audio premium : play/pause, skip ±10s, scrubber, vitesse */
export function AudioPlayer({
  src,
  title,
  artist,
  downloadable = true,
  shareable = true,
  audioType = 'speech',
}: AudioPlayerProps) {
  // Version compressée Cloudinary (à la volée, pas de transformation au stockage)
  // → ~5× plus rapide à streamer
  const optimizedSrc = cldAudioUrl(src, audioType) ?? src;
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

  // MediaSession API : permet à l'audio de continuer en arrière-plan
  // et affiche les contrôles dans le lock screen iOS / notification Android
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const a = audioRef.current;
    if (!a) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'Prédication',
      artist: artist || 'MonÉglise',
      artwork: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => a.play().then(() => setPlaying(true)).catch(() => {}));
    navigator.mediaSession.setActionHandler('pause', () => { a.pause(); setPlaying(false); });
    navigator.mediaSession.setActionHandler('seekbackward', () => { a.currentTime = Math.max(0, a.currentTime - 10); });
    navigator.mediaSession.setActionHandler('seekforward', () => { a.currentTime = Math.min(duration, a.currentTime + 10); });
    navigator.mediaSession.setActionHandler('seekto', (d: any) => { if (typeof d.seekTime === 'number') a.currentTime = d.seekTime; });
  }, [title, artist, duration]);

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
      {/* preload=auto → buffer commence dès l'ouverture du lecteur,
          Play instantané au lieu d'attendre 3-5 sec */}
      <audio ref={audioRef} src={optimizedSrc} preload="auto" />

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

        <div className="flex gap-2">
          {shareable && (
            <button
              onClick={() => {
                const shareText = `${title ? `🎙️ ${title}\n` : '🎙️ Prédication\n'}${optimizedSrc}\n\nVia MonÉglise`;
                if ((navigator as any).share) {
                  (navigator as any).share({ text: shareText, url: optimizedSrc }).catch(() => {});
                } else {
                  window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-ios-gray6 text-brand-600 active:opacity-70"
            >
              <Share2 className="h-3.5 w-3.5" />
              Partager
            </button>
          )}
          {downloadable && (
            <a
              href={optimizedSrc}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-ios-gray6 text-brand-600 active:opacity-70"
            >
              <Download className="h-3.5 w-3.5" />
              Télécharger
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

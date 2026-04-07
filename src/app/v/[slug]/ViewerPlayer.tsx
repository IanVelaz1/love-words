"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { loadAudioBuffer, createMixer, playBuffer, formatDuration } from "@/lib/audio";
import type { Creation, WordTimestamp } from "@/lib/supabase/types";

interface Props {
  creation: Creation & { voice_audio_signed_url: string | null };
}

// ─── Caption Window ──────────────────────────────────────────────────────────
// Mobile-first: 3-zone layout so captions never overflow the viewport.
// Zone 1 – past context  (faded, small)
// Zone 2 – current word  (bright, large — center stage)
// Zone 3 – upcoming      (muted, small)

function CaptionWindow({
  words,
  activeIndex,
}: {
  words: WordTimestamp[];
  activeIndex: number;
}) {
  const PAST_COUNT = 4;
  const AHEAD_COUNT = 5;

  const pastWords = words
    .slice(Math.max(0, activeIndex - PAST_COUNT), activeIndex)
    .map((w) => w.word)
    .join(" ");

  const currentWord = words[activeIndex]?.word ?? "";

  const aheadWords = words
    .slice(activeIndex + 1, activeIndex + 1 + AHEAD_COUNT)
    .map((w) => w.word)
    .join(" ");

  return (
    <div className="flex flex-col items-center gap-3 min-h-36 justify-center">
      {/* Past — very faded, small */}
      <p
        className="font-serif text-white/25 text-sm leading-snug text-center
                   w-full max-w-[min(100%,22rem)] px-4
                   line-clamp-2 transition-all duration-300"
        aria-hidden="true"
      >
        {pastWords || "\u00A0"}
      </p>

      {/* Current word — bright and prominent */}
      <p
        className="font-serif text-white text-[clamp(1.5rem,6vw,2.25rem)]
                   font-medium tracking-wide text-center
                   w-full px-4 leading-tight
                   transition-all duration-200"
        aria-live="polite"
        aria-atomic="true"
      >
        {currentWord || "\u00A0"}
      </p>

      {/* Upcoming — slightly faded */}
      <p
        className="font-serif text-white/35 text-sm leading-snug text-center
                   w-full max-w-[min(100%,22rem)] px-4
                   line-clamp-2 transition-all duration-300"
        aria-hidden="true"
      >
        {aheadWords || "\u00A0"}
      </p>
    </div>
  );
}

export function ViewerPlayer({ creation }: Props) {
  const {
    title,
    dedication,
    transcription,
    voice_audio_signed_url,
    music_preview_url,
    voice_gain,
    music_gain,
    voice_duration_sec,
  } = creation;

  const [phase, setPhase] = useState<"dedication" | "ready" | "playing" | "ended">("dedication");
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(voice_duration_sec ?? 0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const voiceSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const voiceBufferRef = useRef<AudioBuffer | null>(null);
  const musicBufferRef = useRef<AudioBuffer | null>(null);

  // After showing dedication, transition to ready
  useEffect(() => {
    const timer = setTimeout(() => setPhase("ready"), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Preload audio buffers
  useEffect(() => {
    async function preload() {
      try {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        if (voice_audio_signed_url) {
          const vBuf = await loadAudioBuffer(ctx, voice_audio_signed_url);
          voiceBufferRef.current = vBuf;
          setDuration(vBuf.duration);
        }

        if (music_preview_url) {
          const mBuf = await loadAudioBuffer(ctx, music_preview_url);
          musicBufferRef.current = mBuf;
        }
      } catch (e) {
        console.error("Audio preload error:", e);
      }
    }
    preload();
  }, [voice_audio_signed_url, music_preview_url]);

  const syncCaptions = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !voiceSourceRef.current) return;

    const currentTime = ctx.currentTime - startTimeRef.current;
    setElapsed(currentTime);

    const idx = (transcription as WordTimestamp[]).findIndex(
      (w, i) => {
        const next = (transcription as WordTimestamp[])[i + 1];
        return currentTime >= w.start && (next ? currentTime < next.start : true);
      }
    );
    setActiveWordIndex(idx);

    if (currentTime < duration) {
      rafRef.current = requestAnimationFrame(syncCaptions);
    }
  }, [transcription, duration]);

  async function handlePlay() {
    const ctx = audioCtxRef.current;
    if (!ctx || !voiceBufferRef.current) return;

    if (ctx.state === "suspended") await ctx.resume();

    const { voiceGain: vGain, musicGain: mGain } = createMixer(ctx);
    vGain.gain.value = voice_gain;
    mGain.gain.value = 0; // Music fades in

    voiceSourceRef.current = playBuffer(ctx, voiceBufferRef.current, vGain);
    startTimeRef.current = ctx.currentTime;

    if (musicBufferRef.current) {
      musicSourceRef.current = playBuffer(ctx, musicBufferRef.current, mGain, true);
      // Fade music in after 1.5s
      mGain.gain.setValueAtTime(0, ctx.currentTime);
      mGain.gain.linearRampToValueAtTime(music_gain, ctx.currentTime + 3);
    }

    voiceSourceRef.current.onended = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      musicSourceRef.current?.stop();
      setPhase("ended");
      setActiveWordIndex(-1);
    };

    setPhase("playing");
    rafRef.current = requestAnimationFrame(syncCaptions);
  }

  const words = transcription as WordTimestamp[];
  const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 0;

  return (
    <div className="viewer-gradient min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Dedication overlay */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-1000 ${
          phase === "dedication" ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {dedication && (
          <p className="font-serif italic text-white/80 text-xl md:text-2xl text-center max-w-sm leading-relaxed px-4">
            {dedication}
          </p>
        )}
      </div>

      {/* Main player */}
      <div
        className={`flex flex-col items-center gap-10 w-full max-w-lg transition-opacity duration-1000 ${
          phase === "dedication" ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Title + dedication compact */}
        <div className="text-center space-y-1">
          {title && (
            <h1 className="font-serif italic text-white/90 text-lg">
              {title}
            </h1>
          )}
          {dedication && phase !== "dedication" && (
            <p className="font-serif italic text-white/40 text-sm">
              {dedication}
            </p>
          )}
        </div>

        {/* Play button */}
        {(phase === "ready" || phase === "ended") && (
          <button
            onClick={handlePlay}
            className="animate-breathe w-20 h-20 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 flex items-center justify-center transition-all"
            aria-label="Play"
          >
            <span className="text-white text-2xl ml-1">▶</span>
          </button>
        )}

        {/* Captions — mobile-first windowed display */}
        {phase === "playing" && words.length > 0 && (
          <div className="w-full max-w-full px-2 overflow-hidden">
            <CaptionWindow words={words} activeIndex={activeWordIndex} />
          </div>
        )}

        {phase === "ended" && (
          <p className="font-serif italic text-white/40 text-base text-center">
            ✦
          </p>
        )}

        {/* Progress bar */}
        {phase === "playing" && (
          <div className="w-full space-y-1">
            <div className="w-full h-px bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/30 rounded-full transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-white/25 text-xs font-sans tabular-nums">
              <span>{formatDuration(elapsed)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Subtle footer */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <p className="text-white/15 text-xs font-sans tracking-widest uppercase">
          Love Words
        </p>
      </div>
    </div>
  );
}

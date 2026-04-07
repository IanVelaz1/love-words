"use client";

import { useRef, useState, useCallback } from "react";
import { useCreationStore } from "@/store/creation";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { loadAudioBuffer, createMixer, playBuffer } from "@/lib/audio";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function StepMixer() {
  const {
    audioUrl,
    audioBlob,
    selectedTrack,
    voiceGain,
    musicGain,
    setVoiceGain,
    setMusicGain,
    nextStep,
    prevStep,
  } = useCreationStore();

  const [isPreviewing, setIsPreviewing] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const voiceGainNodeRef = useRef<GainNode | null>(null);
  const musicGainNodeRef = useRef<GainNode | null>(null);
  const voiceSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const supabase = createClient();

  const stopPreview = useCallback(() => {
    voiceSourceRef.current?.stop();
    musicSourceRef.current?.stop();
    voiceSourceRef.current = null;
    musicSourceRef.current = null;
    setIsPreviewing(false);
  }, []);

  async function handlePreview() {
    if (isPreviewing) {
      stopPreview();
      return;
    }

    if (!audioUrl && !audioBlob) {
      toast.error("No audio found.");
      return;
    }

    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const { voiceGain: vGain, musicGain: mGain } = createMixer(ctx);
      voiceGainNodeRef.current = vGain;
      musicGainNodeRef.current = mGain;
      vGain.gain.value = voiceGain;
      mGain.gain.value = musicGain;

      // Load voice audio
      let voiceBuffer: AudioBuffer;
      if (audioBlob) {
        const arrayBuffer = await audioBlob.arrayBuffer();
        voiceBuffer = await ctx.decodeAudioData(arrayBuffer);
      } else {
        // Get signed URL for stored audio
        const path = audioUrl!.replace(/^.*voice-audio\//, "");
        const { data } = await supabase.storage
          .from("voice-audio")
          .createSignedUrl(path, 60);
        if (!data?.signedUrl) throw new Error("Could not load voice audio");
        voiceBuffer = await loadAudioBuffer(ctx, data.signedUrl);
      }
      voiceSourceRef.current = playBuffer(ctx, voiceBuffer, vGain);

      // Load music if selected
      if (selectedTrack?.preview_url) {
        const musicBuffer = await loadAudioBuffer(ctx, selectedTrack.preview_url);
        musicSourceRef.current = playBuffer(ctx, musicBuffer, mGain, true);
      }

      setIsPreviewing(true);

      voiceSourceRef.current.onended = () => {
        if (isPreviewing) stopPreview();
      };
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Preview failed");
    }
  }

  function handleVoiceGainChange(values: number | readonly number[]) {
    const raw = Array.isArray(values) ? values[0] : typeof values === "number" ? values : (values as readonly number[])[0];
    const v = raw / 100;
    setVoiceGain(v);
    if (voiceGainNodeRef.current) voiceGainNodeRef.current.gain.value = v;
  }

  function handleMusicGainChange(values: number | readonly number[]) {
    const raw = Array.isArray(values) ? values[0] : typeof values === "number" ? values : (values as readonly number[])[0];
    const v = raw / 100;
    setMusicGain(v);
    if (musicGainNodeRef.current) musicGainNodeRef.current.gain.value = v;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-2xl text-white italic">
          Find the balance.
        </h2>
        <p className="text-white/40 text-sm font-sans">
          Adjust the voice and music levels.
        </p>
      </div>

      <div className="space-y-6">
        {/* Voice slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-white/70 text-sm font-sans">Voice</label>
            <span className="text-white/40 text-xs font-sans tabular-nums">
              {Math.round(voiceGain * 100)}%
            </span>
          </div>
          <Slider
            value={[Math.round(voiceGain * 100)]}
            onValueChange={handleVoiceGainChange}
            min={0}
            max={100}
            step={1}
            className="[&>span:first-child]:bg-white/10 [&_[role=slider]]:bg-white [&>span:first-child>span]:bg-[#C97B84]"
          />
        </div>

        {/* Music slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-white/70 text-sm font-sans">Music</label>
            <span className="text-white/40 text-xs font-sans tabular-nums">
              {Math.round(musicGain * 100)}%
            </span>
          </div>
          <Slider
            value={[Math.round(musicGain * 100)]}
            onValueChange={handleMusicGainChange}
            min={0}
            max={100}
            step={1}
            className="[&>span:first-child]:bg-white/10 [&_[role=slider]]:bg-white [&>span:first-child>span]:bg-[#D4A843]"
          />
        </div>
      </div>

      {/* Preview button */}
      <button
        onClick={handlePreview}
        className={`w-full py-3 rounded-xl border font-sans text-sm transition-all ${
          isPreviewing
            ? "bg-[#C97B84]/20 border-[#C97B84]/50 text-[#C97B84]"
            : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white"
        }`}
      >
        {isPreviewing ? "■ Stop preview" : "▶ Preview mix"}
      </button>

      <div className="flex gap-3">
        <Button
          onClick={() => { stopPreview(); prevStep(); }}
          variant="ghost"
          className="text-white/50 hover:text-white font-sans flex-1"
        >
          ← Back
        </Button>
        <Button
          onClick={() => { stopPreview(); nextStep(); }}
          className="bg-[#C97B84] hover:bg-[#b86a73] text-white rounded-xl py-5 font-sans flex-1"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useCreationStore } from "@/store/creation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function StepRecorder() {
  const {
    audioBlob,
    audioUrl,
    setAudioBlob,
    setAudioUrl,
    transcription,
    setTranscription,
    setIsTranscribing,
    isTranscribing,
    nextStep,
  } = useCreationStore();

  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [bars, setBars] = useState<number[]>(Array(20).fill(4));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  function animateWaveform() {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const newBars = Array.from({ length: 20 }, (_, i) => {
      const index = Math.floor((i / 20) * data.length);
      return Math.max(4, (data[index] / 255) * 48);
    });
    setBars(newBars);
    animFrameRef.current = requestAnimationFrame(animateWaveform);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioCtxRef.current = new AudioContext();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      animateWaveform();

      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setLocalPreviewUrl(url);
        setAudioBlob(blob, recordingTime);
        stream.getTracks().forEach((t) => t.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        setBars(Array(20).fill(4));
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      toast.error("Could not access microphone.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLocalPreviewUrl(url);
    setAudioBlob(file, 0);
  }

  async function handleUploadAndTranscribe() {
    if (!audioBlob) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Step 1: Transcribe by sending the blob directly (no storage round-trip needed)
      setIsTranscribing(true);
      const transcribeForm = new FormData();
      transcribeForm.append("file", audioBlob, "audio.webm");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: transcribeForm,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "Transcription failed");
      }
      const { words } = await res.json();
      setTranscription(words);
      setIsTranscribing(false);

      // Step 2: Upload audio to storage for later use in the viewer
      setIsUploading(true);
      const filename = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("voice-audio")
        .upload(filename, audioBlob, { contentType: "audio/webm", upsert: true });

      if (uploadError) {
        // Storage upload failed — log it but don't block the flow.
        // The audioUrl will be empty; the creation step will surface this.
        console.warn("Storage upload failed:", uploadError.message);
      } else {
        const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/voice-audio/${filename}`;
        setAudioUrl(storageUrl);
      }

      setIsUploading(false);
      nextStep();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setIsUploading(false);
      setIsTranscribing(false);
    }
  }

  const mm = String(Math.floor(recordingTime / 60)).padStart(2, "0");
  const ss = String(recordingTime % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-2xl text-white italic">
          Say what&apos;s on your heart.
        </h2>
        <p className="text-white/40 text-sm font-sans">
          Record your voice or upload an audio file.
        </p>
      </div>

      {/* Waveform / Record button */}
      <div className="flex flex-col items-center gap-4">
        {isRecording && (
          <div className="flex items-end gap-1 h-12">
            {bars.map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-[#C97B84]"
                style={{ height: `${h}px`, transition: "height 0.1s ease" }}
              />
            ))}
          </div>
        )}

        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isRecording
              ? "bg-[#C97B84] scale-110"
              : "bg-white/10 hover:bg-white/20 border border-white/20"
          }`}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? (
            <span className="w-6 h-6 rounded bg-white" />
          ) : (
            <span className="w-6 h-6 rounded-full bg-[#C97B84]" />
          )}
        </button>

        {isRecording && (
          <p className="text-white/50 text-sm font-sans tabular-nums">
            {mm}:{ss}
          </p>
        )}
      </div>

      {/* Upload option */}
      {!isRecording && !audioBlob && (
        <div className="text-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-white/40 text-sm hover:text-white/70 underline underline-offset-4 font-sans transition-colors"
          >
            Upload an audio file instead
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* Preview + continue */}
      {audioBlob && localPreviewUrl && (
        <div className="w-full max-w-sm space-y-4">
          <audio
            src={localPreviewUrl}
            controls
            className="w-full rounded-xl"
          />
          <Button
            onClick={handleUploadAndTranscribe}
            disabled={isUploading || isTranscribing}
            className="w-full bg-[#C97B84] hover:bg-[#b86a73] text-white rounded-xl py-5 font-sans"
          >
            {isTranscribing
              ? "Transcribing…"
              : isUploading
              ? "Saving…"
              : "Continue →"}
          </Button>
          {(isUploading || isTranscribing) && (
            <p className="text-white/40 text-xs text-center font-sans">
              {isTranscribing
                ? "Generating captions, this takes a few seconds…"
                : "Saving your recording…"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

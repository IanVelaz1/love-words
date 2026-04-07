import { create } from "zustand";
import type { WordTimestamp, MusicTrack, ExpiryType } from "@/lib/supabase/types";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

interface CreationState {
  // Wizard navigation
  step: WizardStep;

  // Step 1 — Recording
  audioBlob: Blob | null;
  audioUrl: string | null; // Supabase Storage URL after upload
  durationSec: number;

  // Step 2 — Transcription
  transcription: WordTimestamp[];
  isTranscribing: boolean;

  // Step 3 — Music
  selectedTrack: MusicTrack | null;

  // Step 4 — Mixer
  voiceGain: number;
  musicGain: number;

  // Step 5 — Publish
  title: string;
  dedication: string;
  expiryType: ExpiryType;
  expiryDate: string;
  expiryViews: number;

  // Result
  publishedSlug: string | null;
  isPublishing: boolean;

  // Actions
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setAudioBlob: (blob: Blob, durationSec: number) => void;
  setAudioUrl: (url: string) => void;
  setTranscription: (words: WordTimestamp[]) => void;
  setIsTranscribing: (v: boolean) => void;
  setSelectedTrack: (track: MusicTrack | null) => void;
  setVoiceGain: (v: number) => void;
  setMusicGain: (v: number) => void;
  setTitle: (v: string) => void;
  setDedication: (v: string) => void;
  setExpiryType: (v: ExpiryType) => void;
  setExpiryDate: (v: string) => void;
  setExpiryViews: (v: number) => void;
  setPublishedSlug: (slug: string) => void;
  setIsPublishing: (v: boolean) => void;
  reset: () => void;
}

const initialState = {
  step: 1 as WizardStep,
  audioBlob: null,
  audioUrl: null,
  durationSec: 0,
  transcription: [],
  isTranscribing: false,
  selectedTrack: null,
  voiceGain: 0.8,
  musicGain: 0.25,
  title: "",
  dedication: "",
  expiryType: "permanent" as ExpiryType,
  expiryDate: "",
  expiryViews: 1,
  publishedSlug: null,
  isPublishing: false,
};

export const useCreationStore = create<CreationState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: Math.min(5, s.step + 1) as WizardStep })),
  prevStep: () => set((s) => ({ step: Math.max(1, s.step - 1) as WizardStep })),

  setAudioBlob: (blob, durationSec) => set({ audioBlob: blob, durationSec }),
  setAudioUrl: (url) => set({ audioUrl: url }),
  setTranscription: (words) => set({ transcription: words }),
  setIsTranscribing: (v) => set({ isTranscribing: v }),
  setSelectedTrack: (track) => set({ selectedTrack: track }),
  setVoiceGain: (v) => set({ voiceGain: v }),
  setMusicGain: (v) => set({ musicGain: v }),
  setTitle: (v) => set({ title: v }),
  setDedication: (v) => set({ dedication: v }),
  setExpiryType: (v) => set({ expiryType: v }),
  setExpiryDate: (v) => set({ expiryDate: v }),
  setExpiryViews: (v) => set({ expiryViews: v }),
  setPublishedSlug: (slug) => set({ publishedSlug: slug }),
  setIsPublishing: (v) => set({ isPublishing: v }),
  reset: () => set(initialState),
}));

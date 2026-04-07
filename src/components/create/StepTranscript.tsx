"use client";

import { useCreationStore } from "@/store/creation";
import { Button } from "@/components/ui/button";
import type { WordTimestamp } from "@/lib/supabase/types";

export function StepTranscript() {
  const { transcription, setTranscription, nextStep, prevStep } =
    useCreationStore();

  function handleWordEdit(index: number, newWord: string) {
    const updated: WordTimestamp[] = transcription.map((w, i) =>
      i === index ? { ...w, word: newWord } : w
    );
    setTranscription(updated);
  }

  if (transcription.length === 0) {
    return (
      <div className="text-center space-y-4">
        <p className="text-white/50 font-sans text-sm">
          No transcript found. Try re-recording.
        </p>
        <Button
          onClick={prevStep}
          variant="ghost"
          className="text-white/50 hover:text-white font-sans"
        >
          ← Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-2xl text-white italic">
          Here&apos;s what we heard.
        </h2>
        <p className="text-white/40 text-sm font-sans">
          Tap any word to correct it.
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 leading-8 font-serif text-white/90 text-lg max-h-72 overflow-y-auto">
        {transcription.map((w, i) => (
          <span key={i} className="inline-block mr-1">
            <input
              type="text"
              value={w.word}
              onChange={(e) => handleWordEdit(i, e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-white/30 focus:border-[#C97B84] outline-none font-serif text-white/90 text-lg w-auto text-center"
              style={{ width: `${Math.max(w.word.length, 2)}ch` }}
            />
          </span>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={prevStep}
          variant="ghost"
          className="text-white/50 hover:text-white font-sans flex-1"
        >
          ← Back
        </Button>
        <Button
          onClick={nextStep}
          className="bg-[#C97B84] hover:bg-[#b86a73] text-white rounded-xl py-5 font-sans flex-1"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useCreationStore } from "@/store/creation";
import { StepRecorder } from "@/components/create/StepRecorder";
import { StepTranscript } from "@/components/create/StepTranscript";
import { StepMusic } from "@/components/create/StepMusic";
import { StepMixer } from "@/components/create/StepMixer";
import { StepPublish } from "@/components/create/StepPublish";
import Link from "next/link";

const STEPS = [
  { label: "Record" },
  { label: "Review" },
  { label: "Music" },
  { label: "Mix" },
  { label: "Send" },
];

export default function CreatePage() {
  const { step } = useCreationStore();

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0D0A0E] via-[#1a0a14] to-[#0d1020] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/">
          <p className="text-[#D4A843] text-sm tracking-widest uppercase font-sans">
            Love Words
          </p>
        </Link>
        <Link
          href="/dashboard"
          className="text-white/30 hover:text-white/60 text-sm font-sans transition-colors"
        >
          My creations
        </Link>
      </header>

      {/* Step progress */}
      <div className="flex items-center justify-center gap-2 px-6 mb-8">
        {STEPS.map((s, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === step;
          const isDone = stepNum < step;
          return (
            <div key={s.label} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-sans transition-all ${
                  isActive
                    ? "bg-[#C97B84] text-white"
                    : isDone
                    ? "bg-[#C97B84]/40 text-white/60"
                    : "bg-white/10 text-white/30"
                }`}
              >
                {isDone ? "✓" : stepNum}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-6 transition-all ${
                    isDone ? "bg-[#C97B84]/40" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-lg bg-white/5 border border-white/10 rounded-3xl p-8">
          {step === 1 && <StepRecorder />}
          {step === 2 && <StepTranscript />}
          {step === 3 && <StepMusic />}
          {step === 4 && <StepMixer />}
          {step === 5 && <StepPublish />}
        </div>
      </div>
    </main>
  );
}

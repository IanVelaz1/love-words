"use client";

import { useRef } from "react";
import { useCreationStore } from "@/store/creation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import type { ExpiryType } from "@/lib/supabase/types";

const EXPIRY_OPTIONS: { label: string; value: ExpiryType; description: string }[] = [
  { label: "Never", value: "permanent", description: "The link lasts forever" },
  { label: "Date", value: "date", description: "Expires on a specific date" },
  { label: "Views", value: "views", description: "Disappears after N views" },
];

export function StepPublish() {
  const {
    audioUrl,
    transcription,
    selectedTrack,
    voiceGain,
    musicGain,
    durationSec,
    title,
    setTitle,
    dedication,
    setDedication,
    expiryType,
    setExpiryType,
    expiryDate,
    setExpiryDate,
    expiryViews,
    setExpiryViews,
    publishedSlug,
    setPublishedSlug,
    isPublishing,
    setIsPublishing,
    prevStep,
  } = useCreationStore();

  const linkRef = useRef<HTMLInputElement>(null);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const shareUrl = publishedSlug ? `${appUrl}/v/${publishedSlug}` : "";

  async function handlePublish() {
    if (!audioUrl) {
      toast.error("Missing audio. Go back and record.");
      return;
    }
    setIsPublishing(true);

    try {
      const res = await fetch("/api/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl,
          durationSec,
          transcription,
          musicJamendoId: selectedTrack?.jamendo_id ?? null,
          musicName: selectedTrack?.name ?? null,
          musicArtist: selectedTrack?.artist ?? null,
          musicPreviewUrl: selectedTrack?.preview_url ?? null,
          voiceGain,
          musicGain,
          title: title || null,
          dedication: dedication || null,
          expiryType,
          expiryDate: expiryType === "date" ? expiryDate : null,
          expiryViews: expiryType === "views" ? expiryViews : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to publish");
      const { slug } = await res.json();
      setPublishedSlug(slug);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#C97B84", "#D4A843", "#ffffff"],
      });
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setIsPublishing(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied!");
  }

  if (publishedSlug) {
    return (
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="space-y-2">
          <p className="text-4xl">✉️</p>
          <h2 className="font-serif text-2xl text-white italic">
            Your love word is ready.
          </h2>
          <p className="text-white/40 text-sm font-sans">
            Share this link with someone special.
          </p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <div className="flex gap-2">
            <input
              ref={linkRef}
              value={shareUrl}
              readOnly
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm font-sans focus:outline-none"
            />
            <Button
              onClick={handleCopy}
              className="bg-[#C97B84] hover:bg-[#b86a73] text-white rounded-xl px-5 font-sans"
            >
              Copy
            </Button>
          </div>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-white/40 text-xs hover:text-white/60 underline underline-offset-4 font-sans transition-colors"
          >
            Preview your link →
          </a>
        </div>

        <Button
          onClick={() => window.location.reload()}
          variant="ghost"
          className="text-white/30 hover:text-white/60 font-sans text-sm"
        >
          Create another
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-2xl text-white italic">
          One last touch.
        </h2>
        <p className="text-white/40 text-sm font-sans">
          Add an optional title and dedication.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white/60 text-sm font-sans">
            Title <span className="text-white/30">(optional)</span>
          </Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Something I wrote for you"
            maxLength={100}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl font-serif"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white/60 text-sm font-sans">
            Dedication <span className="text-white/30">(optional)</span>
          </Label>
          <Textarea
            value={dedication}
            onChange={(e) => setDedication(e.target.value)}
            placeholder="To Sofia, with everything I have."
            maxLength={200}
            rows={2}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl resize-none font-serif"
          />
        </div>

        {/* Expiry */}
        <div className="space-y-2">
          <Label className="text-white/60 text-sm font-sans">
            Link expires
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {EXPIRY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setExpiryType(opt.value)}
                className={`px-3 py-2 rounded-xl border text-sm font-sans transition-all ${
                  expiryType === opt.value
                    ? "bg-[#C97B84]/20 border-[#C97B84]/50 text-white"
                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/25"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {expiryType === "date" && (
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="bg-white/5 border-white/10 text-white rounded-xl font-sans"
            />
          )}
          {expiryType === "views" && (
            <Input
              type="number"
              value={expiryViews}
              onChange={(e) => setExpiryViews(Number(e.target.value))}
              min={1}
              max={999}
              placeholder="Number of views"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl font-sans"
            />
          )}
        </div>
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
          onClick={handlePublish}
          disabled={isPublishing}
          className="bg-[#C97B84] hover:bg-[#b86a73] text-white rounded-xl py-5 font-sans flex-1 disabled:opacity-50"
        >
          {isPublishing ? "Publishing…" : "Publish & Get Link ✨"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { useCreationStore } from "@/store/creation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { MusicTrack } from "@/lib/supabase/types";

const MOODS = [
  { label: "Tender", value: "tender" },
  { label: "Melancholic", value: "melancholic" },
  { label: "Hopeful", value: "hopeful" },
  { label: "Calm", value: "calm" },
];

export function StepMusic() {
  const { selectedTrack, setSelectedTrack, nextStep, prevStep } =
    useCreationStore();

  const [query, setQuery] = useState("");
  const [activeMood, setActiveMood] = useState("");
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function search(q: string, mood: string) {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (mood) params.set("mood", mood);
      const res = await fetch(`/api/music/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const { tracks: results } = await res.json();
      setTracks(results);
    } catch {
      toast.error("Could not load music. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleMoodClick(mood: string) {
    const next = activeMood === mood ? "" : mood;
    setActiveMood(next);
    search(query, next);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    search(query, activeMood);
  }

  function togglePreview(track: MusicTrack) {
    if (playingId === track.jamendo_id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(track.preview_url);
    audioRef.current.play();
    audioRef.current.onended = () => setPlayingId(null);
    setPlayingId(track.jamendo_id);
  }

  function selectTrack(track: MusicTrack) {
    audioRef.current?.pause();
    setPlayingId(null);
    setSelectedTrack(track);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-2xl text-white italic">
          Add a soundtrack.
        </h2>
        <p className="text-white/40 text-sm font-sans">
          Search for license-free music or pick a mood.
        </p>
      </div>

      {/* Mood filters */}
      <div className="flex gap-2 flex-wrap justify-center">
        {MOODS.map((m) => (
          <button
            key={m.value}
            onClick={() => handleMoodClick(m.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-sans transition-all border ${
              activeMood === m.value
                ? "bg-[#C97B84] border-[#C97B84] text-white"
                : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search music…"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl px-5 font-sans"
        >
          {isLoading ? "…" : "Search"}
        </Button>
      </form>

      {/* Selected track indicator */}
      {selectedTrack && (
        <div className="flex items-center gap-3 bg-[#C97B84]/20 border border-[#C97B84]/40 rounded-xl px-4 py-3">
          <span className="text-[#C97B84] text-lg">♩</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-sans truncate">
              {selectedTrack.name}
            </p>
            <p className="text-white/50 text-xs font-sans truncate">
              {selectedTrack.artist}
            </p>
          </div>
          <Badge className="bg-[#C97B84]/30 text-[#C97B84] border-0 text-xs font-sans">
            Selected
          </Badge>
        </div>
      )}

      {/* Track list */}
      {tracks.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {tracks.map((track) => (
            <div
              key={track.jamendo_id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all cursor-pointer ${
                selectedTrack?.jamendo_id === track.jamendo_id
                  ? "bg-[#C97B84]/20 border-[#C97B84]/40"
                  : "bg-white/5 border-white/10 hover:border-white/25"
              }`}
              onClick={() => selectTrack(track)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePreview(track);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs flex-shrink-0 transition-colors"
                aria-label={playingId === track.jamendo_id ? "Pause" : "Preview"}
              >
                {playingId === track.jamendo_id ? "■" : "▶"}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-sans truncate">
                  {track.name}
                </p>
                <p className="text-white/50 text-xs font-sans truncate">
                  {track.artist}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tracks.length === 0 && !isLoading && (
        <p className="text-white/30 text-sm text-center font-sans">
          Search or pick a mood to browse music.
        </p>
      )}

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
          disabled={!selectedTrack}
          className="bg-[#C97B84] hover:bg-[#b86a73] text-white rounded-xl py-5 font-sans flex-1 disabled:opacity-40"
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}

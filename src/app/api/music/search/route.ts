import { NextRequest, NextResponse } from "next/server";

const MOOD_TAG_MAP: Record<string, string> = {
  tender: "romantic",
  melancholic: "melancholic",
  hopeful: "hopeful",
  calm: "ambient",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const mood = searchParams.get("mood") ?? "";

  const params = new URLSearchParams({
    client_id: process.env.JAMENDO_CLIENT_ID!,
    format: "json",
    limit: "20",
    offset: "0",
    license_ccby: "true",
    audiodownload_allowed: "true",
    include: "musicinfo",
    order: "popularity_total",
  });

  if (q) params.set("namesearch", q);
  if (mood && MOOD_TAG_MAP[mood]) params.set("tags", MOOD_TAG_MAP[mood]);

  const jamendoUrl = `https://api.jamendo.com/v3.0/tracks/?${params.toString()}`;

  const response = await fetch(jamendoUrl, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Music search failed" }, { status: 500 });
  }

  const data = await response.json();

  const tracks = (data.results ?? []).map(
    (t: {
      id: string;
      name: string;
      artist_name: string;
      audio: string;
      duration: number;
    }) => ({
      jamendo_id: t.id,
      name: t.name,
      artist: t.artist_name,
      preview_url: t.audio,
      duration: t.duration,
    })
  );

  return NextResponse.json({ tracks });
}

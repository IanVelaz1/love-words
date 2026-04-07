import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";
import type { ExpiryType } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    audioUrl,
    durationSec,
    transcription,
    musicJamendoId,
    musicName,
    musicArtist,
    musicPreviewUrl,
    voiceGain,
    musicGain,
    title,
    dedication,
    expiryType,
    expiryDate,
    expiryViews,
  } = body;

  if (!audioUrl || !transcription) {
    return NextResponse.json({ error: "audioUrl and transcription are required" }, { status: 400 });
  }

  const slug = nanoid(8);

  const { data, error } = await supabase
    .from("creations")
    .insert({
      slug,
      creator_id: user.id,
      title: title || null,
      dedication: dedication || null,
      voice_audio_url: audioUrl,
      voice_duration_sec: durationSec ?? null,
      transcription,
      music_jamendo_id: musicJamendoId ?? null,
      music_name: musicName ?? null,
      music_artist: musicArtist ?? null,
      music_preview_url: musicPreviewUrl ?? null,
      voice_gain: voiceGain ?? 0.8,
      music_gain: musicGain ?? 0.25,
      expiry_type: (expiryType as ExpiryType) ?? "permanent",
      expiry_date: expiryDate || null,
      expiry_views: expiryViews ?? null,
      status: "published",
      published_at: new Date().toISOString(),
    })
    .select("slug")
    .single();

  if (error) {
    console.error("DB insert error:", error);
    return NextResponse.json({ error: "Failed to save creation" }, { status: 500 });
  }

  return NextResponse.json({ slug: data.slug });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("creations")
    .select("id, slug, title, dedication, view_count, expiry_type, expiry_date, expiry_views, status, published_at, created_at")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch creations" }, { status: 500 });
  }

  return NextResponse.json({ creations: data });
}

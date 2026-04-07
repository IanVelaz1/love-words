import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// GET: health check — open http://localhost:3000/api/transcribe in browser to diagnose
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    return NextResponse.json({
      status: "ok",
      auth: user ? { id: user.id, email: user.email } : null,
      authError: authError?.message ?? null,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      openAIKeyPrefix: process.env.OPENAI_API_KEY?.slice(0, 10) ?? "not set",
    });
  } catch (err) {
    return NextResponse.json({ status: "error", error: String(err) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("[transcribe] No authenticated user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[transcribe] User authenticated:", user.id);

    // Accept the audio file directly as multipart/form-data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      console.error("[transcribe] No file in formData");
      return NextResponse.json({ error: "audio file is required" }, { status: 400 });
    }

    console.log("[transcribe] File received:", file.name, file.size, "bytes", file.type);

    if (!process.env.OPENAI_API_KEY) {
      console.error("[transcribe] OPENAI_API_KEY is not set");
      return NextResponse.json({ error: "OpenAI key not configured" }, { status: 500 });
    }

    // Forward directly to OpenAI Whisper
    const whisperForm = new FormData();
    whisperForm.append("file", file, file.name || "audio.webm");
    whisperForm.append("model", "whisper-1");
    whisperForm.append("response_format", "verbose_json");
    whisperForm.append("timestamp_granularities[]", "word");

    console.log("[transcribe] Sending to Whisper...");
    const whisperResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: whisperForm,
      }
    );

    if (!whisperResponse.ok) {
      const err = await whisperResponse.text();
      console.error("[transcribe] Whisper error", whisperResponse.status, err);
      return NextResponse.json(
        { error: `Transcription failed (${whisperResponse.status}): ${err}` },
        { status: 500 }
      );
    }

    const whisperData = await whisperResponse.json();
    console.log("[transcribe] Whisper success, words:", whisperData.words?.length ?? 0);

    const words: { word: string; start: number; end: number }[] = (
      whisperData.words ?? []
    ).map((w: { word: string; start: number; end: number }) => ({
      word: w.word.trim(),
      start: w.start,
      end: w.end,
    }));

    return NextResponse.json({ words, text: whisperData.text });
  } catch (err) {
    console.error("[transcribe] Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

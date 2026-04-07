import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import crypto from "crypto";

function isExpired(creation: {
  expiry_type: string;
  expiry_date: string | null;
  expiry_views: number | null;
  view_count: number;
}): boolean {
  if (creation.expiry_type === "date" && creation.expiry_date) {
    return new Date() > new Date(creation.expiry_date);
  }
  if (creation.expiry_type === "views" && creation.expiry_views !== null) {
    return creation.view_count >= creation.expiry_views;
  }
  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: creation, error } = await supabase
    .from("creations")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !creation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (isExpired(creation)) {
    return NextResponse.json({ error: "This link has expired" }, { status: 410 });
  }

  // Log view event
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "";
  const ipHash = ip
    ? crypto.createHash("sha256").update(ip).digest("hex")
    : null;
  const userAgent = request.headers.get("user-agent") ?? null;

  await supabase.from("view_events").insert({
    creation_id: creation.id,
    ip_hash: ipHash,
    user_agent: userAgent,
  });

  // Increment view count
  await supabase
    .from("creations")
    .update({ view_count: creation.view_count + 1 })
    .eq("id", creation.id);

  // Generate signed URL using service role (bypasses RLS for public viewer)
  const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : supabase;

  const storagePath = creation.voice_audio_url.replace(/^.*voice-audio\//, "");
  const { data: signedData } = await storageClient.storage
    .from("voice-audio")
    .createSignedUrl(storagePath, 3600);

  return NextResponse.json({
    creation: {
      ...creation,
      voice_audio_signed_url: signedData?.signedUrl ?? null,
    },
  });
}

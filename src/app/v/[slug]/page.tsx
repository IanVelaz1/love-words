import { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Creation } from "@/lib/supabase/types";
import { ViewerPlayer } from "./ViewerPlayer";

// Viewer pages are fully dynamic: signed URLs expire and view counts change
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getCreation(slug: string): Promise<(Creation & { voice_audio_signed_url: string | null }) | null> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${appUrl}/api/v/${slug}`, {
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (res.status === 410) return null;
  if (!res.ok) return null;

  const { creation } = await res.json();
  return creation;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const creation = await getCreation(slug);

  if (!creation) {
    return { title: "Love Words" };
  }

  const title = creation.title ?? "A voice message for you";
  const description = creation.dedication ?? "Someone shared their voice with you.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ViewerPage({ params }: PageProps) {
  const { slug } = await params;
  const creation = await getCreation(slug);

  if (!creation) {
    notFound();
  }

  return <ViewerPlayer creation={creation} />;
}

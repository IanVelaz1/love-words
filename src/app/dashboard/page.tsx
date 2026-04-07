"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface CreationRow {
  id: string;
  slug: string;
  title: string | null;
  dedication: string | null;
  view_count: number;
  expiry_type: string;
  expiry_date: string | null;
  expiry_views: number | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

function getExpiryLabel(row: CreationRow): string {
  if (row.expiry_type === "permanent") return "Never expires";
  if (row.expiry_type === "date" && row.expiry_date) {
    const d = new Date(row.expiry_date);
    return `Expires ${d.toLocaleDateString()}`;
  }
  if (row.expiry_type === "views" && row.expiry_views !== null) {
    return `${row.view_count}/${row.expiry_views} views`;
  }
  return "";
}

export default function DashboardPage() {
  const [creations, setCreations] = useState<CreationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [claimEmail, setClaimEmail] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimSent, setClaimSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      setIsGuest(user.is_anonymous ?? false);

      const res = await fetch("/api/creations");
      if (!res.ok) { setIsLoading(false); return; }
      const { creations: data } = await res.json();
      setCreations(data ?? []);
      setIsLoading(false);
    }
    load();
  }, [router, supabase]);

  async function handleClaimAccount(e: React.FormEvent) {
    e.preventDefault();
    setClaiming(true);

    // Link the anonymous session to a real email account
    const { error } = await supabase.auth.updateUser(
      { email: claimEmail },
      { emailRedirectTo: `${window.location.origin}/auth/callback` }
    );

    setClaiming(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setClaimSent(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this love word? This cannot be undone.")) return;
    const res = await fetch(`/api/creations/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Could not delete."); return; }
    setCreations((prev) => prev.filter((c) => c.id !== id));
    toast.success("Deleted.");
  }

  function handleCopy(slug: string) {
    navigator.clipboard.writeText(`${appUrl}/v/${slug}`);
    toast.success("Link copied!");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-[#0D0A0E] via-[#1a0a14] to-[#0d1020]">
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <Link href="/">
          <p className="text-[#D4A843] text-sm tracking-widest uppercase font-sans">
            Love Words
          </p>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/create">
            <Button className="bg-[#C97B84] hover:bg-[#b86a73] text-white rounded-full px-6 text-sm font-sans">
              + New
            </Button>
          </Link>
          <button
            onClick={handleSignOut}
            className="text-white/30 hover:text-white/60 text-sm font-sans transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        <h1 className="font-serif italic text-2xl text-white mb-6">
          My love words
        </h1>

        {/* Guest session banner */}
        {isGuest && (
          <div className="bg-[#D4A843]/10 border border-[#D4A843]/20 rounded-2xl p-5 space-y-3 mb-2">
            <div className="space-y-1">
              <p className="text-[#D4A843] text-sm font-sans font-medium">
                Guest session
              </p>
              <p className="text-white/50 text-xs font-sans leading-relaxed">
                Your links work and can be shared. To keep your history across
                sessions, save your email below.
              </p>
            </div>

            {claimSent ? (
              <p className="text-white/60 text-xs font-sans">
                Check your email — click the link to save your account. ✓
              </p>
            ) : (
              <form
                onSubmit={handleClaimAccount}
                className="flex gap-2 items-center"
              >
                <Input
                  type="email"
                  value={claimEmail}
                  onChange={(e) => setClaimEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 bg-white/5 border-white/10 text-white
                             placeholder:text-white/25 rounded-xl text-sm h-9
                             focus:ring-[#D4A843] focus:border-[#D4A843]"
                />
                <Button
                  type="submit"
                  disabled={claiming}
                  className="bg-[#D4A843] hover:bg-[#c49a38] text-black
                             rounded-xl px-4 h-9 text-xs font-sans font-medium
                             shrink-0"
                >
                  {claiming ? "Sending…" : "Save account"}
                </Button>
              </form>
            )}
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-white/5 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && creations.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <p className="text-white/30 font-sans text-sm">
              No love words yet.
            </p>
            <Link href="/create">
              <Button className="bg-[#C97B84] hover:bg-[#b86a73] text-white rounded-full px-8 font-sans">
                Create your first
              </Button>
            </Link>
          </div>
        )}

        {creations.map((c) => (
          <div
            key={c.id}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-start gap-4"
          >
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-serif italic text-white text-base truncate">
                {c.title ?? "Untitled"}
              </p>
              {c.dedication && (
                <p className="text-white/40 text-xs font-sans truncate">
                  {c.dedication}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-white/10 text-white/50 border-0 text-xs font-sans">
                  {c.view_count} views
                </Badge>
                <span className="text-white/25 text-xs font-sans">
                  {getExpiryLabel(c)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopy(c.slug)}
                className="text-white/40 hover:text-white text-xs font-sans transition-colors"
              >
                Copy link
              </button>
              <a
                href={`/v/${c.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white text-xs font-sans transition-colors"
              >
                View
              </a>
              <button
                onClick={() => handleDelete(c.id)}
                className="text-white/20 hover:text-red-400 text-xs font-sans transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

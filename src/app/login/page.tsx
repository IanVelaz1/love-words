"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/create";

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSent(true);
  }

  async function handleGuestLogin() {
    setGuestLoading(true);

    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      toast.error(error.message);
      setGuestLoading(false);
      return;
    }

    router.push(redirectTo);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-linear-to-br from-[#0D0A0E] via-[#1a0a14] to-[#0d1020]">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <Link href="/">
            <p className="text-[#D4A843] text-sm tracking-widest uppercase font-sans">
              Love Words
            </p>
          </Link>
          <h1 className="font-serif text-2xl text-white italic">
            Welcome back
          </h1>
        </div>

        {sent ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-3">
            <p className="text-white text-base font-sans">Check your email</p>
            <p className="text-white/50 text-sm font-sans">
              We sent a magic link to{" "}
              <span className="text-white/80">{email}</span>. Click it to sign
              in.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-white/70 font-sans text-sm"
                >
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:ring-[#C97B84] focus:border-[#C97B84]"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || guestLoading}
                className="w-full bg-[#C97B84] hover:bg-[#b86a73] text-white rounded-xl py-5 font-sans"
              >
                {loading ? "Sending…" : "Send magic link"}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/25 text-xs font-sans">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Guest option */}
            <div className="space-y-2">
              <button
                onClick={handleGuestLogin}
                disabled={loading || guestLoading}
                className="w-full py-3 rounded-xl border border-white/10 text-white/50
                           hover:border-white/20 hover:text-white/70
                           text-sm font-sans transition-all disabled:opacity-40"
              >
                {guestLoading ? "Starting session…" : "Continue as guest"}
              </button>
              <p className="text-white/25 text-xs text-center font-sans leading-relaxed">
                No account needed. Links still work — but history isn&apos;t
                saved after you close the tab.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

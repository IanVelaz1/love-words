"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#0D0A0E] via-[#1a0a14] to-[#0d1020]">
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
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70 font-sans text-sm">
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
              disabled={loading}
              className="w-full bg-[#C97B84] hover:bg-[#b86a73] text-white rounded-xl py-5 font-sans"
            >
              {loading ? "Sending…" : "Send magic link"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}

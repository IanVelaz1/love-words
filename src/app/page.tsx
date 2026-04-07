import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-[#0D0A0E] via-[#1a0a14] to-[#0d1020]">
      <div className="max-w-xl w-full text-center space-y-8">
        {/* Logo mark */}
        <div className="space-y-2">
          <p className="text-[#D4A843] text-sm tracking-widest uppercase font-sans">
            Love Words
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-white leading-tight italic">
            Say it with your voice.
          </h1>
          <p className="text-white/50 font-sans text-base mt-3 leading-relaxed">
            Record your words. Add music. Send a link that plays your voice
            with captions — a living letter for someone you love.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 items-center">
          <Link href="/create">
            <Button
              size="lg"
              className="bg-[#C97B84] hover:bg-[#b86a73] text-white font-sans px-10 py-6 text-base rounded-full transition-all"
            >
              Create a Love Word
            </Button>
          </Link>
          <Link
            href="/login"
            className="text-white/40 text-sm hover:text-white/70 transition-colors font-sans"
          >
            Sign in
          </Link>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { step: "01", label: "Record your voice" },
            { step: "02", label: "Add background music" },
            { step: "03", label: "Share a link" },
          ].map(({ step, label }) => (
            <div key={step} className="text-center space-y-2">
              <p className="text-[#D4A843] text-xs font-sans tracking-widest">{step}</p>
              <p className="text-white/60 text-xs font-sans">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

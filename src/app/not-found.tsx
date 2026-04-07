import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-[#0D0A0E] via-[#1a0a14] to-[#0d1020]">
      <div className="text-center space-y-6">
        <p className="text-[#D4A843] text-sm tracking-widest uppercase font-sans">
          Love Words
        </p>
        <h1 className="font-serif italic text-3xl text-white">
          This link doesn&apos;t exist.
        </h1>
        <p className="text-white/40 text-sm font-sans">
          It may have expired or never existed.
        </p>
        <Link
          href="/"
          className="inline-block text-white/50 hover:text-white text-sm font-sans underline underline-offset-4 transition-colors"
        >
          Create your own →
        </Link>
      </div>
    </main>
  );
}

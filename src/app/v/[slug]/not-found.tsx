import Link from "next/link";

export default function SlugNotFound() {
  return (
    <div className="viewer-gradient min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center space-y-6">
        <p className="text-[#D4A843] text-sm tracking-widest uppercase font-sans">
          Love Words
        </p>
        <h1 className="font-serif italic text-3xl text-white">
          This love word doesn&apos;t exist.
        </h1>
        <p className="text-white/40 text-sm font-sans leading-relaxed">
          It may have expired or the link is incorrect.
        </p>
        <Link
          href="/"
          className="inline-block text-white/50 hover:text-white text-sm font-sans underline underline-offset-4 transition-colors"
        >
          Create your own →
        </Link>
      </div>
    </div>
  );
}

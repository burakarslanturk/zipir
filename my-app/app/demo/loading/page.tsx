"use client";

export default function LoadingPreview() {
  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-6xl sm:text-7xl font-nunito font-black text-violet-600 animate-pulse tracking-tight select-none">
          ZIPIR<span className="text-violet-400 italic">!</span>
        </h1>

        <p className="text-slate-400 font-medium text-base tracking-widest uppercase select-none">
          Yükleniyor...
        </p>
      </div>

      <a
        href="/demo"
        className="absolute bottom-8 text-xs text-slate-400 hover:text-slate-600 transition-colors tracking-wide"
      >
        ← Demo'ya dön
      </a>
    </div>
  );
}

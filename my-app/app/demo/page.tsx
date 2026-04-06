import React from 'react';

export default function GameUIDemo() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* 1. Üst Bar (Header) */}
      <header className="w-full max-w-4xl mx-auto px-4 py-8 relative flex items-center justify-between">
        {/* Sol: Logo */}
        <div className="flex-1 flex justify-start">
          <div className="text-4xl sm:text-5xl font-black text-violet-500 tracking-tight">
            ZIPIR
          </div>
        </div>

        {/* Orta: Soru Sayacı */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden sm:flex items-center justify-center font-medium text-slate-500 bg-slate-200/50 px-5 py-2 rounded-full text-base">
          Soru: <span className="text-slate-700 font-bold ml-1.5">4 / 14</span>
        </div>

        {/* Sağ: Puan ve Süre */}
        <div className="flex-1 flex justify-end">
          <div className="flex flex-col items-end sm:flex-row sm:items-center py-2 px-4 bg-white shadow-sm rounded-xl border border-slate-100 gap-2 sm:gap-5">
            <div className="text-base font-semibold text-slate-600">
              Puan: <span className="text-violet-600 font-bold text-lg sm:text-xl">2400</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-slate-200"></div>
            <div className="text-base font-semibold text-slate-600 flex items-center gap-2">
              <span className="text-xl">⏱️</span>
              <span className="font-bold text-lg sm:text-xl w-14 text-right font-mono">02:45</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobil Soru Sayacı (Küçük ekranlar için başlığın altına alıyoruz) */}
      <div className="sm:hidden flex justify-center mb-6 mt-2">
        <div className="font-medium text-slate-500 bg-slate-200/50 px-5 py-2 rounded-full text-base">
          Soru: <span className="text-slate-700 font-bold ml-1.5">4 / 14</span>
        </div>
      </div>

      {/* 2. Ana Oyun Alanı (Merkez) */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 flex flex-col justify-center pb-20">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-10 flex flex-col items-center relative">
          
          {/* Soru Değeri Etiketi */}
          <div className="absolute -top-4 bg-gradient-to-r from-violet-500 to-violet-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm uppercase tracking-wide">
            Bu sorunun değeri: 600 Puan
          </div>

          {/* Soru / İpucu Metni */}
          <div className="mt-8 mb-10 w-full text-center">
            <h2 className="text-2xl sm:text-3xl font-serif italic text-slate-700 leading-snug">
              "Zamanla yıpranarak eskimiş, değerini yitirmiş olan şey."
            </h2>
          </div>

          {/* Harf Kutuları (Word Boxes) */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
            {/* 7 harfli kelime örneği: Y _ P _ A _ N */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-violet-50 border-2 border-violet-200 text-2xl sm:text-3xl font-bold text-violet-700 shadow-sm">
              Y
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-slate-50 border-2 border-slate-200 text-2xl sm:text-3xl font-bold text-slate-400">
              {/* Boş */}
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-violet-50 border-2 border-violet-200 text-2xl sm:text-3xl font-bold text-violet-700 shadow-sm">
              P
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-slate-50 border-2 border-slate-200 text-2xl sm:text-3xl font-bold text-slate-400">
              {/* Boş */}
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-violet-50 border-2 border-violet-200 text-2xl sm:text-3xl font-bold text-violet-700 shadow-sm">
              A
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-slate-50 border-2 border-slate-200 text-2xl sm:text-3xl font-bold text-slate-400">
              {/* Boş */}
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-violet-50 border-2 border-violet-200 text-2xl sm:text-3xl font-bold text-violet-700 shadow-sm">
              N
            </div>
          </div>

          {/* 3. Kontroller (Butonlar) */}
          <div className="flex flex-col sm:flex-row items-center justify-center w-full gap-4 sm:gap-6 mt-4">
            {/* Harf Al Butonu */}
            <button className="w-full sm:w-auto flex flex-col items-center justify-center group px-8 py-3.5 rounded-xl border-2 border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 hover:border-violet-300 transition-all active:scale-95">
              <span className="font-bold text-lg">Harf Al</span>
              <span className="text-xs font-semibold opacity-70 mt-0.5 group-hover:opacity-100 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
                </svg>
                100 Puan
              </span>
            </button>

            {/* Cevapla Butonu */}
            <button className="w-full sm:w-auto flex flex-col items-center justify-center px-10 py-3.5 rounded-xl bg-violet-500 text-white shadow-md shadow-violet-200 hover:bg-violet-600 hover:shadow-lg hover:shadow-violet-300 transition-all active:scale-95">
              <span className="font-bold text-lg">Cevapla</span>
              <span className="text-xs font-medium text-violet-100 mt-0.5">
                Tahmini Gir
              </span>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

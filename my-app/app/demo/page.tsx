import React from 'react';

export default function SplashDemo() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      
      {/* 1. Marka Alanı */}
      <div className="flex flex-col items-center text-center">
        <h1 className="text-6xl sm:text-7xl font-black text-violet-600 tracking-tight drop-shadow-sm">
          ZIPIR
        </h1>
        <p className="mt-3 text-lg sm:text-xl text-slate-500 font-light tracking-wide">
          Günlük Kelime Bulmaca Oyunu
        </p>
      </div>

      {/* 2. Kurallar Kartı */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-10 w-full max-w-lg mt-10 mb-10 transform transition-all hover:shadow-2xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-8 text-center pb-4 border-b border-slate-100">
          Nasıl Oynanır?
        </h2>
        
        <ul className="space-y-6">
          {/* Kural 1: Hedef */}
          <li className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-violet-100 text-violet-600 p-3 rounded-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <div className="pt-1">
              <p className="text-slate-600 font-medium text-lg leading-snug">
                Toplam <strong className="text-violet-600">14 kelime</strong> sorulur.
              </p>
            </div>
          </li>

          {/* Kural 2: Zaman */}
          <li className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-amber-100 text-amber-600 p-3 rounded-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="pt-1">
              <p className="text-slate-600 font-medium text-lg leading-snug">
                Tüm kelimeler için toplam <strong className="text-amber-600">4 dakika</strong> süreniz vardır.
              </p>
            </div>
          </li>

          {/* Kural 3: Harf Alma */}
          <li className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-blue-100 text-blue-600 p-3 rounded-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>
              </svg>
            </div>
            <div className="pt-1">
              <p className="text-slate-600 font-medium text-lg leading-snug">
                <strong className="text-slate-800">"Harf Al"</strong> butonu rastgele bir harf açar ama <strong className="text-red-500">-100 puan</strong> düşer.
              </p>
            </div>
          </li>

          {/* Kural 4: Cevaplama */}
          <li className="flex items-start gap-4">
            <div className="flex-shrink-0 bg-emerald-100 text-emerald-600 p-3 rounded-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" ry="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M7 16h10"/>
              </svg>
            </div>
            <div className="pt-1">
              <p className="text-slate-600 font-medium text-lg leading-snug">
                <strong className="text-slate-800">"Cevapla"</strong> butonu ana süreyi durdurur, yazmanız için <strong className="text-emerald-600">20 saniye</strong> verir.
              </p>
            </div>
          </li>
        </ul>
      </div>

      {/* 3. Aksiyon Butonu */}
      <button className="w-full max-w-sm px-10 py-5 bg-violet-600 hover:bg-violet-700 text-white text-xl sm:text-2xl font-bold rounded-full shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transform hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3">
        <span>Oyuna Başla</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      </button>

    </div>
  );
}

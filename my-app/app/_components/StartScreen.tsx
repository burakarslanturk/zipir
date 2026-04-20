"use client";

import { HowToPlayContent } from "./HowToPlayContent";

/**
 * Giriş ekranı (Splash screen) bileşeni için props.
 */
interface StartScreenProps {
  /** Oyuna başlat butonuna tıklandığında çağrılır */
  onStart: () => void;
  /** Nasıl Oynanır butonuna tıklandığında çağrılır */
  onShowHowToPlay: () => void;
  /** Ayarlar butonuna tıklandığında çağrılır */
  onShowSettings: () => void;
  /** Geri sayım değeri (3, 2, 1) - null ise gösterilmez */
  countdown: number | null;
  /** Nasıl Oynanır modalı açık mı? */
  showHowToPlay: boolean;
  /** Nasıl Oynanır modalı kapatıldığında çağrılır */
  onCloseHowToPlay: () => void;
}

/**
 * Oyun başlamadan önce gösterilen giriş ekranı.
 * Oyuna başlama butonu, Nasıl Oynanır ve Ayarlar erişimi sunar.
 * Geri sayım overlay'ini de içerir.
 */
export function StartScreen({ 
  onStart, 
  onShowHowToPlay, 
  onShowSettings,
  countdown,
  showHowToPlay,
  onCloseHowToPlay
}: StartScreenProps) {
  return (
    <>
      {/* Floating Header */}
      <div className="fixed top-0 left-0 w-full z-40 pt-2 sm:pt-4 flex justify-center pointer-events-none">
        <div className="w-full max-w-4xl px-4 flex justify-center">
          <header className="pointer-events-auto w-full bg-[var(--card)]/90 backdrop-blur-md shadow-md shadow-[var(--slate-200)]/50 border border-[var(--slate-200)] rounded-2xl px-2 py-2 sm:px-3 flex items-center justify-between gap-1 sm:gap-4">
            {/* Sol: Ayarlar Butonu */}
            <div className="flex-1 flex justify-start shrink-0">
              <button
                onClick={onShowSettings}
                aria-label="Ayarlar"
                className="p-2 rounded-xl text-[var(--slate-400)] hover:text-[var(--violet-600)] hover:bg-[var(--violet-50)] active:scale-95 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>

            {/* Orta: Logo */}
            <div className="flex justify-center shrink-1 px-1 sm:px-2">
              <h1 className="text-3xl sm:text-4xl font-nunito font-black tracking-tight text-[var(--violet-600)]">
                ZIPIR<span className="text-[var(--violet-400)] italic">!</span>
              </h1>
            </div>

            {/* Sağ: boşluk dengeleyici */}
            <div className="flex-1 flex justify-end shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10" />
            </div>
          </header>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-4 font-sans text-[var(--text)]">
        <p className="text-xs font-semibold text-[var(--slate-400)] tracking-widest uppercase mb-10 select-none">
          Günlük Kelime Oyunu
        </p>

        <button
          onClick={onStart}
          className="w-full max-w-xs px-8 py-5 bg-[var(--violet-600)] hover:bg-[var(--violet-700)] text-[var(--text-inverse)] text-xl font-bold rounded-2xl shadow-lg shadow-[var(--violet-200)] hover:shadow-xl hover:shadow-[var(--violet-300)] transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <span>Oyuna Başla</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/>
            <path d="m12 5 7 7-7 7"/>
          </svg>
        </button>

        <button
          onClick={onShowHowToPlay}
          className="mt-4 w-full max-w-xs px-8 py-3.5 bg-[var(--card)] hover:bg-[var(--bg-secondary)] text-[var(--slate-600)] hover:text-[var(--violet-600)] text-base font-semibold rounded-2xl border border-[var(--slate-200)] hover:border-[var(--violet-200)] shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Nasıl Oynanır?</span>
        </button>
      </div>

      {/* Nasıl Oynanır Modalı */}
      {showHowToPlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm"
          onClick={onCloseHowToPlay}
        >
          <div
            className="bg-[var(--card)] rounded-2xl w-full max-w-md shadow-xl border border-[var(--card-border)] relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--card-border)]">
              <h3 className="text-xl font-black text-[var(--text-primary)]">Nasıl Oynanır?</h3>
              <button
                onClick={onCloseHowToPlay}
                className="p-1.5 rounded-lg text-[var(--slate-400)] hover:text-[var(--slate-600)] hover:bg-[var(--slate-100)] active:scale-95 transition-all"
                aria-label="Kapat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="p-6">
              <HowToPlayContent />
            </div>
          </div>
        </div>
      )}

      {/* Geri Sayım Overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[var(--backdrop)] backdrop-blur-sm">
          <div key={countdown} className="relative flex items-center justify-center">
            <span
              aria-hidden
              className="absolute font-nunito font-black text-[var(--violet-400)] text-8xl md:text-9xl select-none leading-none pointer-events-none animate-countdown-ripple"
            >
              {countdown}
            </span>
            <span className="relative font-nunito font-black text-[var(--violet-600)] text-8xl md:text-9xl select-none leading-none tracking-tight drop-shadow-sm animate-countdown-pop">
              {countdown}
            </span>
          </div>

          <div className="flex gap-2">
            {[3, 2, 1].map((n) => (
              <span
                key={n}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  n >= countdown ? "bg-[var(--violet-500)] scale-125" : "bg-[var(--slate-200)]"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

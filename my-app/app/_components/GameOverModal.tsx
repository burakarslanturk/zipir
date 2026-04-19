"use client";

import { formatTime } from "../../lib/utils";

/**
 * Oyun bitti modalı bileşeni için props.
 */
interface GameOverModalProps {
  /** Oyuncunun toplam puanı */
  score: number;
  /** Kalan süre (saniye) */
  timeLeft: number;
  /** Oyuncunun rumuzu/nick'i */
  nickname: string;
  /** Rumuz değiştiğinde çağrılır */
  onNicknameChange: (value: string) => void;
  /** Skor kaydet formu gönderildiğinde çağrılır */
  onSave: (e: React.FormEvent) => void;
  /** Paylaş butonuna tıklandığında çağrılır */
  onShare: () => void;
  /** Skor kaydediliyor mu? (loading state) */
  isSaving: boolean;
  /** Sonuç panoya kopyalandı mı? (tooltip için) */
  isCopied: boolean;
}

/**
 * Oyun bittiğinde gösterilen modal.
 * Skor özeti, paylaş butonu ve liderlik tablosuna kayıt formu içerir.
 */
export function GameOverModal({
  score,
  timeLeft,
  nickname,
  onNicknameChange,
  onSave,
  onShare,
  isSaving,
  isCopied
}: GameOverModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">

        <h3 className="text-3xl font-black text-center text-slate-800 mb-5">Oyun Bitti!</h3>

        {/* Skor Kartı */}
        <div className="flex justify-center gap-6 mb-6 bg-slate-50 rounded-2xl p-5 border border-slate-100">
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Toplam Puan</p>
            <p className="text-4xl font-black text-violet-500">{score}</p>
          </div>
          <div className="w-px bg-slate-200"></div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Kalan Süre</p>
            <p className="text-4xl font-mono text-slate-700">{formatTime(timeLeft)}</p>
          </div>
        </div>

        {/* Birincil Aksiyon: Paylaş */}
        <div className="relative mb-6">
          {isCopied && (
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md shadow-md animate-in fade-in zoom-in duration-200">
              Panoya kopyalandı!
            </div>
          )}
          <button
            onClick={onShare}
            className="w-full px-6 py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md shadow-violet-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Sonucumu Paylaş
          </button>
        </div>

        {/* Ayırıcı */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-slate-100"></div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Skor Tablosuna Gir</span>
          <div className="flex-1 h-px bg-slate-100"></div>
        </div>

        {/* İkincil Aksiyon: Kaydet */}
        <form onSubmit={onSave} className="space-y-3">
          <input
            type="text"
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            placeholder="Ad veya Rumuz"
            maxLength={15}
            className="w-full px-4 py-3 text-center text-base font-semibold border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all"
            required
          />
          <button
            type="submit"
            disabled={isSaving || !nickname.trim()}
            className="w-full bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-violet-300 text-slate-500 hover:text-violet-600 font-semibold py-3 rounded-xl transition-all active:scale-95 text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {isSaving ? "Kaydediliyor..." : "Skoru Kaydet & Liderliğe Gir"}
          </button>
        </form>

      </div>
    </div>
  );
}

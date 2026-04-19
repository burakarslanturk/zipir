"use client";

import { LeaderboardRow, UserStats } from "../../types";
import { NextGameTimer } from "./NextGameTimer";

interface LeaderboardViewProps {
  data: LeaderboardRow[];
  userStats: UserStats | null;
  nickname: string;
  onShare: () => void;
  isCopied: boolean;
}

export function LeaderboardView({ data, userStats, nickname, onShare, isCopied }: LeaderboardViewProps) {
  return (
    <div className="w-full flex-1 flex flex-col justify-center items-center p-4">
      {/* Logo */}
      <h1 className="text-3xl sm:text-4xl font-nunito font-black tracking-tight text-violet-600 mb-3 drop-shadow-sm">
        ZIPIR<span className="text-violet-400 italic">!</span>
      </h1>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-black text-violet-500 mb-4 border-b border-slate-100 pb-3">
          Bugünün Liderlik Tablosu
        </h2>

        {/* Kişisel İstatistikler */}
        {userStats && (
          <div className="mb-4 pb-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Senin İstatistiklerin</p>
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              <div className="flex flex-col items-center bg-amber-50 rounded-xl p-2 sm:p-3 border border-amber-100">
                <span className="text-xl sm:text-2xl font-black text-amber-500">{userStats.streak}</span>
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 mt-0.5 leading-tight">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  Seri
                </span>
              </div>
              <div className="flex flex-col items-center bg-violet-50 rounded-xl p-2 sm:p-3 border border-violet-100">
                <span className="text-xl sm:text-2xl font-black text-violet-600">{userStats.bestScore}</span>
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-violet-500 mt-0.5 leading-tight">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  En İyi
                </span>
              </div>
              <div className="flex flex-col items-center bg-blue-50 rounded-xl p-2 sm:p-3 border border-blue-100">
                <span className="text-xl sm:text-2xl font-black text-blue-500">{userStats.avgScore}</span>
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-blue-500 mt-0.5 leading-tight">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                  Ortalama
                </span>
              </div>
              <div className="flex flex-col items-center bg-emerald-50 rounded-xl p-2 sm:p-3 border border-emerald-100">
                <span className="text-xl sm:text-2xl font-black text-emerald-600">{userStats.totalGames}</span>
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 mt-0.5 leading-tight">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="10 8 16 12 10 16 10 8"/>
                  </svg>
                  Toplam
                </span>
              </div>
            </div>
          </div>
        )}

        {data.length === 0 ? (
          <p className="text-slate-500 py-8">Henüz bir skor kaydedilmemiş.</p>
        ) : (
          <div className="w-full max-h-48 sm:max-h-56 overflow-y-auto pr-2 overflow-x-auto">
            <table className="w-full text-left border-collapse cursor-default text-sm sm:text-base">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="bg-slate-100 text-slate-600 text-xs sm:text-sm">
                  <th className="py-2 px-3 rounded-tl-lg font-semibold">#</th>
                  <th className="py-2 px-3 font-semibold">Oyuncu</th>
                  <th className="py-2 px-3 font-semibold text-center">Puan</th>
                  <th className="py-2 px-3 rounded-tr-lg font-semibold text-right">Süre</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => {
                  const isMe = nickname && item.nickname === nickname;
                  return (
                    <tr key={idx} className={`border-b last:border-none transition-colors ${isMe ? "bg-violet-50 border-violet-100" : "border-slate-50 hover:bg-slate-50"}`}>
                      <td className={`py-2 px-3 font-medium ${isMe ? "text-violet-600" : "text-slate-500"}`}>{idx + 1}</td>
                      <td className={`py-2 px-3 font-bold ${isMe ? "text-violet-700" : "text-slate-700"}`}>
                        {item.nickname}
                        {isMe && <span className="ml-1.5 text-[10px] font-semibold text-violet-400 uppercase tracking-wide">(sen)</span>}
                      </td>
                      <td className={`py-2 px-3 font-black text-center ${isMe ? "text-violet-600" : "text-violet-600"}`}>{item.score}</td>
                      <td className={`py-2 px-3 font-mono text-right ${isMe ? "text-violet-500" : "text-slate-500"}`}>{item.time_left} sn</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
          <NextGameTimer />

          <div className="relative">
            {isCopied && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-md shadow-md animate-in fade-in zoom-in duration-200">
                Panoya kopyalandı!
              </div>
            )}
            <button
              onClick={onShare}
              className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-violet-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Sonucumu Paylaş
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

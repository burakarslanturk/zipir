"use client";

import { useState, useEffect } from "react";

export function NextGameTimer() {
  const [timeLeftStr, setTimeLeftStr] = useState<string>("--:--:--");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const turkeyNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      const nextMidnight = new Date(
        Date.UTC(turkeyNow.getUTCFullYear(), turkeyNow.getUTCMonth(), turkeyNow.getUTCDate() + 1, 0, 0, 0)
        - 3 * 60 * 60 * 1000
      );
      const diffMs = nextMidnight.getTime() - now.getTime();

      if (diffMs <= 0) {
        return "00:00:00";
      }

      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
      const seconds = Math.floor((diffMs / 1000) % 60);

      const hh = String(hours).padStart(2, "0");
      const mm = String(minutes).padStart(2, "0");
      const ss = String(seconds).padStart(2, "0");

      return `${hh}:${mm}:${ss}`;
    };

    setTimeLeftStr(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeftStr(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center sm:items-start">
      <p className="text-xs font-semibold text-slate-400 mb-0.5 tracking-wider uppercase">
        Yeni Oyuna Kalan
      </p>
      <div className="text-xl sm:text-2xl font-bold text-violet-600 font-mono tracking-tight">
        {timeLeftStr}
      </div>
    </div>
  );
}

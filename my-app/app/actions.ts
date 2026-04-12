"use server";

import { supabase } from "../lib/supabase";

export async function saveScoreAction(nickname: string, score: number, timeLeft: number, userId: string) {
  if (score > 9800) {
    return { success: false, error: "Geçersiz skor. Maksimum alınabilecek puan 9800'dür." };
  }

  if (timeLeft > 240) {
    return { success: false, error: "Geçersiz süre. Kalan süre 240 saniyeden fazla olamaz." };
  }

  if (!nickname || nickname.trim().length === 0) {
    return { success: false, error: "Lütfen geçerli bir kullanıcı adı girin." };
  }

  if (!userId || userId.trim().length === 0) {
    return { success: false, error: "Geçersiz kullanıcı kimliği." };
  }

  const safeNickname = nickname.trim().substring(0, 25);

  try {
    const today = new Date();
    const yyyy = today.getUTCFullYear();
    const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(today.getUTCDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    // Aynı kullanıcı bugün zaten kaydetmiş mi?
    const { data: existing } = await supabase
      .from("leaderboard")
      .select("id")
      .eq("user_id", userId)
      .eq("game_date", formattedDate)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Bugünkü skorunu zaten kaydettin!" };
    }

    const { error } = await supabase
      .from("leaderboard")
      .insert([
        {
          nickname: safeNickname,
          score: score,
          time_left: timeLeft,
          game_date: formattedDate,
          user_id: userId,
        }
      ]);

    if (error) {
      // Unique constraint ihlali (race condition durumu)
      if (error.code === "23505") {
        return { success: false, error: "Bugünkü skorunu zaten kaydettin!" };
      }
      console.error("Supabase kayıt hatası:", error);
      return { success: false, error: "Skor veritabanına kaydedilemedi." };
    }

    return { success: true };
  } catch (err) {
    console.error("Server Action Hatası:", err);
    return { success: false, error: "Beklenmeyen bir sunucu hatası oluştu." };
  }
}

export async function getUserStatsAction(userId: string) {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("score, game_date")
      .eq("user_id", userId)
      .order("game_date", { ascending: false });

    if (error || !data || data.length === 0) return null;

    const totalGames = data.length;
    const bestScore = Math.max(...data.map((r) => r.score));
    const avgScore = Math.round(data.reduce((sum, r) => sum + r.score, 0) / totalGames);

    // Streak hesaplama: bugünden geriye ardışık gün sayısı
    const playedDates = new Set(data.map((r) => r.game_date));

    const today = new Date();
    let streak = 0;
    let cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    while (true) {
      const dateStr = cursor.toISOString().split("T")[0];
      if (playedDates.has(dateStr)) {
        streak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      } else {
        break;
      }
    }

    return { totalGames, bestScore, avgScore, streak };
  } catch (err) {
    console.error("getUserStatsAction hatası:", err);
    return null;
  }
}

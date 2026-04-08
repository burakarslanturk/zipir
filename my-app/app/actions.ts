"use server";

import { supabase } from "../lib/supabase";

export async function saveScoreAction(nickname: string, score: number, timeLeft: number) {
  // 1. Matematiksel Doğrulamalar (Validation)
  // Kurallar: Maksimum puan 9800, Maksimum kalan süre 240
  if (score > 9800) {
    return { success: false, error: "Geçersiz skor. Maksimum alınabilecek puan 9800'dür." };
  }

  if (timeLeft > 240) {
    return { success: false, error: "Geçersiz süre. Kalan süre 240 saniyeden fazla olamaz." };
  }

  // 2. Kullanıcı Adı Filtresi
  if (!nickname || nickname.trim().length === 0) {
    return { success: false, error: "Lütfen geçerli bir kullanıcı adı girin." };
  }

  // Kötü niyetli uzun metinleri kırparak engelliyoruz (max 25 karakter)
  const safeNickname = nickname.trim().substring(0, 25);

  try {
    // Bugünün tarihini UTC olarak hesaplıyoruz
    const today = new Date();
    const yyyy = today.getUTCFullYear();
    const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(today.getUTCDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    // Veritabanına Kayıt İşlemi
    const { error } = await supabase
      .from("leaderboard")
      .insert([
        {
          nickname: safeNickname,
          score: score,
          time_left: timeLeft,
          game_date: formattedDate
        }
      ]);

    if (error) {
      console.error("Supabase kayıt hatası:", error);
      return { success: false, error: "Skor veritabanına kaydedilemedi." };
    }

    return { success: true };
  } catch (err) {
    console.error("Server Action Hatası:", err);
    return { success: false, error: "Beklenmeyen bir sunucu hatası oluştu." };
  }
}

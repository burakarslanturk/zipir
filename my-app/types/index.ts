/**
 * API'den gelen soru/cevap çifti.
 * word: Şifrelenmiş veya şifresiz kelime (client'ta çözülür)
 * clue: Kullanıcıya gösterilen ipucu/soru metni
 */
export interface Question {
  id?: string;
  word: string;
  clue: string;
  game_date?: string;
}

/**
 * Liderlik tablosu (leaderboard) için satır kaydı.
 * Supabase "leaderboard" tablosu şeması ile eşleşir.
 */
export interface LeaderboardRow {
  id?: string;
  nickname: string;
  score: number;
  time_left: number;
  game_date: string;
  user_id?: string;
}

/**
 * Kullanıcının tüm zamanların istatistikleri.
 * getUserStatsAction tarafından hesaplanır.
 */
export interface UserStats {
  totalGames: number;
  bestScore: number;
  avgScore: number;
  streak: number;
}

/** Cevaplama aşamasındaki durum: boşta, doğru, yanlış */
export type AnswerStatus = "idle" | "correct" | "wrong";

/** Ayarlar modalındaki aktif sekme */
export type SettingsTab = "ses" | "tema" | "nasil";

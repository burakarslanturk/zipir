/**
 * Ses dosyasını oynatır (eğer ses etkinse).
 * @param src - Ses dosyasının yolu (örn: '/sounds/correct.mp3')
 * @param enabled - Sesin etkin olup olmadığı
 */
export function playSound(src: string, enabled: boolean) {
  if (!enabled) return;
  const audio = new Audio(src);
  audio.volume = 0.6;
  audio.play().catch(() => {});
}

/**
 * LocalStorage'dan kullanıcı ID'sini alır, yoksa oluşturur.
 * Her cihazda benzersiz bir kullanıcı tanımlayıcısı sağlar.
 * @returns Kullanıcı ID'si (UUID formatında)
 */
export function getOrCreateUserId(): string {
  const KEY = "zipir_user_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

/**
 * Saniye cinsinden süreyi MM:SS formatına çevirir.
 * @param seconds - Toplam saniye
 * @returns "M:SS" formatında süre (örn: "3:45")
 */
export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Türkiye saatine göre bugünün tarihini YYYY-MM-DD formatında döndürür.
 * Oyun her gün Türkiye saatiyle gece yarısı sıfırlanır.
 * @returns "YYYY-MM-DD" formatında tarih
 */
export function getTurkeyDateStr(): string {
  const d = new Date();
  const t = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Türkiye saatine göre tarihi parçalar halinde döndürür.
 * @returns Yıl, ay, gün ve birleştirilmiş format
 */
export function getTurkeyFormattedDate(): { yyyy: string; mm: string; dd: string; formattedDate: string } {
  const now = new Date();
  const turkeyTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const yyyy = String(turkeyTime.getUTCFullYear());
  const mm = String(turkeyTime.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(turkeyTime.getUTCDate()).padStart(2, "0");
  const formattedDate = `${yyyy}-${mm}-${dd}`;
  return { yyyy, mm, dd, formattedDate };
}

export function playSound(src: string, enabled: boolean) {
  if (!enabled) return;
  const audio = new Audio(src);
  audio.volume = 0.6;
  audio.play().catch(() => {});
}

export function getOrCreateUserId(): string {
  const KEY = "zipir_user_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getTurkeyDateStr(): string {
  const d = new Date();
  const t = new Date(d.getTime() + 3 * 60 * 60 * 1000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

export function getTurkeyFormattedDate(): { yyyy: string; mm: string; dd: string; formattedDate: string } {
  const now = new Date();
  const turkeyTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const yyyy = String(turkeyTime.getUTCFullYear());
  const mm = String(turkeyTime.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(turkeyTime.getUTCDate()).padStart(2, "0");
  const formattedDate = `${yyyy}-${mm}-${dd}`;
  return { yyyy, mm, dd, formattedDate };
}

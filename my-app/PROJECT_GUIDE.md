# ZIPIR! - Proje Geliştirici Dokümantasyonu

> Günlük kelime oyunu projesi - Next.js, React, TypeScript, Supabase

## 1. Proje Genel Bakış

**ZIPIR!**, Wordle'dan esinlenen günlük bir kelime oyunudur. Oyuncular her gün 14 farklı soruyu cevaplayarak puan toplar ve liderlik tablosunda yarışır.

### Temel Özellikler
- Günlük 14 soru (4-10 harfli kelimelerden 2'şer adet)
- 4 dakika toplam oyun süresi
- Harf alma mekaniği (-100 puan per harf)
- 30 saniyelik cevaplama süresi
- Liderlik tablosu ve kullanıcı istatistikleri
- Skor paylaşma özelliği
- Mobil uyumlu sanal klavye

---

## 2. Teknoloji Stack'i

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 16.2.2 (App Router) |
| UI Kütüphanesi | React 19.2.4 |
| Dil | TypeScript 5 |
| Stil | Tailwind CSS 4 |
| Veritabanı | Supabase (PostgreSQL) |
| Analytics | Vercel Analytics |
| Fontlar | Nunito, Outfit (Google Fonts) |

### Bağımlılıklar
```json
{
  "@supabase/supabase-js": "^2.102.0",
  "@vercel/analytics": "^2.0.1",
  "crypto-js": "^4.2.0",
  "next-themes": "^0.4.6"
}
```

---

## 3. Proje Yapısı

```
my-app/
├── app/                          # Next.js App Router
│   ├── _components/              # UI Bileşenleri
│   │   ├── GameOverModal.tsx     # Oyun sonu modalı
│   │   ├── HowToPlayContent.tsx  # Nasıl oynanır içeriği
│   │   ├── LeaderboardView.tsx   # Liderlik tablosu
│   │   ├── NextGameTimer.tsx     # Yeni oyuna kalan süre
│   │   ├── SettingsModal.tsx     # Ayarlar modalı
│   │   ├── StartScreen.tsx       # Giriş ekranı
│   │   └── VirtualKeyboard.tsx   # Mobil sanal klavye
│   ├── api/questions/route.ts    # Sorular API endpoint
│   ├── demo/                     # Demo/örnek sayfalar
│   │   ├── page.tsx              # Demo oyun ekranı
│   │   └── loading/page.tsx      # Yükleme ekranı preview
│   ├── actions.ts                # Server Actions (skor kaydetme)
│   ├── globals.css               # Global stiller
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Ana oyun sayfası (1000+ satır)
├── lib/                          # Yardımcı kütüphaneler
│   ├── supabase.ts               # Supabase client
│   └── utils.ts                  # Yardımcı fonksiyonlar
├── types/                        # TypeScript tipleri
│   └── index.ts                  # Tüm tip tanımları
├── public/                       # Statik dosyalar
│   └── sounds/                   # Ses efektleri
│       ├── correct.mp3
│       ├── wrong.mp3
│       ├── harfal.mp3
│       └── suresonu.mp3
└── .env.local                    # Çevre değişkenleri
```

---

## 4. Veritabanı Şeması (Supabase)

### Tablo: `questions`
Günlük soruların saklandığı tablo.

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | UUID (PK) | Benzersiz ID |
| `word` | TEXT | Cevap kelimesi (düz metin) |
| `clue` | TEXT | Soru/ipucu metni |
| `game_date` | DATE | Oyun tarihi (YYYY-MM-DD) |

**Örnek:**
```sql
INSERT INTO questions (word, clue, game_date) 
VALUES ('KİTAP', 'Okunan şey', '2024-01-15');
```

### Tablo: `leaderboard`
Skorların saklandığı tablo.

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| `id` | UUID (PK) | Benzersiz ID |
| `nickname` | TEXT | Oyuncu rumuzu |
| `score` | INTEGER | Toplam puan |
| `time_left` | INTEGER | Kalan süre (saniye) |
| `game_date` | DATE | Oyun tarihi |
| `user_id` | TEXT | Cihaz ID (UUID) |

**Constraints:**
- Unique: `(user_id, game_date)` - Her kullanıcı günde 1 skor kaydedebilir

---

## 5. Oyun Mekaniği ve Kurallar

### Oyun Akışı
```
[Yükleme] → [Giriş Ekranı] → [Geri Sayım 3-2-1] → [Oyun] → [Sonuç/Kayıt] → [Liderlik]
```

### Puanlama Sistemi
- Her harf = **100 puan**
- Boş kelime puanı = `harf_sayısı × 100`
- Her alınan harf = **-100 puan** düşer
- Maksimum puan = **9800** (14 soru × ortalama 7 harf)

### Süre Mekaniği
1. **Toplam Süre:** 240 saniye (4 dakika)
2. **Cevaplama Süresi:** Her soru için 30 saniye
3. Süre dolduğunda oyun pas geçilir, potansiyel puan eksi (-) olarak eklenir

### Harf Alma Mantığı
```typescript
// Rastgele açılmamış harf seçilir
const unrevealedIndices = [...]; // Açılmamış indeksler
const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
setRevealedLetters([...revealedLetters, randomIndex]);
// Puan düşürülür: setScore(score - 100);
```

### Cevaplama Mantığı
```typescript
// Kullanıcı cevabı + açık harfler = tam kelime
let fullWord = "";
let typedIndex = 0;
for (let i = 0; i < currentQuestion.word.length; i++) {
  if (revealedLetters.includes(i)) {
    fullWord += currentQuestion.word[i];  // Açık harf
  } else {
    fullWord += userAnswer[typedIndex++] || "";  // Kullanıcı girdisi
  }
}

// Türkçe karşılaştırma (case-insensitive, locale-aware)
const isCorrect = fullWord.toLocaleLowerCase("tr-TR") === 
                  currentQuestion.word.toLocaleLowerCase("tr-TR");
```

---

## 6. Bileşenler ve Sorumlulukları

### `page.tsx` (Ana Bileşen - ~1000 satır)
Tüm oyun state'lerini ve mantığı içerir.

**Temel State'ler:**
```typescript
// Oyun Durumu
const [hasStarted, setHasStarted] = useState(false);
const [countdown, setCountdown] = useState<number | null>(null);
const [questions, setQuestions] = useState<Question[]>([]);
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [score, setScore] = useState(0);
const [timeLeft, setTimeLeft] = useState(240);
const [isGameActive, setIsGameActive] = useState(true);

// Cevaplama Durumu
const [isAnswering, setIsAnswering] = useState(false);
const [answerTimeLeft, setAnswerTimeLeft] = useState(30);
const [userAnswer, setUserAnswer] = useState("");
const [revealedLetters, setRevealedLetters] = useState<number[]>([]);
const [answerStatus, setAnswerStatus] = useState<AnswerStatus>("idle");

// UI Durumu
const [showGameOverModal, setShowGameOverModal] = useState(false);
const [showLeaderboard, setShowLeaderboard] = useState(false);
const [nickname, setNickname] = useState("");
const [isSoundEnabled, setIsSoundEnabled] = useState(true);
```

### `StartScreen.tsx`
Giriş ekranı, geri sayım overlay'i, Nasıl Oynanır modalı.

### `GameOverModal.tsx`
Oyun bittiğinde skor özeti, paylaş butonu, rumuz girişi.

### `LeaderboardView.tsx`
Skor kaydedildikten sonra gösterilir. İstatistikler + liderlik tablosu.

### `VirtualKeyboard.tsx`
Mobil cihazlarda (sm breakpoint altı) gösterilen Türkçe klavye.

### `SettingsModal.tsx`
3 sekme: Nasıl Oynanır, Ses, Tema.

### `NextGameTimer.tsx`
Türkiye saatine göre bir sonraki gece yarısına kalan süreyi gösterir.

---

## 7. State Yönetimi ve Persistency

### LocalStorage Kaydı
Oyun durumu sayfa yenilenince kaybolmaması için şifrelenerek saklanır.

```typescript
// Kaydetme (AES şifreleme)
const gameState = {
  date: formattedDate,           // Gün bilgisi (bugün değilse geçersiz)
  score,                        // Mevcut puan
  timeLeft,                     // Kalan süre
  currentQuestionIndex,         // Soru indeksi
  revealedLetters,              // Açık harfler
  isGameActive,                 // Oyun aktif mi
  showGameOverModal,            // Oyun bitti modalı
  showLeaderboard,              // Liderlik gösteriliyor mu
  nickname,                     // Kullanıcı rumuzu
  isAnswering,                  // Cevaplama modu
  answerStartTime               // Cevaplama başlangıç zamanı
};

const encrypted = CryptoJS.AES.encrypt(
  JSON.stringify(gameState), 
  ENCRYPTION_KEY
).toString();

localStorage.setItem("kelime_oyunu_save", encrypted);
```

### Kullanıcı ID
Her cihaz için benzersiz UUID:
```typescript
// lib/utils.ts
export function getOrCreateUserId(): string {
  const KEY = "zipir_user_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
```

---

## 8. API Routes ve Server Actions

### `GET /api/questions`
Günün sorularını getirir, cevapları şifreler.

```typescript
// app/api/questions/route.ts
export async function GET() {
  const { data } = await supabase
    .from('questions')
    .select('*')
    .eq('game_date', formattedDate)
    .limit(14);

  // Cevapları şifrele (client'ta çözülecek)
  const encrypted = data.map((q) => ({
    ...q,
    word: CryptoJS.AES.encrypt(q.word, ENCRYPTION_KEY).toString()
  }));

  return NextResponse.json({ questions: encrypted });
}
```

### `saveScoreAction` (Server Action)
Skor kaydetme mantığı.

```typescript
// app/actions.ts
export async function saveScoreAction(
  nickname: string, 
  score: number, 
  timeLeft: number, 
  userId: string
) {
  // Validasyon
  if (score > 9800) return { success: false, error: "Geçersiz skor" };
  if (timeLeft > 240) return { success: false, error: "Geçersiz süre" };

  // Bugün kaydedilmiş mi kontrolü
  const { data: existing } = await supabase
    .from("leaderboard")
    .select("id")
    .eq("user_id", userId)
    .eq("game_date", formattedDate)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Bugünkü skorunu zaten kaydettin!" };
  }

  // Kaydet
  await supabase.from("leaderboard").insert([{
    nickname, score, time_left: timeLeft, 
    game_date: formattedDate, user_id: userId
  }]);

  return { success: true };
}
```

---

## 9. Güvenlik Önlemleri

### 1. Cevap Şifreleme
- **API'de:** Cevaplar `CryptoJS.AES` ile şifrelenir
- **Client'ta:** Şifre çözülür (cevaplar asla açık network'te dolaşmaz)

### 2. Skor Validasyonu (Server-side)
```typescript
if (score > 9800) return { error: "Geçersiz skor" };
if (timeLeft > 240) return { error: "Geçersiz süre" };
```

### 3. Rate Limiting (Doğal)
- Her kullanıcı günde 1 skor kaydedebilir (DB unique constraint)

### 4. Input Sanitization
```typescript
const safeNickname = nickname.trim().substring(0, 25);
```

### 5. LocalStorage Şifreleme
Oyun durumu AES ile şifrelenir (kullanıcı sonuçları manipüle edemez).

---

## 10. Zamanlama ve Tarih Mantığı

### Türkiye Saati (UTC+3)
Tüm tarih hesaplamaları Türkiye saatine göre yapılır:

```typescript
export function getTurkeyDateStr(): string {
  const d = new Date();
  const t = new Date(d.getTime() + 3 * 60 * 60 * 1000);  // UTC+3 offset
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}
```

### Oyun Sıfırlanma
Her gün Türkiye saatiyle **00:00**'da:
1. Yeni sorular yüklenir
2. Eski localStorage verisi geçersiz olur (date kontrolü)
3. Yeni skor kaydedilebilir

### Bir Sonraki Oyun Geri Sayımı
```typescript
const nextMidnight = new Date(
  Date.UTC(turkeyNow.getUTCFullYear(), turkeyNow.getUTCMonth(), turkeyNow.getUTCDate() + 1, 0, 0, 0)
  - 3 * 60 * 60 * 1000  // UTC+3 offset geri al
);
```

---

## 11. Ses Efektleri

| Event | Dosya |
|-------|-------|
| Doğru cevap | `/sounds/correct.mp3` |
| Yanlış cevap | `/sounds/wrong.mp3` |
| Harf alma | `/sounds/harfal.mp3` |
| Süre bitimi | `/sounds/suresonu.mp3` |

### Kullanım
```typescript
import { playSound } from "../lib/utils";

playSound('/sounds/correct.mp3', isSoundEnabled);
```

---

## 12. Environment Variables

`.env.local` dosyasına eklenmeli:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Şifreleme (client-side ve server-side aynı olmalı)
NEXT_PUBLIC_ENCRYPTION_KEY=your-secret-key-min-16-chars
```

**Önemli:** `NEXT_PUBLIC_ENCRYPTION_KEY` hem client'ta hem server'da (API route) aynı olmalı.

---

## 13. Geliştirme ve Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn

### Kurulum
```bash
cd my-app
npm install
```

### Geliştirme Sunucusu
```bash
npm run dev
# http://localhost:3000
```

### Build
```bash
npm run build
npm start
```

---

## 14. Deployment

Projede özel bir konfigürasyon yok. Standart Next.js deployment:

### Vercel (Önerilen)
1. Repo'yu Vercel'e bağla
2. Environment variables'ları ekle
3. Auto-deploy aktif

### Diğer Platformlar
- `next.config.ts` basit tutuldu, output: 'export' gerektirmez
- SSR kullanılıyor (API routes + Server Actions)

---

## 15. Demo ve Test Sayfaları

### `/demo`
- Turuncu tema ile ayrılmış test ortamı
- Aynı oyun mantığı, farklı UI
- Liderlik tablosu yok

### `/demo/loading`
- Yükleme ekranının preview'u
- UI geliştirme için kullanılır

---

## 16. Sık Karşılaşılan Sorunlar

### 1. Şifreleme Hataları
`Malformed UTF-8 data` hatası alırsanız:
- `NEXT_PUBLIC_ENCRYPTION_KEY`'in client ve server'da aynı olduğundan emin olun
- Key minimum 16 karakter olmalı

### 2. Tarih Uyuşmazlıkları
- Tüm tarih hesaplamaları `getTurkeyDateStr()` kullanmalı
- UTC+3 offset'i unutmayın

### 3. State Persistency Sorunları
LocalStorage verisi bozulursa otomatik temizlenir (try-catch içinde)

### 4. Mobile Klavye
- `VirtualKeyboard` sadece `sm` breakpoint altında görünür
- Gerçek klavye ile çakışmaması için `hidden-answer-input` kullanılır

---

## 17. Geliştirme İpuçları

### Yeni Özellik Ekleme
1. State'i `page.tsx`'te tanımlayın
2. LocalStorage persistency'sini `useEffect`'e ekleyin
3. UI bileşenini `app/_components/` altına oluşturun
4. Tip tanımlarını `types/index.ts`'e ekleyin

### Soru Ekleme (Manuel)
Supabase dashboard'dan `questions` tablosuna:
```sql
INSERT INTO questions (word, clue, game_date) 
VALUES ('TEST', 'Test ipucu', '2024-01-20');
```

### Yeni Ses Efekti
1. MP3 dosyasını `public/sounds/` altına ekleyin
2. `playSound('/sounds/yeni-ses.mp3', isSoundEnabled)` kullanın

---

## 18. İletişim ve Notlar

- Proje React 19 ve Next.js 16 ile geliştirildi
- Tailwind CSS 4 kullanıyor (yeni @import syntax)
- Türkçe karakter desteği (toLocaleLowerCase("tr-TR")) kritik
- Tüm tarihler Türkiye saatine göre

---

**Son Güncelleme:** 2026-04-20
**Versiyon:** 0.1.0

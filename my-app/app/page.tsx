"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import CryptoJS from "crypto-js";
import { saveScoreAction, getUserStatsAction } from "./actions";

function getOrCreateUserId(): string {
  const KEY = "zipir_user_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

// Şifre çözmek için API'dekiyle aynı anahtarı kullanmalıyız (.env'den).
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY as string;

function NextGameTimer() {
  const [timeLeftStr, setTimeLeftStr] = useState<string>("--:--:--");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
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
    <div className="flex flex-col items-start px-2">
      <p className="text-xs font-semibold text-slate-500 mb-0.5 tracking-wider uppercase">
        YENİ OYUNA KALAN SÜRE
      </p>
      <div className="text-xl sm:text-2xl font-bold text-violet-600 font-mono tracking-tight">
        {timeLeftStr}
      </div>
    </div>
  );
}

const VirtualKeyboard = ({
  onKeyPress,
  onBackspace,
  onSubmit,
}: {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
}) => {
  const rows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
    ["Z", "X", "C", "V", "B", "N", "M", "Ö", "Ç"]
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-slate-200/95 backdrop-blur-md p-2 pb-8 sm:hidden z-50 animate-in slide-in-from-bottom border-t border-slate-300 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-2 max-w-lg mx-auto">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1.5">
            {rowIndex === 2 && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onBackspace(); }}
                className="flex-[1.5] bg-slate-400 text-white font-bold rounded-lg py-3.5 px-2 text-xs active:scale-95 transition-transform flex items-center justify-center shadow-sm"
              >
                SİL
              </button>
            )}
            
            {row.map((key) => (
              <button
                key={key}
                type="button"
                onClick={(e) => { e.preventDefault(); onKeyPress(key); }}
                className="flex-1 bg-white text-violet-700 font-bold text-sm rounded-lg py-3.5 shadow-sm active:scale-95 active:bg-violet-100 active:text-violet-800 transition-all flex items-center justify-center border border-slate-100"
              >
                {key}
              </button>
            ))}

            {rowIndex === 2 && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onSubmit(); }}
                className="flex-[2] bg-violet-600 text-white font-bold rounded-lg py-3.5 px-2 text-xs active:scale-95 transition-transform shadow-md flex items-center justify-center"
              >
                GÖNDER
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function GamePage() {
  // Splash ve oyun başlatma kontrolü
  const [hasStarted, setHasStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Veri durumu state'leri
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State tanımlamaları
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(240); // Toplam 4 dakika (240 saniye)
  const [isGameActive, setIsGameActive] = useState(true);
  const [revealedLetters, setRevealedLetters] = useState<number[]>([]);
  
  // Cevaplama aşaması için eklenen state'ler
  const [isAnswering, setIsAnswering] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [answerTimeLeft, setAnswerTimeLeft] = useState(30);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [isScoreAnimating, setIsScoreAnimating] = useState(false);

  // Ayarlar Modalı
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"ses" | "tema" | "nasil">("nasil");
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Sayfa kapalıyken cevap süresi dolduysa yükleme sonrası gecikmeyle işlem tetiklemek için
  const pendingTimeoutExpiredRef = useRef(false);

  // Puan değiştiğinde animasyon tetiklemek için etki
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize(); // set initial value
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (score > 0 || (score === 0 && questions.length > 0)) {
      setIsScoreAnimating(true);
      const timer = setTimeout(() => setIsScoreAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [score, questions.length]);

  // Geri sayım döngüsü
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 1) {
      const timer = setTimeout(() => setCountdown((prev) => (prev !== null ? prev - 1 : null)), 1000);
      return () => clearTimeout(timer);
    } else {
      // "1" animasyonu biter bitmez (450ms) overlay kapanır, oyun başlar
      const timer = setTimeout(() => {
        setCountdown(null);
        setHasStarted(true);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Oyun Sonu & Leaderboard State'leri
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [showToast, setShowToast] = useState(false); // Kopyalandı bildirimi için (genel)
  const [isCopied, setIsCopied] = useState(false); // Sadece leaderboard'daki buton için lokal toolitp

  // Kullanıcı istatistikleri
  const [userStats, setUserStats] = useState<{
    totalGames: number;
    bestScore: number;
    avgScore: number;
    streak: number;
  } | null>(null);

  const fetchLeaderboard = async (dateStr: string) => {
    try {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .eq("game_date", dateStr)
        .order("score", { ascending: false })
        .order("time_left", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Leaderboard çekilirken hata:", error);
        return;
      }
      
      if (data) {
        setLeaderboardData(data);
      }
    } catch (err) {
      console.error("Leaderboard hatası:", err);
    }
  };

  // Veri Çekme ve LocalStorage Kontrolü useEffect'i
  useEffect(() => {
    const fetchTodayQuestions = async () => {
      try {
        setIsLoading(true);
        // Bugünün tarihini YYYY-MM-DD olarak alma (UTC - Tüm dünyada aynı anda güncellenir)
        const today = new Date();
        const yyyy = today.getUTCFullYear();
        const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(today.getUTCDate()).padStart(2, "0");
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        const response = await fetch('/api/questions', { cache: 'no-store' });
        if (!response.ok) {
          console.error("Sorular alınırken HTTP hatası:", response.statusText);
          return;
        }

        const resData = await response.json();
        
        if (resData.error) {
          console.error("Sorular API'den alınırken hata:", resData.error);
          return;
        }

        let sorted: any[] = [];
        if (resData.questions && resData.questions.length > 0) {
          // Gelen şifreli kelimeleri cihazda (client'ta) çözüyoruz
          const decryptedData = resData.questions.map((q: any) => {
            try {
              const bytes = CryptoJS.AES.decrypt(q.word, ENCRYPTION_KEY);
              const originalWord = bytes.toString(CryptoJS.enc.Utf8);
              return { ...q, word: originalWord };
            } catch (err) {
              console.error("Şifre çözme hatası:", err);
              return q;
            }
          });

          // Gelen soruları cevap uzunluğuna göre sırala (4 harfliden 10 harfliye)
          sorted = decryptedData.sort((a: any, b: any) => a.word.length - b.word.length);
          setQuestions(sorted);
        }

        // LocalStorage Kontrolü ve Yükleme
        const savedRaw = localStorage.getItem("kelime_oyunu_save");
        let savedState = null;
        
        if (savedRaw) {
          try {
            // Önce verinin yeni şifreli formatta olduğunu varsayıp çözmeyi deneyelim
            const bytes = CryptoJS.AES.decrypt(savedRaw, ENCRYPTION_KEY);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedString) {
              throw new Error("Şifreli veri boş veya bozuk");
            }
            savedState = JSON.parse(decryptedString);
            
          } catch (e) {
            // Şifre çözülemiyorsa (Malformed UTF-8 hatası vb.) bu büyük ihtimalle 
            // güncelleme öncesinden kalma eski (şifresiz) veridir.
            console.warn("Şifreli veri okunamadı, eski formata bakılıyor...");
            try {
              // Eski şifresiz düz JSON verisi ise bunu okumayı dene
              savedState = JSON.parse(savedRaw);
            } catch (fallbackErr) {
              // Ne şifreli ne şifresiz, veri tamamen bozulmuş demektir
              console.error("LocalStorage verisi tamamen bozuk, temizleniyor...");
              localStorage.removeItem("kelime_oyunu_save");
            }
          }

          if (savedState) {
            // Sadece bugünün tarihi ise yükle, değilse yoksay
            if (savedState.date === formattedDate) {
              setScore(savedState.score ?? 0);
              setTimeLeft(savedState.timeLeft ?? 240);
              setCurrentQuestionIndex(savedState.currentQuestionIndex ?? 0);
              setRevealedLetters(savedState.revealedLetters ?? []);
              setNickname(savedState.nickname ?? "");
              
              // Eğer oyun daha önceden bitmişse (showLeaderboard = true ise)
              if (savedState.showLeaderboard) {
                setIsGameActive(false);
                setShowLeaderboard(true);
                setHasStarted(true); // Direkt liderlik tablosu başlasın
                fetchLeaderboard(formattedDate);
                // Sayfa yenilenince istatistikler kaybolmasın diye tekrar çek
                const userId = localStorage.getItem("zipir_user_id");
                if (userId) {
                  getUserStatsAction(userId).then((stats) => {
                    if (stats) setUserStats(stats);
                  });
                }
              } 
              // Eğer oynanırken yarım kalmışsa ve oyun bitmişse modal göster
              else if (savedState.showGameOverModal) {
                setIsGameActive(false);
                setShowGameOverModal(true);
                setHasStarted(true); // Direkt modal başlasın
              }
              else {
                setIsGameActive(savedState.isGameActive ?? true);

                // Cevaplama modundayken sayfa yenilendiyse zaman damgasıyla kontrol et
                if (savedState.isAnswering && savedState.answerStartTime) {
                  const elapsedSeconds = Math.floor((Date.now() - savedState.answerStartTime) / 1000);

                  if (elapsedSeconds < 30) {
                    // Süre henüz dolmamış: kaldığı yerden devam et
                    setIsAnswering(true);
                    setAnswerStartTime(savedState.answerStartTime);
                    setAnswerTimeLeft(30 - elapsedSeconds);
                  } else {
                    // Süre sayfa kapalıyken dolmuş: ceza uygula ve sonraki soruya geç
                    const savedIndex = savedState.currentQuestionIndex ?? 0;
                    const word = sorted[savedIndex]?.word ?? "";
                    const savedRevealed: number[] = savedState.revealedLetters ?? [];
                    const penalty = (word.length - savedRevealed.length) * 100;
                    setScore((savedState.score ?? 0) - penalty);
                    setRevealedLetters(Array.from({ length: word.length }, (_, i) => i));
                    setIsTransitioning(true);
                    setAnswerStatus("wrong");
                    pendingTimeoutExpiredRef.current = true;
                  }
                }

                // Oyun yarım kaldıysa, oynamaya devam etsin Splash görmeden
                if (savedState.currentQuestionIndex > 0 || savedState.score > 0 || (savedState.timeLeft && savedState.timeLeft < 240) || savedState.isAnswering) {
                  setHasStarted(true);
                }
              }
            }
          }
        }

      } catch (err) {
        console.error("Veri çekme işleminde hata oluştu:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayQuestions();
  }, []);

  // Ana oyun sayacı (isAnswering veya isTransitioning aktif değilse saymaya devam eder)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // Yükleme varsa sayaç başlamasın
    if (isLoading || questions.length === 0 || !hasStarted) return;

    if (isGameActive && !isAnswering && !isTransitioning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft <= 0) {
      setIsGameActive(false);
    }

    return () => clearInterval(timer);
  }, [isGameActive, isAnswering, isTransitioning, timeLeft, isLoading, questions.length, hasStarted]);

  // Cevaplama süresi 30 saniyeden geriye sayar
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isAnswering && answerTimeLeft > 0) {
      timer = setInterval(() => {
        setAnswerTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isAnswering && answerTimeLeft <= 0) {
      if (questions.length > 0 && currentQuestionIndex < questions.length) {
        const penalty = (questions[currentQuestionIndex].word.length - revealedLetters.length) * 100;
        handleWrongAnswer(penalty, true);
      }
    }

    return () => clearInterval(timer);
  }, [isAnswering, answerTimeLeft, questions, currentQuestionIndex, revealedLetters.length]);

  const currentQuestionWord = questions.length > 0 ? questions[currentQuestionIndex]?.word : "";

  // Sonraki soruya geçiş işlevini ortak bir fonksiyona aldım
  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => {
      setRevealedLetters([]);
      setUserAnswer("");
      setIsAnswering(false);
      setAnswerStartTime(null);
      setAnswerTimeLeft(30);
      setIsTransitioning(false); // Yeni soruya geçildi, süreyi tekrar akıtmaya başla
      setAnswerStatus("idle");
      
      if (prev < questions.length - 1) {
        return prev + 1;
      } else {
        setIsGameActive(false); // Oyun bitti
        return prev;
      }
    });
  };

  // Yanlış cevap veya süre bittiğinde tetiklenecek fonksiyon (Aşama 1 ve Aşama 2)
  const handleWrongAnswer = (penalty: number, isTimeout: boolean = false) => {
    setIsAnswering(false);
    setIsTransitioning(true);
    setScore((prev) => prev - penalty);
    setAnswerStatus("wrong");
    setIsShaking(true);

    // Aşama 2: 1.5 saniye yanlış girdiyi/süreyi gösterdikten sonra doğru cevabı göster
    setTimeout(() => {
      setIsShaking(false);
      setAnswerStatus("idle"); 
      setUserAnswer("");
      
      setRevealedLetters((prevRevealed) => {
        // Eğer indexler kelime uzunluğu kadar değilse, doldur
        const allIndices = Array.from({ length: currentQuestionWord.length }, (_, i) => i);
        return allIndices;
      });
      
      // Aşama 3: 1.5 saniye sonra da yeni soruya geç
      setTimeout(() => {
        handleNextQuestion();
      }, 1500);
    }, 1500);
  };

  // Doğru cevap verildiğinde tetiklenecek fonksiyon (Aşama 1 ve Yeni Soru)
  const handleCorrectAnswer = (reward: number) => {
    setIsAnswering(false);
    setIsTransitioning(true);
    setScore((prev) => prev + reward);
    setAnswerStatus("correct");
    
    setRevealedLetters((prevRevealed) => Array.from({ length: currentQuestionWord.length }, (_, i) => i));

    setTimeout(() => {
      handleNextQuestion();
    }, 1500);
  };

  // Tüm harflerin açılıp açılmadığını (ipucu yardımıyla vs) kontrol eden useEffect
  // handleCorrectAnswer ve handleWrongAnswer çalışırken zaten manuel setTimeout kurduğumuz için burada çakışmasını önledik.
  useEffect(() => {
    if (questions.length === 0 || !hasStarted) return;

    if (isGameActive && answerStatus === "idle" && !isAnswering && currentQuestionWord && revealedLetters.length === currentQuestionWord.length) {
      setIsTransitioning(true); // Geri sayımı bu esnada durdur
      const timer = setTimeout(() => {
        handleNextQuestion();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [revealedLetters, currentQuestionIndex, isGameActive, isAnswering, questions, hasStarted]);

  // Herhangi bir state değiştiğinde oyunu LocalStorage'a kaydetme
  useEffect(() => {
    if (isLoading || questions.length === 0 || !hasStarted) return;

    const today = new Date();
    const yyyy = today.getUTCFullYear();
    const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(today.getUTCDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    const gameState = {
      date: formattedDate,
      score,
      timeLeft,
      currentQuestionIndex,
      revealedLetters,
      isGameActive,
      showGameOverModal,
      showLeaderboard,
      nickname,
      isAnswering,
      answerStartTime
    };

    // State'i şifreleyerek tarayıcıya (LocalStorage) kaydet
    const encryptedGameState = CryptoJS.AES.encrypt(JSON.stringify(gameState), ENCRYPTION_KEY).toString();
    localStorage.setItem("kelime_oyunu_save", encryptedGameState);
  }, [score, timeLeft, currentQuestionIndex, revealedLetters, isGameActive, showGameOverModal, showLeaderboard, nickname, isAnswering, answerStartTime, isLoading, questions.length, hasStarted]);

  // Oyun bitiş kontrolü
  useEffect(() => {
    if (!isGameActive && questions.length > 0 && !showLeaderboard) {
      setShowGameOverModal(true);
    }
  }, [isGameActive, questions.length, showLeaderboard]);

  // Sayfa kapalıyken cevap süresi dolduysa: sorular yüklendikten sonra doğru cevabı gösterip geç
  useEffect(() => {
    if (pendingTimeoutExpiredRef.current && questions.length > 0 && hasStarted && !isLoading) {
      pendingTimeoutExpiredRef.current = false;
      const timer = setTimeout(() => {
        handleNextQuestion();
      }, 1500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length, hasStarted, isLoading]);

  // Klavye (Space) ile 'Cevapla' butonunu tetikleme
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Sadece oyun aktifken, olay sayfa üzerindeyken (input vs içinde değilsek ekstra kontrol eklenebilir ama şu anki yapıya uygun) ve boşluk tuşuna basıldığında
      if (e.code === "Space" && isGameActive && !isAnswering) {
        // Tüm harfler açılmışsa 'Cevapla' butonunun çalışmadığı gibi burada da çalışmamalı
        if (questions.length > 0 && currentQuestionIndex < questions.length) {
           const currentWordLength = questions[currentQuestionIndex].word.length;
           if (revealedLetters.length !== currentWordLength) {
             e.preventDefault(); // Sayfanın kaymasını kesinlikle engelle
             setIsAnswering(true);
             setAnswerStartTime(Date.now());
             setAnswerTimeLeft(30);
           }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGameActive, isAnswering, questions, currentQuestionIndex, revealedLetters.length]);

  // Süreyi formatlayan fonksiyon
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-6xl sm:text-7xl font-nunito font-black text-violet-600 animate-pulse tracking-tight select-none">
            ZIPIR<span className="text-violet-400 italic">!</span>
          </h1>

          <p className="text-slate-400 font-medium text-base tracking-widest uppercase select-none">
            Yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm p-6 sm:p-10 text-center border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            Bugün için soru bulunamadı. Lütfen daha sonra tekrar deneyin.
          </h2>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <>
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-3 font-sans text-slate-800">
        
        {/* 1. Marka Alanı */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl sm:text-5xl font-nunito font-black tracking-tight text-violet-600 drop-shadow-sm">
            ZIPIR<span className="text-violet-400 italic">!</span>
          </h1>
          <p className="mt-1.5 text-base sm:text-lg text-slate-500 font-light tracking-wide">
            Günlük Kelime Bulmaca Oyunu
          </p>
        </div>

        {/* 2. Kurallar Kartı */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-5 sm:p-6 w-full max-w-lg mt-4 mb-6 transform transition-all hover:shadow-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 text-center pb-3 border-b border-slate-100">
            Nasıl Oynanır?
          </h2>
          
          <ul className="space-y-3 sm:space-y-4">
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 bg-violet-100 text-violet-600 p-2 sm:p-2.5 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <div className="pt-0.5">
                <p className="text-slate-600 font-medium text-sm sm:text-base leading-tight">
                  <strong className="text-violet-600 text-slate-800">14 Soru:</strong> 4 harfliden 10 harfliye kadar her harf grubundan 2'şer soru sorulur.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 bg-amber-100 text-amber-600 p-2 sm:p-2.5 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div className="pt-0.5">
                <p className="text-slate-600 font-medium text-sm sm:text-base leading-tight">
                  Tüm oyunu tamamlamak için <strong className="text-amber-600">toplam süreniz 4 dakikadır</strong>.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 bg-blue-100 text-blue-600 p-2 sm:p-2.5 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>
                </svg>
              </div>
              <div className="pt-0.5">
                <p className="text-slate-600 font-medium text-sm sm:text-base leading-tight">
                  Her harfin puan değeri <strong className="text-blue-600">100'dür</strong>. <strong className="text-slate-800">"Harf Al"</strong> butonuna bastıkça kelimeden alabileceğiniz toplam puandan <strong className="text-red-500">100 düşer</strong>.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 bg-emerald-100 text-emerald-600 p-2 sm:p-2.5 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" ry="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M7 16h10"/>
                </svg>
              </div>
              <div className="pt-0.5">
                <p className="text-slate-600 font-medium text-sm sm:text-base leading-tight">
                  <strong className="text-slate-800">"Cevapla"</strong> dedikten sonra ana süre durur, <strong className="text-emerald-600">30 saniyelik cevaplama süreniz</strong> başlar ve süre bitene kadar cevap deneyebilirsiniz.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 bg-red-100 text-red-600 p-2 sm:p-2.5 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div className="pt-0.5">
                <p className="text-slate-600 font-medium text-sm sm:text-base leading-tight">
                  <strong className="text-slate-800">Dikkat:</strong> Cevaplama süreniz biterse, o an alınabilecek puan <strong className="text-red-600">eksi puan (-)</strong> olarak hanenize yansır.
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* 3. Aksiyon Butonu */}
        <button 
          onClick={() => setCountdown(3)}
          className="w-full max-w-sm px-6 py-4 bg-violet-600 hover:bg-violet-700 text-white text-lg sm:text-xl font-bold rounded-2xl shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transform hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2">
          <span>Oyuna Başla</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        </button>

      </div>

      {/* Geri Sayım Overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white/90 backdrop-blur-sm">
          {/* Rakam */}
          <div key={countdown} className="relative flex items-center justify-center">
            {/* Dışa yayılan hale (ripple) */}
            <span
              aria-hidden
              className="absolute font-nunito font-black text-violet-400 text-8xl md:text-9xl select-none leading-none pointer-events-none animate-countdown-ripple"
            >
              {countdown}
            </span>
            {/* Ana rakam */}
            <span className="relative font-nunito font-black text-violet-600 text-8xl md:text-9xl select-none leading-none tracking-tight drop-shadow-sm animate-countdown-pop">
              {countdown}
            </span>
          </div>

          {/* Alt ipucu noktaları */}
          <div className="flex gap-2">
            {[3, 2, 1].map((n) => (
              <span
                key={n}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  n >= countdown ? "bg-violet-500 scale-125" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>
      )}
      </>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  // O anki sorunun alınabilecek (potansiyel) puanı
  const currentPotentialScore = (currentQuestion.word.length - revealedLetters.length) * 100;

  // Harf Alma Mantığı
  const handleGetLetter = () => {
    if (!isGameActive || isAnswering) return;

    const answer = currentQuestion.word;
    const unrevealedIndices: number[] = [];
    
    // Açılmamış harflerin indekslerini bul
    for (let i = 0; i < answer.length; i++) {
      if (!revealedLetters.includes(i)) {
        unrevealedIndices.push(i);
      }
    }

    if (unrevealedIndices.length > 0) {
      const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      setRevealedLetters((prev) => [...prev, randomIndex]);
    }
  };

  // Cevapla Butonuna Tıklanınca
  const handleAnswerClick = () => {
    if (!isGameActive || revealedLetters.length === currentQuestion.word.length) return;
    setIsAnswering(true);
    setAnswerStartTime(Date.now());
    setAnswerTimeLeft(30);
  };

  // Cevabı Gönderme
  const handleSubmitAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Eksik harf kontrolü
    const emptyBoxesCount = currentQuestion.word.length - revealedLetters.length;
    if (userAnswer.length !== emptyBoxesCount) {
      setIsShaking(true);
      
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    // Kullanıcının girdiği eksik harfleri asıl kelimedeki boşluklara yerleştirip tam kelimeyi oluştur
    let fullWord = "";
    let typedIndex = 0;
    for (let i = 0; i < currentQuestion.word.length; i++) {
      if (revealedLetters.includes(i)) {
        fullWord += currentQuestion.word[i];
      } else {
        fullWord += userAnswer[typedIndex] || "";
        typedIndex++;
      }
    }

    // Eğer geçerli bir harf girilmediyse gönderme
    if (!userAnswer.trim() && typedIndex > 0) return;

    const isCorrect = fullWord.toLocaleLowerCase("tr-TR") === currentQuestion.word.toLocaleLowerCase("tr-TR");
    
    if (isCorrect) {
      handleCorrectAnswer(currentPotentialScore);
    } else {
      // Yanlış tahminde eksi puan yok, yeni soruya geçme
      // Sadece kutuları kırmızı yap, titret ve kullanıcı girdisini sil
      setAnswerStatus("wrong");
      setIsShaking(true);
      
      setTimeout(() => {
        setIsShaking(false);
        setAnswerStatus("idle");
        setUserAnswer("");
        if (!isMobile) {
          document.getElementById('hidden-answer-input')?.focus();
        }
      }, 500);
    }
  };

  const handleVirtualKeyPress = (key: string) => {
    if (questions.length === 0 || currentQuestionIndex >= questions.length) return;
    const currentWordLength = questions[currentQuestionIndex].word.length;
    const emptyBoxesCount = currentWordLength - revealedLetters.length;
    if (userAnswer.length < emptyBoxesCount) {
      setUserAnswer((prev) => prev + key);
    }
  };

  const handleVirtualBackspace = () => {
    setUserAnswer((prev) => prev.slice(0, -1));
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setIsSavingScore(true);
    try {
      const today = new Date();
      const yyyy = today.getUTCFullYear();
      const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(today.getUTCDate()).padStart(2, "0");
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const userId = getOrCreateUserId();
      const res = await saveScoreAction(nickname, score, timeLeft, userId);

      if (!res?.success) {
        alert(res?.error || "Skor kaydedilirken bir hata oluştu.");
        return;
      }

      // İstatistikleri çek ve göster
      const stats = await getUserStatsAction(userId);
      setUserStats(stats);

      setShowGameOverModal(false);
      await fetchLeaderboard(formattedDate);
      setShowLeaderboard(true);
    } catch (err) {
      console.error("Kaydetme işlemi sırasında bir sorun oluştu:", err);
    } finally {
      setIsSavingScore(false);
    }
  };

  const handleShareResult = async () => {
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, "0")}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getFullYear()}`;
    const playUrl = window.location.origin;

    const shareText = `🟩 Günlük Kelime Oyunu\n📅 ${formattedDate}\n🎯 Puan: ${score}\n⏱️ Artan Süre: ${timeLeft} sn\n🔗 Oynamak için: ${playUrl}`;

    try {
      await navigator.clipboard.writeText(shareText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Panoya kopyalanamadı:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Kopyalandı Bildirimi */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white font-medium px-6 py-3 rounded-full shadow-lg z-50 animate-bounce">
          ✓ Sonuç Panoya Kopyalandı!
        </div>
      )}

      {/* Liderlik Tablosu Görünümü */}
      {showLeaderboard ? (
        <div className="w-full flex-1 flex flex-col justify-center items-center p-4">
          {/* Logo */}
          <h1 className="text-4xl sm:text-5xl font-nunito font-black tracking-tight text-violet-600 mb-4 drop-shadow-sm">
            ZIPIR<span className="text-violet-400 italic">!</span>
          </h1>

          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-violet-500 mb-6 border-b border-slate-100 pb-4">
              Bugünün Liderlik Tablosu
            </h2>

            {/* Kişisel İstatistikler */}
            {userStats && (
              <div className="mb-6 pb-6 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Senin İstatistiklerin</p>
                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                  <div className="flex flex-col items-center bg-amber-50 rounded-xl p-3 sm:p-4 border border-amber-100">
                    <span className="text-2xl sm:text-3xl font-black text-amber-500">{userStats.streak}</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-amber-600 mt-1 leading-tight">🔥 Seri</span>
                  </div>
                  <div className="flex flex-col items-center bg-violet-50 rounded-xl p-3 sm:p-4 border border-violet-100">
                    <span className="text-2xl sm:text-3xl font-black text-violet-600">{userStats.bestScore}</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-violet-500 mt-1 leading-tight">🏆 En İyi</span>
                  </div>
                  <div className="flex flex-col items-center bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-100">
                    <span className="text-2xl sm:text-3xl font-black text-blue-500">{userStats.avgScore}</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-blue-500 mt-1 leading-tight">⌀ Ortalama</span>
                  </div>
                  <div className="flex flex-col items-center bg-emerald-50 rounded-xl p-3 sm:p-4 border border-emerald-100">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600">{userStats.totalGames}</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 mt-1 leading-tight">🎮 Toplam</span>
                  </div>
                </div>
              </div>
            )}
            {leaderboardData.length === 0 ? (
              <p className="text-slate-500 py-8">Henüz bir skor kaydedilmemiş.</p>
            ) : (
              <div className="w-full max-h-64 overflow-y-auto pr-2 overflow-x-auto">
                <table className="w-full text-left border-collapse cursor-default">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="bg-violet-50 text-violet-800">
                      <th className="py-3 px-4 rounded-tl-lg font-semibold">#</th>
                      <th className="py-3 px-4 font-semibold">Oyuncu</th>
                      <th className="py-3 px-4 font-semibold text-center">Puan</th>
                      <th className="py-3 px-4 rounded-tr-lg font-semibold text-right">Süre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-50 last:border-none hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-700">{item.nickname}</td>
                        <td className="py-3 px-4 font-black text-violet-600 text-center">{item.score}</td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-right">{item.time_left} sn</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-5 border-t border-slate-100">
              <NextGameTimer />
              
              <div className="relative flex items-center">
                {isCopied && (
                  <div className="absolute right-full mr-3 whitespace-nowrap bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-md shadow-md animate-in fade-in zoom-in duration-200">
                    Panoya kopyalandı!
                    <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 border-y-[5px] border-y-transparent border-l-[5px] border-l-slate-800"></div>
                  </div>
                )}
                <button 
                  onClick={handleShareResult}
                  className="w-full sm:w-auto px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-violet-700 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                >
                  Sonucumu Paylaş
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Ayarlar Modalı */}
          {showSettingsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowSettingsModal(false)}>
              <div
                className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100 relative max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Başlık */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                  <h3 className="text-xl font-black text-slate-800">Ayarlar</h3>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                    aria-label="Kapat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                {/* Sekme Başlıkları */}
                <div className="flex border-b border-slate-100 px-6">
                  {(["nasil", "ses", "tema"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSettingsTab(tab)}
                      className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                        settingsTab === tab
                          ? "border-violet-500 text-violet-600"
                          : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {tab === "nasil" ? "Nasıl Oynanır?" : tab === "ses" ? "Ses" : "Tema"}
                    </button>
                  ))}
                </div>

                {/* Sekme İçerikleri */}
                <div className="p-6">
                  {/* Nasıl Oynanır? */}
                  {settingsTab === "nasil" && (
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="flex-shrink-0 bg-violet-100 text-violet-600 p-2 rounded-xl">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                          </svg>
                        </div>
                        <p className="text-slate-600 text-sm leading-snug pt-0.5">
                          <strong className="text-slate-800">14 Soru:</strong> 4 harfliden 10 harfliye kadar her harf grubundan 2'şer soru sorulur.
                        </p>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="flex-shrink-0 bg-amber-100 text-amber-600 p-2 rounded-xl">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                          </svg>
                        </div>
                        <p className="text-slate-600 text-sm leading-snug pt-0.5">
                          Tüm oyunu tamamlamak için <strong className="text-amber-600">toplam süreniz 4 dakikadır</strong>.
                        </p>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="flex-shrink-0 bg-blue-100 text-blue-600 p-2 rounded-xl">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>
                          </svg>
                        </div>
                        <p className="text-slate-600 text-sm leading-snug pt-0.5">
                          Her harfin puan değeri <strong className="text-blue-600">100'dür</strong>. <strong className="text-slate-800">"Harf Al"</strong> butonuna bastıkça kelimeden alabileceğiniz toplam puandan <strong className="text-red-500">100 düşer</strong>.
                        </p>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="flex-shrink-0 bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="16" x="2" y="4" rx="2" ry="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M7 16h10"/>
                          </svg>
                        </div>
                        <p className="text-slate-600 text-sm leading-snug pt-0.5">
                          <strong className="text-slate-800">"Cevapla"</strong> dedikten sonra ana süre durur, <strong className="text-emerald-600">30 saniyelik cevaplama süreniz</strong> başlar.
                        </p>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="flex-shrink-0 bg-red-100 text-red-600 p-2 rounded-xl">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                        </div>
                        <p className="text-slate-600 text-sm leading-snug pt-0.5">
                          <strong className="text-slate-800">Dikkat:</strong> Cevaplama süreniz biterse, o an alınabilecek puan <strong className="text-red-600">eksi puan (-)</strong> olarak hanenize yansır.
                        </p>
                      </li>
                    </ul>
                  )}

                  {/* Ses */}
                  {settingsTab === "ses" && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              {isSoundEnabled ? (
                                <>
                                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                                </>
                              ) : (
                                <>
                                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                  <line x1="23" y1="9" x2="17" y2="15"/>
                                  <line x1="17" y1="9" x2="23" y2="15"/>
                                </>
                              )}
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">Oyun Sesleri</p>
                            <p className="text-xs text-slate-400 mt-0.5">Doğru/yanlış cevap efektleri</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsSoundEnabled((p) => !p)}
                          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isSoundEnabled ? "bg-violet-500" : "bg-slate-300"}`}
                          role="switch"
                          aria-checked={isSoundEnabled}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${isSoundEnabled ? "translate-x-6" : "translate-x-0"}`} />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 text-center">Ses efektleri yakında eklenecek.</p>
                    </div>
                  )}

                  {/* Tema */}
                  {settingsTab === "tema" && (
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-3">
                        <button className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-violet-500 bg-violet-50 transition-all">
                          <div className="w-full h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-700">Aa</span>
                          </div>
                          <span className="text-xs font-semibold text-violet-700">Açık</span>
                          <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                        </button>
                        <button className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed transition-all" disabled>
                          <div className="w-full h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-200">Aa</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-500">Koyu</span>
                          <span className="text-[10px] text-slate-400">Yakında</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 text-center">Koyu tema yakında kullanıma açılacak.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Oyun Bitti Modalı */}
          {showGameOverModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-6 sm:p-10 w-full max-w-md shadow-xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
                
                <h3 className="text-3xl font-black text-center text-slate-800 mb-2">Oyun Bitti!</h3>
                <p className="text-center text-slate-500 mb-8">İşte bugünkü sonucun:</p>
                
                <div className="flex justify-center gap-6 mb-8">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Toplam Puan</p>
                    <p className="text-4xl font-black text-violet-500">{score}</p>
                  </div>
                  <div className="w-px bg-slate-200"></div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Kalan Süre</p>
                    <p className="text-4xl font-mono text-slate-700">{formatTime(timeLeft)}</p>
                  </div>
                </div>

                <form onSubmit={handleSaveScore} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2 border-none">
                      Skor Tablosu İçin Adın:
                    </label>
                    <input 
                      type="text" 
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Ad veya Rumuz"
                      maxLength={15}
                      className="w-full px-5 py-4 text-center text-lg font-bold border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-500/10 transition-all"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSavingScore || !nickname.trim()}
                    className="w-full bg-violet-500 hover:bg-violet-600 active:scale-95 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-md transition-all text-lg flex items-center justify-center gap-2"
                  >
                    {isSavingScore ? "Kaydediliyor..." : "Skoru Kaydet"}
                  </button>
                </form>

              </div>
            </div>
          )}

          {/* OYUN ANA EKRANI (Ana Tasarım) */}
          <div className="fixed top-0 left-0 w-full z-40 pt-2 sm:pt-4 flex justify-center pointer-events-none">
            <div className="w-full max-w-4xl px-4 flex justify-center">
              <header className={`pointer-events-auto w-full bg-white/40 backdrop-blur-md shadow-sm border border-slate-200/60 rounded-2xl px-3 py-3 sm:px-4 flex items-center justify-between gap-1 sm:gap-4 transition-all duration-300 ${(showGameOverModal || showSettingsModal) ? 'blur-sm' : ''}`}>
                {/* Sol: Ayarlar Butonu */}
                <div className="flex-1 flex justify-start shrink-0">
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    aria-label="Ayarlar"
                    className="p-1.5 sm:p-2 bg-white rounded-xl shadow-sm border border-violet-100 text-violet-600 active:scale-95 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>

                {/* Orta: Logo */}
                <div className="flex justify-center shrink-1 px-1 sm:px-2">
                  <h1 className="text-3xl sm:text-5xl font-nunito font-black tracking-tight text-violet-600 transition-transform origin-center">
                    ZIPIR<span className="text-violet-400 italic">!</span>
                  </h1>
                </div>

                {/* Sağ: Puan */}
                <div className="flex-1 flex justify-end shrink-0">
                  <div className="flex items-center py-1.5 px-3 sm:py-2 sm:px-5 bg-white shadow-sm rounded-xl border border-slate-100">
                    <div className="text-sm sm:text-base font-semibold text-slate-600 flex items-center">
                      Puan: <span className={`text-violet-600 font-bold text-base sm:text-xl ml-1 sm:ml-1.5 transition-transform duration-300 ${isScoreAnimating ? 'scale-[1.3]' : 'scale-100'}`}>{score}</span>
                    </div>
                  </div>
                </div>
              </header>
            </div>
          </div>

          <main className={`flex-1 w-full max-w-4xl mx-auto px-4 flex flex-col justify-center pt-28 sm:pt-36 pb-20 ${isAnswering ? 'max-sm:pb-64' : ''} ${(showGameOverModal || showSettingsModal) ? 'blur-sm' : ''}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-10 flex flex-col items-center relative">
              
              {/* Kart İçi Üst Bilgi Satırı: Soru Sayısı ve Süre */}
              <div className="flex flex-wrap sm:flex-nowrap justify-between items-center w-full mb-6 pb-3 border-b border-slate-100 relative">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span>Soru: <strong className="text-slate-700 ml-1">{currentQuestionIndex + 1} / {questions.length}</strong></span>
                </div>
                
                {/* 30 Saniyelik Cevaplama Süresi - Soru ve Ana Süre Arasında */}
                {isAnswering && (
                  <div className="w-full flex justify-center order-last mt-4 sm:w-auto sm:order-none sm:mt-0 sm:absolute sm:left-1/2 sm:-translate-x-1/2 bg-red-50 text-red-600 border border-red-200 px-4 py-1.5 rounded-full font-bold text-sm items-center gap-1.5 shadow-sm animate-pulse whitespace-nowrap">
                    <span>⏱️</span> Kalan Cevap Süresi: {answerTimeLeft} sn
                  </div>
                )}
                
                <div className={`flex items-center gap-2 font-mono text-lg sm:text-xl ${timeLeft <= 30 ? "text-red-500 font-bold animate-pulse scale-105 transition-transform" : "text-slate-700 font-bold"}`}>
                  <span className="text-xl sm:text-2xl">⏱️</span>
                  <span className="w-14 text-right">{formatTime(timeLeft)}</span>
                </div>
              </div>
              
              {/* Soru Değeri Etiketi */}
              <div className="absolute -top-4 bg-gradient-to-r from-violet-500 to-violet-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm uppercase tracking-wide">
                Bu sorunun değeri: {currentPotentialScore} Puan
              </div>

              {/* Soru / İpucu Metni */}
              <div className="mt-8 mb-10 w-full text-center">
                <h2 className="text-xl sm:text-2xl font-sans text-slate-700 leading-relaxed max-w-2xl mx-auto">
                  {currentQuestion.clue}
                </h2>
              </div>

              {/* Harf Kutuları */}
              <div 
                className={`flex flex-row flex-nowrap justify-center items-center w-full gap-${currentQuestion.word.length > 8 ? '1' : '2'} sm:gap-2 mb-10 cursor-text px-1 ${isShaking || answerStatus === "wrong" ? "animate-shake" : ""}`}
                onClick={() => {
                  if (isAnswering && !isMobile) document.getElementById('hidden-answer-input')?.focus();
                }}
              >
                {(() => {
                  let typedIndexCounter = 0;
                  return currentQuestion.word.split("").map((letter: string, index: number) => {
                    const isRevealed = revealedLetters.includes(index);
                    let displayChar = "";
                    let isUserTyped = false;
                    let isActiveBox = false;

                    if (isRevealed) {
                      displayChar = letter; // Sistem açtığı veya Doğru kelime
                    } else {
                      // isAnswering false olsa bile (yanlış kelimenin gösterildiği bekleme anında) user girdisini korumak için
                      if (typedIndexCounter < userAnswer.length) {
                        displayChar = userAnswer[typedIndexCounter];
                        isUserTyped = true;
                      } else if (isAnswering && typedIndexCounter === userAnswer.length) {
                        // Bu kutu bir sonraki yazılacak kutu
                        isActiveBox = true;
                      }
                      typedIndexCounter++;
                    }

                    // Stil Katmanları
                    let boxStyle = "bg-slate-50 border-slate-200 text-transparent"; // Boş normal kutu
                    if (answerStatus === "correct" && isRevealed) {
                      boxStyle = "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md transform -translate-y-1 transition-all duration-300";
                    } else if (answerStatus === "wrong" && !isRevealed) {
                      boxStyle = "bg-red-50 border-red-500 text-red-700 shadow-md";
                    } else if (isRevealed) {
                      boxStyle = "bg-violet-50 border-violet-200 text-violet-700 shadow-sm"; // Sistem İpucu Harfi
                    } else if (isUserTyped) {
                      boxStyle = "bg-white border-violet-500 text-violet-700 shadow-md transform -translate-y-1"; // Kullanıcı Girdisi
                    } else if (isAnswering && isActiveBox) {
                      boxStyle = "bg-violet-50/50 border-violet-400 shadow-inner ring-4 ring-violet-200/50"; // Odaklanılan
                    }

                    const isManyLetters = currentQuestion.word.length > 8;
                    const sizeClasses = isManyLetters
                      ? "text-lg sm:text-2xl border"
                      : "text-2xl sm:text-3xl border-2";

                    return (
                      <div
                        key={index}
                        className={`relative flex-1 min-w-0 max-w-[3rem] sm:max-w-[4rem] aspect-square flex items-center justify-center rounded-lg sm:rounded-xl font-bold uppercase transition-all duration-300 ${sizeClasses} p-0 m-0 ${boxStyle}`}
                      >
                        {displayChar}
                        {/* Aktif kutudayken küçük bir imleç işareti göster */}
                        {isAnswering && isActiveBox && (
                          <div className="absolute w-5 h-1 bg-violet-400 bottom-2 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Alt Kısım: Kontroller veya Cevap Formu */}
              {!isAnswering ? (
                <div className="flex flex-col sm:flex-row items-center justify-center w-full gap-4 sm:gap-6 mt-4">
                  <button 
                    onClick={handleGetLetter}
                    disabled={!isGameActive || revealedLetters.length === currentQuestion.word.length}
                    className="w-full sm:w-auto flex flex-col items-center justify-center group px-8 py-3.5 rounded-xl border-2 border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 hover:border-violet-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-bold text-lg">Harf Al</span>
                    <span className="text-xs font-semibold opacity-70 mt-0.5 group-hover:opacity-100 flex items-center gap-1">
                      -100 Puan
                    </span>
                  </button>
                  <button 
                    onClick={handleAnswerClick}
                    disabled={!isGameActive || revealedLetters.length === currentQuestion.word.length}
                    className="w-full sm:w-auto flex flex-col items-center justify-center px-10 py-3.5 rounded-xl bg-violet-500 text-white shadow-md shadow-violet-200 hover:bg-violet-600 hover:shadow-lg hover:shadow-violet-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-bold text-lg">Cevapla</span>
                    <span className="text-xs font-medium text-violet-100 mt-0.5">
                      Tahmini Gir
                    </span>
                  </button>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center mt-4 relative">
                  <form onSubmit={handleSubmitAnswer} className="w-full flex flex-col items-center gap-3 relative">
                    {/* Gizli input. Masaüstünde klavyeyi tetikler ve metni güvenilir şekilde yakalar. Mobil cihazlarda gizlenmiştir. */}
                    <input
                      id="hidden-answer-input"
                      type="text"
                      autoFocus={!isMobile}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                      value={userAnswer}
                      maxLength={currentQuestion.word.length - revealedLetters.length} // Yalnızca boş kutu kadar karakter alır
                      onChange={(e) => {
                        const val = e.target.value;
                        // Yalnızca A-Z ve Türkçe harfleri kabul et
                        const filtered = val.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ]/g, '');
                        setUserAnswer(filtered.toLocaleUpperCase('tr-TR'));
                      }}
                      className="absolute opacity-0 w-0 h-0 -z-10 focus:outline-none cursor-default max-sm:hidden"
                    />
                    
                    <button 
                      type="submit"
                      className="px-12 py-3.5 bg-violet-600 text-white font-bold rounded-xl shadow-md hover:bg-violet-700 transition-all active:scale-95 text-lg max-sm:hidden"
                    >
                      Gönder
                    </button>
                  </form>
                </div>
              )}
            </div>
          </main>

          {/* Sanal Klavye - Sadece mobil cihazlarda ve cevaplama aşamasındayken gösterilir */}
          {isAnswering && isMobile && (
            <VirtualKeyboard 
              onKeyPress={handleVirtualKeyPress}
              onBackspace={handleVirtualBackspace}
              onSubmit={() => handleSubmitAnswer()}
            />
          )}
        </>
      )}
    </div>
  );
}

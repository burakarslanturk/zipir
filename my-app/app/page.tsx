"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import CryptoJS from "crypto-js";
import { saveScoreAction, getUserStatsAction } from "./actions";
import { Question, LeaderboardRow, UserStats, AnswerStatus, SettingsTab } from "../types";
import { playSound, getOrCreateUserId, formatTime, getTurkeyDateStr, getTurkeyFormattedDate } from "../lib/utils";
import { NextGameTimer } from "./_components/NextGameTimer";
import { VirtualKeyboard } from "./_components/VirtualKeyboard";
import { SettingsModal } from "./_components/SettingsModal";
import { StartScreen } from "./_components/StartScreen";
import { GameOverModal } from "./_components/GameOverModal";
import { LeaderboardView } from "./_components/LeaderboardView";

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY as string;

/**
 * Ana oyun sayfası bileşeni.
 * Tüm oyun mantığını, state yönetimini ve kullanıcı etkileşimlerini içerir.
 * 
 * Oyun Akışı:
 * 1. Yükleme -> 2. Giriş Ekranı -> 3. Geri Sayım -> 4. Oyun -> 5. Sonuç/Kayıt -> 6. Liderlik
 */
export default function GamePage() {
  // ==========================================
  // SPLASH & BAŞLATMA STATE'LERİ
  // ==========================================
  
  /** Oyun başladı mı? (true: oyun ekranı, false: giriş ekranı) */
  const [hasStarted, setHasStarted] = useState(false);
  /** Geri sayım değeri (3, 2, 1) - null ise geri sayım yok */
  const [countdown, setCountdown] = useState<number | null>(null);

  // ==========================================
  // VERİ STATE'LERİ
  // ==========================================
  
  /** API'den gelen soru listesi (şifre çözülmüş hali) */
  const [questions, setQuestions] = useState<Question[]>([]);
  /** Veri yükleniyor mu? */
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================
  // OYUN STATE'LERİ
  // ==========================================
  
  /** Şu anki soru indeksi (0-13 arası) */
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  /** Toplam puan */
  const [score, setScore] = useState(0);
  /** Kalan toplam süre (saniye) - başlangıç 240 sn (4 dk) */
  const [timeLeft, setTimeLeft] = useState(240);
  /** Oyun aktif mi? (süre bittiğinde false olur) */
  const [isGameActive, setIsGameActive] = useState(true);
  /** Açılmış harf indeksleri (ipucu olarak gösterilenler) */
  const [revealedLetters, setRevealedLetters] = useState<number[]>([]);
  
  // ==========================================
  // CEVAPLAMA STATE'LERİ
  // ==========================================
  
  /** Cevaplama modu aktif mi? (30 sn'lik süre başladı mı?) */
  const [isAnswering, setIsAnswering] = useState(false);
  /** Cevaplama başlangıç zamanı (sayfa yenilenince kalan süreyi hesaplamak için) */
  const [answerStartTime, setAnswerStartTime] = useState<number | null>(null);
  /** Kullanıcının girdiği cevap metni */
  const [userAnswer, setUserAnswer] = useState("");
  /** Cevaplama için kalan süre (saniye) */
  const [answerTimeLeft, setAnswerTimeLeft] = useState(30);
  /** Geçiş animasyonu aktif mi? (doğru/yanlış cevap sonrası bekleme) */
  const [isTransitioning, setIsTransitioning] = useState(false);
  /** Harf kutuları titriyor mu? (yanlış cevap animasyonu) */
  const [isShaking, setIsShaking] = useState(false);
  /** Cevap durumu: idle | correct | wrong */
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>("idle");
  /** Puan animasyonu aktif mi? */
  const [isScoreAnimating, setIsScoreAnimating] = useState(false);

  // ==========================================
  // UI & AYARLAR STATE'LERİ
  // ==========================================
  
  /** Ayarlar modalı açık mı? */
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  /** Ayarlar modalındaki aktif sekme */
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("nasil");
  /** Ses efektleri açık mı? */
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  /** Nasıl Oynanır modalı açık mı? (giriş ekranında) */
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // ==========================================
  // REF'LER
  // ==========================================
  
  /** 
   * Sayfa kapalıyken (background) cevap süresi dolduysa,
   * sayfa tekrar açıldığında ceza uygulamak için flag.
   */
  const pendingTimeoutExpiredRef = useRef(false);
  /** Süresonu sesini durdurmak için audio referansı */
  const suresonuAudioRef = useRef<HTMLAudioElement | null>(null);
  /** Mobil cihaz kontrolü (sanal klavye gösterimi için) */
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize(); // set initial value
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // bfcache'den geri yükleme veya sekme ertesi gün açılırsa sayfayı yenile
  useEffect(() => {
    // Opera/Chrome sekme geri yüklemesi: sayfa reload edilmeden bellekten geliyorsa yenile
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        window.location.reload();
      }
    };

    // Sekme tekrar aktif olduğunda tarih değiştiyse yenile
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const savedRaw = localStorage.getItem("kelime_oyunu_save");
        if (savedRaw) {
          try {
            const bytes = CryptoJS.AES.decrypt(savedRaw, ENCRYPTION_KEY);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
            if (decryptedString) {
              const savedState = JSON.parse(decryptedString);
              if (savedState.date && savedState.date !== getTurkeyDateStr()) {
                window.location.reload();
              }
            }
          } catch {
            // Şifre çözülemezse yoksay
          }
        }
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardRow[]>([]);
  const [showToast, setShowToast] = useState(false); // Kopyalandı bildirimi için (genel)
  const [isCopied, setIsCopied] = useState(false); // Sadece leaderboard'daki buton için lokal toolitp

  // Kullanıcı istatistikleri
  const [userStats, setUserStats] = useState<UserStats | null>(null);

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
        const now = new Date();
        const turkeyTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        const yyyy = turkeyTime.getUTCFullYear();
        const mm = String(turkeyTime.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(turkeyTime.getUTCDate()).padStart(2, "0");
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

        let sorted: Question[] = [];
        if (resData.questions && resData.questions.length > 0) {
          // Gelen şifreli kelimeleri cihazda (client'ta) çözüyoruz
          const decryptedData = resData.questions.map((q: Question) => {
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
          sorted = decryptedData.sort((a: Question, b: Question) => a.word.length - b.word.length);
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
      // Son 6 saniyede süresonu sesini başlat (bir kez)
      if (answerTimeLeft === 6 && isSoundEnabled) {
        const audio = new Audio('/sounds/suresonu.mp3');
        audio.volume = 0.6;
        audio.play().catch(() => {});
        suresonuAudioRef.current = audio;
      }
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
    if (isTimeout) {
      if (suresonuAudioRef.current) {
        suresonuAudioRef.current.pause();
        suresonuAudioRef.current = null;
      }
      playSound('/sounds/wrong.mp3', isSoundEnabled);
    }

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
    if (suresonuAudioRef.current) {
      suresonuAudioRef.current.pause();
      suresonuAudioRef.current = null;
    }
    playSound('/sounds/correct.mp3', isSoundEnabled);
    
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

    const now = new Date();
    const turkeyTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const yyyy = turkeyTime.getUTCFullYear();
    const mm = String(turkeyTime.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(turkeyTime.getUTCDate()).padStart(2, "0");
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

  if (isLoading) {
    return (
      <div className="h-dvh w-screen overflow-hidden bg-[var(--bg)] flex flex-col items-center justify-center p-4 fixed inset-0">
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-6xl sm:text-7xl font-nunito font-black text-[var(--violet-600)] animate-pulse tracking-tight select-none">
            ZIPIR<span className="text-[var(--violet-400)] italic">!</span>
          </h1>

          <p className="text-[var(--slate-400)] font-medium text-base tracking-widest uppercase select-none">
            Yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="h-dvh w-screen overflow-hidden bg-[var(--bg)] flex flex-col items-center justify-center p-4 fixed inset-0">
        <div className="w-full max-w-3xl bg-[var(--card)] rounded-2xl shadow-sm p-6 sm:p-10 text-center border border-[var(--card-border)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Bugün için soru bulunamadı. Lütfen daha sonra tekrar deneyin.
          </h2>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <>
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          initialTab={settingsTab}
          isSoundEnabled={isSoundEnabled}
          onSoundToggle={() => setIsSoundEnabled((p) => !p)}
        />
        <StartScreen
          onStart={() => setCountdown(3)}
          onShowHowToPlay={() => setShowHowToPlay(true)}
          onShowSettings={() => setShowSettingsModal(true)}
          countdown={countdown}
          showHowToPlay={showHowToPlay}
          onCloseHowToPlay={() => setShowHowToPlay(false)}
        />
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
      playSound('/sounds/harfal.mp3', isSoundEnabled);
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
      const now = new Date();
      const turkeyTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      const yyyy = turkeyTime.getUTCFullYear();
      const mm = String(turkeyTime.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(turkeyTime.getUTCDate()).padStart(2, "0");
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

    const shareText = `ZIPIR! - Kelime oyunu\n\n📅 ${formattedDate}\n🏆 Puan: ${score}\n⏱️ Artan Süre: ${timeLeft} sn\n\n${playUrl}`;

    try {
      await navigator.clipboard.writeText(shareText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Panoya kopyalanamadı:", err);
    }
  };

  return (
    <div className="h-dvh w-screen overflow-hidden bg-[var(--bg)] flex flex-col font-sans text-[var(--text)] fixed inset-0 touch-none overscroll-none">
      
      {/* Kopyalandı Bildirimi */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-[var(--slate-800)] text-[var(--text-inverse)] font-medium px-6 py-3 rounded-full shadow-lg z-50 animate-bounce">
          ✓ Sonuç Panoya Kopyalandı!
        </div>
      )}

      {/* Liderlik Tablosu Görünümü */}
      {showLeaderboard ? (
        <LeaderboardView
          data={leaderboardData}
          userStats={userStats}
          nickname={nickname}
          onShare={handleShareResult}
          isCopied={isCopied}
        />
      ) : (
        <>
          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            initialTab={settingsTab}
            isSoundEnabled={isSoundEnabled}
            onSoundToggle={() => setIsSoundEnabled((p) => !p)}
          />

          {showGameOverModal && (
            <GameOverModal
              score={score}
              timeLeft={timeLeft}
              nickname={nickname}
              onNicknameChange={setNickname}
              onSave={handleSaveScore}
              onShare={handleShareResult}
              isSaving={isSavingScore}
              isCopied={isCopied}
            />
          )}

          {/* OYUN ANA EKRANI (Ana Tasarım) */}
          <div className="fixed top-0 left-0 w-full z-40 pt-2 sm:pt-4 flex justify-center pointer-events-none">
            <div className="w-full max-w-4xl px-4 flex justify-center">
              <header className={`pointer-events-auto w-full bg-[var(--card)]/90 backdrop-blur-md shadow-md shadow-[var(--slate-200)]/50 border border-[var(--slate-200)] rounded-2xl px-2 py-2 sm:px-3 flex items-center justify-between gap-1 sm:gap-4 transition-all duration-300 ${(showGameOverModal || showSettingsModal) ? 'blur-sm' : ''}`}>
                {/* Sol: Ayarlar Butonu */}
                <div className="flex-1 flex justify-start shrink-0">
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    aria-label="Ayarlar"
                    className="p-2 rounded-xl text-[var(--slate-400)] hover:text-[var(--violet-600)] hover:bg-[var(--violet-50)] active:scale-95 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>

                {/* Orta: Logo */}
                <div className="flex justify-center shrink-1 px-1 sm:px-2">
                  <h1 className="text-3xl sm:text-4xl font-nunito font-black tracking-tight text-[var(--violet-600)] transition-transform origin-center">
                    ZIPIR<span className="text-[var(--violet-400)] italic">!</span>
                  </h1>
                </div>

                {/* Sağ: Puan */}
                <div className="flex-1 flex justify-end shrink-0">
                  <div className="flex items-center py-1.5 px-3 sm:py-2 sm:px-4 bg-[var(--violet-100)]/60 border border-[var(--violet-200)] rounded-xl">
                    <div className="text-sm sm:text-base font-semibold text-[var(--slate-600)] flex items-center">
                      Puan: <span className={`text-[var(--violet-700)] font-bold text-base sm:text-xl ml-1 sm:ml-1.5 transition-transform duration-300 ${isScoreAnimating ? 'scale-[1.3]' : 'scale-100'}`}>{score}</span>
                    </div>
                  </div>
                </div>
              </header>
            </div>
          </div>

          <main className={`flex-1 w-full max-w-4xl mx-auto px-4 flex flex-col justify-center pt-28 sm:pt-36 pb-20 ${isAnswering ? 'max-sm:pb-64' : ''} ${(showGameOverModal || showSettingsModal) ? 'blur-sm' : ''} touch-none`}>
            <div className="bg-[var(--card)] rounded-2xl shadow-xl shadow-[var(--slate-200)]/50 border border-[var(--slate-200)] p-6 sm:p-10 flex flex-col items-center relative">
              
              {/* Kart İçi Üst Bilgi Satırı: Soru Sayısı ve Süre */}
              <div className="flex flex-wrap sm:flex-nowrap justify-between items-center w-full mb-6 pb-3 border-b border-[var(--slate-100)] relative">
                <div className="flex items-center gap-2 text-[var(--slate-600)] font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--slate-400)]">
                    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span>Soru: <strong className="text-[var(--slate-700)] ml-1">{currentQuestionIndex + 1} / {questions.length}</strong></span>
                </div>
                
                {/* 30 Saniyelik Cevaplama Süresi - Soru ve Ana Süre Arasında */}
                {isAnswering && (
                  <div className="w-full flex justify-center order-last mt-4 sm:w-auto sm:order-none sm:mt-0 sm:absolute sm:left-1/2 sm:-translate-x-1/2 bg-[var(--red-50)] text-[var(--red-600)] border border-[var(--red-200)] px-3 py-1 rounded-full font-bold text-sm items-center gap-1.5 shadow-sm animate-pulse whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--red-500)]">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>{answerTimeLeft} sn</span>
                  </div>
                )}
                
                <div className={`flex items-center gap-2 font-mono text-lg sm:text-xl ${timeLeft <= 30 ? "text-[var(--red-500)] font-bold animate-pulse scale-105 transition-transform" : "text-[var(--slate-700)] font-bold"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${timeLeft <= 30 ? "text-[var(--red-500)]" : "text-[var(--slate-400)]"}`}>
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span className="w-14 text-right">{formatTime(timeLeft)}</span>
                </div>
              </div>
              
              {/* Soru Değeri Etiketi */}
              <div className="absolute -top-4 bg-[var(--violet-100)] text-[var(--violet-700)] border border-[var(--violet-200)] text-xs font-bold px-4 py-1.5 rounded-full shadow-sm tracking-wide">
                Bu Sorunun Değeri: {currentPotentialScore} Puan
              </div>

              {/* Soru / İpucu Metni */}
              <div className="mt-8 mb-10 w-full text-center">
                <h2 className="text-xl sm:text-2xl font-sans text-[var(--slate-700)] leading-relaxed max-w-2xl mx-auto">
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
                    let boxStyle = "bg-[var(--slate-100)] border-[var(--slate-300)] text-transparent shadow-inner"; // Boş normal kutu
                    if (answerStatus === "correct" && isRevealed) {
                      boxStyle = "bg-[var(--emerald-50)] border-[var(--emerald-500)] border-b-4 text-[var(--emerald-700)] shadow-md transform -translate-y-1 transition-all duration-300";
                    } else if (answerStatus === "wrong" && !isRevealed) {
                      boxStyle = "bg-[var(--red-50)] border-[var(--red-500)] text-[var(--red-600)] shadow-md";
                    } else if (isRevealed) {
                      boxStyle = "bg-[var(--violet-100)] border-[var(--violet-300)] text-[var(--violet-800)] font-black shadow-sm"; // Sistem İpucu Harfi
                    } else if (isUserTyped) {
                      boxStyle = "bg-[var(--card)] border-[var(--violet-600)] border-b-4 text-[var(--violet-900)] font-black shadow-md transform -translate-y-1"; // Kullanıcı Girdisi
                    } else if (isAnswering && isActiveBox) {
                      boxStyle = "bg-[var(--violet-50)]/80 border-[var(--violet-500)] shadow-inner ring-4 ring-[var(--violet-300)]/50"; // Odaklanılan
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
                          <div className="absolute w-5 h-1 bg-[var(--violet-400)] bottom-2 rounded-full animate-pulse"></div>
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
                    className="w-full sm:w-auto flex flex-col items-center justify-center group px-8 py-3.5 rounded-xl border-2 border-[var(--violet-200)] bg-[var(--violet-50)] text-[var(--violet-600)] hover:bg-[var(--violet-100)] hover:border-[var(--violet-300)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-bold text-lg">Harf Al</span>
                    <span className="text-xs font-semibold opacity-70 mt-0.5 group-hover:opacity-100 flex items-center gap-1">
                      -100 Puan
                    </span>
                  </button>
                  <button 
                    onClick={handleAnswerClick}
                    disabled={!isGameActive || revealedLetters.length === currentQuestion.word.length}
                    className="w-full sm:w-auto flex flex-col items-center justify-center px-10 py-3.5 rounded-xl bg-[var(--violet-500)] text-[var(--text-inverse)] shadow-md shadow-[var(--violet-200)] hover:bg-[var(--violet-600)] hover:shadow-lg hover:shadow-[var(--violet-300)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-bold text-lg">Cevapla</span>
                    <span className="text-xs font-medium text-[var(--violet-100)] mt-0.5">
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
                      onBlur={() => {
                        if (isAnswering && !isMobile) {
                          setTimeout(() => {
                            document.getElementById('hidden-answer-input')?.focus();
                          }, 0);
                        }
                      }}
                      className="absolute opacity-0 w-0 h-0 -z-10 focus:outline-none cursor-default max-sm:hidden"
                    />
                    
                    <button 
                      type="submit"
                      className="px-12 py-3.5 bg-[var(--violet-600)] text-[var(--text-inverse)] font-bold rounded-xl shadow-md hover:bg-[var(--violet-700)] transition-all active:scale-95 text-lg max-sm:hidden"
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

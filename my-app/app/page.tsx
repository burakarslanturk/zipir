"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

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

export default function GamePage() {
  // Splash ve oyun başlatma kontrolü
  const [hasStarted, setHasStarted] = useState(false);

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
  const [userAnswer, setUserAnswer] = useState("");
  const [answerTimeLeft, setAnswerTimeLeft] = useState(20);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [isScoreAnimating, setIsScoreAnimating] = useState(false);

  // Puan değiştiğinde animasyon tetiklemek için etki
  useEffect(() => {
    if (score > 0 || (score === 0 && questions.length > 0)) {
      setIsScoreAnimating(true);
      const timer = setTimeout(() => setIsScoreAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [score, questions.length]);

  // Oyun Sonu & Leaderboard State'leri
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [showToast, setShowToast] = useState(false); // Kopyalandı bildirimi için (genel)
  const [isCopied, setIsCopied] = useState(false); // Sadece leaderboard'daki buton için lokal toolitp

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

        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .eq("game_date", formattedDate)
          .limit(14);

        if (error) {
          console.error("Sorular alınırken hata:", error);
          return;
        }

        if (data) {
          // Gelen soruları cevap uzunluğuna göre sırala (4 harfliden 10 harfliye)
          const sorted = data.sort((a, b) => a.word.length - b.word.length);
          setQuestions(sorted);
        }

        // LocalStorage Kontrolü ve Yükleme
        const savedRaw = localStorage.getItem("kelime_oyunu_save");
        if (savedRaw) {
          try {
            const savedState = JSON.parse(savedRaw);
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
              } 
              // Eğer oynanırken yarım kalmışsa ve oyun bitmişse modal göster
              else if (savedState.showGameOverModal) {
                setIsGameActive(false);
                setShowGameOverModal(true);
                setHasStarted(true); // Direkt modal başlasın
              }
              else {
                setIsGameActive(savedState.isGameActive ?? true);
                // Oyun yarım kaldıysa, oynamaya devam etsin Splash görmeden
                if (savedState.currentQuestionIndex > 0 || savedState.score > 0 || (savedState.timeLeft && savedState.timeLeft < 240)) {
                  setHasStarted(true);
                }
              }
            }
          } catch (e) {
            console.error("LocalStorage okunurken hata:", e);
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

  // Cevaplama süresi 20 saniyeden geriye sayar
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
      setAnswerTimeLeft(20);
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
      nickname
    };

    localStorage.setItem("kelime_oyunu_save", JSON.stringify(gameState));
  }, [score, timeLeft, currentQuestionIndex, revealedLetters, isGameActive, showGameOverModal, showLeaderboard, nickname, isLoading, questions.length, hasStarted]);

  // Oyun bitiş kontrolü
  useEffect(() => {
    if (!isGameActive && questions.length > 0 && !showLeaderboard) {
      setShowGameOverModal(true);
    }
  }, [isGameActive, questions.length, showLeaderboard]);

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
             setAnswerTimeLeft(20);
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
          <h2 className="text-xl font-semibold text-slate-700 tracking-wide">
            Günün kelimeleri hazırlanıyor...
          </h2>
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
                  <strong className="text-slate-800">"Cevapla"</strong> dedikten sonra ana süre durur, <strong className="text-emerald-600">20 saniyelik cevaplama süreniz</strong> başlar ve süre bitene kadar cevap deneyebilirsiniz.
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
          onClick={() => setHasStarted(true)}
          className="w-full max-w-sm px-6 py-4 bg-violet-600 hover:bg-violet-700 text-white text-lg sm:text-xl font-bold rounded-2xl shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transform hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2">
          <span>Oyuna Başla</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        </button>

      </div>
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
    setAnswerTimeLeft(20);
  };

  // Cevabı Gönderme
  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    
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
        document.getElementById('hidden-answer-input')?.focus();
      }, 500);
    }
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

      const { error } = await supabase
        .from("leaderboard")
        .insert([
          {
            nickname: nickname.trim(),
            score: score,
            time_left: timeLeft,
            game_date: formattedDate
          }
        ]);

      if (error) {
        console.error("Skor kaydedilirken hata oluştu:", error);
        return;
      }

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
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-violet-500 mb-6 border-b border-slate-100 pb-4">
              Bugünün Liderlik Tablosu
            </h2>
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
          {/* Oyun Bitti Modalı */}
          {showGameOverModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-6 sm:p-10 w-full max-w-md shadow-xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
                
                <h3 className="text-3xl font-black text-center text-slate-800 mb-2">Oyun Bitti!</h3>
                <p className="text-center text-slate-500 mb-8">İşte bugünkü harika sonucun:</p>
                
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
          <header className={`w-full max-w-4xl mx-auto px-4 py-8 relative flex items-center justify-between ${showGameOverModal ? 'blur-sm' : ''}`}>
            {/* Sol: Logo */}
            <div className="flex-1 flex justify-start">
              <h1 className="text-4xl sm:text-5xl font-nunito font-black tracking-tight text-violet-600">
                ZIPIR<span className="text-violet-400 italic">!</span>
              </h1>
            </div>

            {/* Sağ: Puan */}
            <div className="flex-1 flex justify-end">
              <div className="flex items-center py-2 px-5 bg-white shadow-sm rounded-xl border border-slate-100">
                <div className="text-base font-semibold text-slate-600 flex items-center">
                  Puan: <span className={`text-violet-600 font-bold text-lg sm:text-xl ml-1.5 transition-transform duration-300 ${isScoreAnimating ? 'scale-[1.3]' : 'scale-100'}`}>{score}</span>
                </div>
              </div>
            </div>
          </header>

          <main className={`flex-1 w-full max-w-4xl mx-auto px-4 flex flex-col justify-center pb-20 ${showGameOverModal ? 'blur-sm' : ''}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-10 flex flex-col items-center relative">
              
              {/* Kart İçi Üst Bilgi Satırı: Soru Sayısı ve Süre */}
              <div className="w-full flex justify-between items-center mb-8 border-b border-slate-100 pb-4 relative">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span>Soru: <strong className="text-slate-700 ml-1">{currentQuestionIndex + 1} / {questions.length}</strong></span>
                </div>
                
                {/* 20 Saniyelik Cevaplama Süresi - Soru ve Ana Süre Arasında */}
                {isAnswering && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 bg-red-50 text-red-600 border border-red-200 px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-1.5 shadow-sm animate-pulse whitespace-nowrap">
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
                className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10 cursor-text ${isShaking || answerStatus === "wrong" ? "animate-shake" : ""}`}
                onClick={() => {
                  if (isAnswering) document.getElementById('hidden-answer-input')?.focus();
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

                    return (
                      <div
                        key={index}
                        className={`relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl border-2 text-2xl sm:text-3xl font-bold uppercase transition-all duration-300 ${boxStyle}`}
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
                    {/* Gizli input. Klavyeyi tetikler ve metni güvenilir şekilde yakalar. (Backspace dahil her şeyi çözer) */}
                    <input
                      id="hidden-answer-input"
                      type="text"
                      autoFocus
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
                      className="absolute opacity-0 w-0 h-0 -z-10 focus:outline-none cursor-default"
                    />
                    
                    <button 
                      type="submit"
                      className="px-12 py-3.5 bg-violet-600 text-white font-bold rounded-xl shadow-md hover:bg-violet-700 transition-all active:scale-95 text-lg"
                    >
                      Gönder
                    </button>
                  </form>
                </div>
              )}
            </div>
          </main>
        </>
      )}
    </div>
  );
}

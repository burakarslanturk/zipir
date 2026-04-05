"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function GamePage() {
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

  // Veri Çekme useEffect'i
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

        console.log("Gönderilen Tarih:", formattedDate);

        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .eq("game_date", formattedDate)
          .limit(14);

        console.log("Supabase'den Dönen Data:", data);

        if (error) {
          console.error("Sorular alınırken hata:", error);
          return;
        }

        if (data) {
          // Gelen soruları cevap uzunluğuna göre sırala (4 harfliden 10 harfliye)
          const sorted = data.sort((a, b) => a.word.length - b.word.length);
          setQuestions(sorted);
        }
      } catch (err) {
        console.error("Veri çekme işleminde hata oluştu:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayQuestions();
  }, []);

  // Ana oyun sayacı (isAnswering aktif değilse saymaya devam eder)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // Yükleme varsa sayaç başlamasın
    if (isLoading || questions.length === 0) return;

    if (isGameActive && !isAnswering && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft <= 0) {
      setIsGameActive(false);
    }

    return () => clearInterval(timer);
  }, [isGameActive, isAnswering, timeLeft, isLoading, questions.length]);

  // Cevaplama süresi 20 saniyeden geriye sayar
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isAnswering && answerTimeLeft > 0) {
      timer = setInterval(() => {
        setAnswerTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isAnswering && answerTimeLeft <= 0) {
      // Süre bittiğinde harfleri aç ve bekleme mantığını tetikle
      revealAllAndProceed();
    }

    return () => clearInterval(timer);
  }, [isAnswering, answerTimeLeft]);

  // Yanlış cevap veya süre bittiğinde tüm kelimeyi açıp 2 sn beklettiğimiz fonksiyon
  const revealAllAndProceed = () => {
    setIsAnswering(false);
    setUserAnswer("");
    
    if (questions.length === 0) return;

    // Tüm harflerin indekslerini doldur
    const allIndices = Array.from(
      { length: questions[currentQuestionIndex].word.length },
      (_, i) => i
    );
    setRevealedLetters(allIndices);

    // Not: revealedLetters tam dolduğu için alttaki tüm harfler açıldı useEffect'i otomatik devreye girecek
    // ve 2 saniye sonra handleNextQuestion() fonksiyonunu kendisi çağıracaktır.
  };

  // Sonraki soruya geçiş işlevini ortak bir fonksiyona aldım
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setRevealedLetters([]);
      setUserAnswer("");
      setIsAnswering(false);
      setAnswerTimeLeft(20);
    } else {
      setIsGameActive(false);
      setIsAnswering(false);
    }
  };

  // Tüm harflerin açılıp açılmadığını kontrol eden useEffect
  useEffect(() => {
    if (questions.length === 0) return;

    if (isGameActive && !isAnswering && revealedLetters.length === questions[currentQuestionIndex].word.length) {
      const timer = setTimeout(() => {
        handleNextQuestion();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [revealedLetters, currentQuestionIndex, isGameActive, isAnswering, questions]);

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
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-700 font-sans tracking-wide">
            Günün kelimeleri hazırlanıyor...
          </h2>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 sm:p-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            Bugün için soru bulunamadı. Lütfen daha sonra tekrar deneyin.
          </h2>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  // O anki sorunun alınabilecek (potansiyel) puanı (açılmayan harf sayısı * 100)
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

    // Açılacak harf kaldıysa (kelimenin tamamı açılmadıysa) rastgele birini aç
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

  // Cevabı Gönderme (Submit) 
  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    // Türkçe karakterleri göz önünde bulundurarak küçük harfle kıyaslama yap
    const isCorrect = userAnswer.toLocaleLowerCase("tr-TR") === currentQuestion.word.toLocaleLowerCase("tr-TR");
    
    if (isCorrect) {
      setScore((prev) => prev + currentPotentialScore);
      // Doğru bilince hem kelimeyi tamamlayıp göstersin hem de 2 saniye beklerken puan da eklenmiş olsun 
      revealAllAndProceed();
    } else {
      // Yanlış cevap durumunda da süre ve puan verilmeden kelime açılıp geçilecek
      revealAllAndProceed();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 sm:p-10">
        
        {/* Üst Kısım: Süre, Puan ve Anlık Değer */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b pb-4 gap-4">
          <div className="text-lg sm:text-2xl font-bold text-slate-700 flex items-center gap-2">
            <span>Süre:</span>
            <span className={`font-mono ${timeLeft < 60 ? "text-red-500" : "text-slate-900"} ${isAnswering ? "animate-pulse text-amber-500" : ""}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <div className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg">
            Bu Sorunun Değeri: {currentPotentialScore} Puan
          </div>

          <div className="text-lg sm:text-2xl font-bold text-slate-700 flex items-center gap-2">
            <span>Toplam Puan:</span>
            <span className="text-green-600 font-mono">{score}</span>
          </div>
        </div>

        {/* Orta Kısım: Soru İpucu */}
        <div className="mb-12 text-center">
          <div className="inline-block bg-indigo-100 text-indigo-800 font-semibold px-4 py-1 rounded-full text-sm mb-4">
            Soru {currentQuestionIndex + 1} / {questions.length}
          </div>
          <h2 className="text-xl sm:text-3xl font-medium text-slate-800 leading-relaxed">
            {currentQuestion.clue}
          </h2>
        </div>

        {/* Soru Kutucukları (Harfler) */}
        <div className="flex justify-center gap-2 sm:gap-4 mb-12 flex-wrap">
          {currentQuestion.word.split("").map((letter: string, index: number) => {
            const isRevealed = revealedLetters.includes(index);
            return (
              <div
                key={index}
                className={`w-12 h-16 sm:w-16 sm:h-20 border-2 rounded-xl flex items-center justify-center text-2xl sm:text-4xl font-bold uppercase transition-all duration-300
                  ${isRevealed 
                    ? "bg-slate-800 text-white border-slate-800" 
                    : "bg-slate-100 text-transparent border-slate-300 shadow-inner"
                  }`}
              >
                {isRevealed ? letter : ""}
              </div>
            );
          })}
        </div>

        {/* Alt Kısım: Butonlar veya Cevaplama Formu */}
        {!isAnswering ? (
          <div className="flex justify-center gap-4 sm:gap-6 border-t pt-8">
            <button 
              onClick={handleGetLetter}
              disabled={!isGameActive || revealedLetters.length === currentQuestion.word.length}
              className="flex-1 max-w-[200px] px-6 py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold rounded-xl transition-colors shadow-md hover:shadow-lg active:scale-95"
            >
              Harf Al
            </button>
            <button 
              onClick={handleAnswerClick}
              disabled={!isGameActive || revealedLetters.length === currentQuestion.word.length}
              className="flex-1 max-w-[200px] px-6 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold rounded-xl transition-colors shadow-md hover:shadow-lg active:scale-95"
            >
              Cevapla
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center border-t pt-8 relative">
            <div className="absolute -top-12 bg-red-100 text-red-600 px-4 py-2 font-bold rounded-xl border border-red-200">
              Kalan Cevap Süresi: {answerTimeLeft} saniye
            </div>
            
            <form onSubmit={handleSubmitAnswer} className="w-full flex flex-col sm:flex-row justify-center gap-4">
              <input
                type="text"
                autoFocus
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Cevabınızı girin..."
                className="flex-1 p-4 border-2 border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-500 text-lg uppercase font-medium"
              />
              <button 
                type="submit"
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold rounded-xl transition-colors shadow-md hover:shadow-lg active:scale-95"
              >
                Gönder
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

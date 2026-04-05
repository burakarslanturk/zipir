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

  // Oyun Sonu & Leaderboard State'leri
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

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

  // Oyun bitiş kontrolü
  useEffect(() => {
    if (!isGameActive && questions.length > 0 && !showLeaderboard) {
      setShowGameOverModal(true);
    }
  }, [isGameActive, questions.length, showLeaderboard]);

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

  const fetchLeaderboard = async () => {
    try {
      const today = new Date();
      const yyyy = today.getUTCFullYear();
      const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(today.getUTCDate()).padStart(2, "0");
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .eq("game_date", formattedDate)
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
      await fetchLeaderboard();
      setShowLeaderboard(true);
    } catch (err) {
      console.error("Kaydetme işlemi sırasında bir sorun oluştu:", err);
    } finally {
      setIsSavingScore(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {showLeaderboard ? (
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 sm:p-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 text-center border-b pb-4">
            🏆 Bugünün Liderlik Tablosu
          </h2>
          {leaderboardData.length === 0 ? (
            <p className="text-center text-slate-500 text-lg py-8">Henüz bir skor kaydedilmemiş.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-indigo-50 text-indigo-800">
                    <th className="py-3 px-4 rounded-tl-lg font-semibold">#</th>
                    <th className="py-3 px-4 font-semibold">Takma Ad</th>
                    <th className="py-3 px-4 font-semibold">Puan</th>
                    <th className="py-3 px-4 rounded-tr-lg font-semibold">Süre</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((row, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-500">{index + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{row.nickname}</td>
                      <td className="py-3 px-4 font-bold text-indigo-600">{row.score}</td>
                      <td className="py-3 px-4 text-slate-600">{formatTime(row.time_left)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-8 flex justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
            >
              Tekrar Oyna
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 sm:p-10 relative overflow-hidden">
          
          {/* Oyun Sonu Modalı */}
          {showGameOverModal && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
              <h2 className="text-4xl font-black text-indigo-700 mb-2 mt-4">Oyun Bitti!</h2>
              <p className="text-lg text-slate-600 mb-8 font-medium">Soruları tamamladınız veya süreniz doldu.</p>
              
              <div className="flex gap-4 mb-8">
                <div className="bg-indigo-50 px-6 py-4 rounded-2xl border border-indigo-100 shadow-sm min-w-[120px]">
                  <div className="text-sm text-indigo-500 font-bold tracking-wider uppercase mb-1">Skorunuz</div>
                  <div className="text-4xl font-black text-indigo-700">{score}</div>
                </div>
                <div className="bg-amber-50 px-6 py-4 rounded-2xl border border-amber-100 shadow-sm min-w-[120px]">
                  <div className="text-sm text-amber-600 font-bold tracking-wider uppercase mb-1">Kalan Süre</div>
                  <div className="text-4xl font-black text-amber-700">{formatTime(timeLeft)}</div>
                </div>
              </div>

              <form onSubmit={handleSaveScore} className="w-full max-w-sm flex flex-col gap-4">
                <input 
                  type="text" 
                  required
                  maxLength={20}
                  value={nickname} 
                  onChange={(e) => setNickname(e.target.value)} 
                  placeholder="Takma Adınızı Girin" 
                  className="w-full p-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 text-xl font-bold text-center text-slate-800 placeholder-slate-400 transition-all"
                />
                <button 
                  type="submit" 
                  disabled={isSavingScore || !nickname.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 text-lg"
                >
                  {isSavingScore ? "Kaydediliyor..." : "Skoru Kaydet"}
                </button>
              </form>
            </div>
          )}

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
      )}
    </div>
  );
}

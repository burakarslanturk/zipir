"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

function NextGameTimer() {
  const [timeLeftStr, setTimeLeftStr] = useState<string>("--:--:--");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const diffMs = nextMidnight.getTime() - now.getTime();

      if (diffMs <= 0) return "00:00:00";

      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
      const seconds = Math.floor((diffMs / 1000) % 60);

      const hh = String(hours).padStart(2, "0");
      const mm = String(minutes).padStart(2, "0");
      const ss = String(seconds).padStart(2, "0");

      return `${hh}:${mm}:${ss}`;
    };

    setTimeLeftStr(calculateTimeLeft());
    const interval = setInterval(() => setTimeLeftStr(calculateTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-8 p-6 bg-orange-50 border border-orange-100 rounded-2xl shadow-sm text-center w-full max-w-sm mx-auto">
      <p className="text-sm font-semibold text-slate-600 mb-2">Bir sonraki ZIPIR'a kalan süre:</p>
      <div className="text-4xl font-black text-orange-500 font-mono tracking-widest">{timeLeftStr}</div>
    </div>
  );
}

export default function GamePageDemo() {
  const [hasStarted, setHasStarted] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(240);
  const [isGameActive, setIsGameActive] = useState(true);
  const [revealedLetters, setRevealedLetters] = useState<number[]>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [answerTimeLeft, setAnswerTimeLeft] = useState(30);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [showToast, setShowToast] = useState(false);

  const fetchLeaderboard = async (dateStr: string) => {
    try {
      const { data } = await supabase.from("leaderboard").select("*").eq("game_date", dateStr).order("score", { ascending: false }).order("time_left", { ascending: false }).limit(50);
      if (data) setLeaderboardData(data);
    } catch {}
  };

  useEffect(() => {
    const fetchTodayQuestions = async () => {
      try {
        setIsLoading(true);
        const today = new Date();
        const formattedDate = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
        const { data } = await supabase.from("questions").select("*").eq("game_date", formattedDate).limit(14);
        if (data) setQuestions(data.sort((a, b) => a.word.length - b.word.length));
      } catch (err) {} finally {
        setIsLoading(false);
      }
    };
    fetchTodayQuestions();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading || questions.length === 0 || !hasStarted) return;
    if (isGameActive && !isAnswering && !isTransitioning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft <= 0) setIsGameActive(false);
    return () => clearInterval(timer);
  }, [isGameActive, isAnswering, isTransitioning, timeLeft, isLoading, questions.length, hasStarted]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAnswering && answerTimeLeft > 0) {
      timer = setInterval(() => setAnswerTimeLeft((prev) => prev - 1), 1000);
    } else if (isAnswering && answerTimeLeft <= 0) {
      if (questions.length > 0 && currentQuestionIndex < questions.length) {
        handleWrongAnswer((questions[currentQuestionIndex].word.length - revealedLetters.length) * 100, true);
      }
    }
    return () => clearInterval(timer);
  }, [isAnswering, answerTimeLeft, questions, currentQuestionIndex, revealedLetters.length]);

  const currentQuestionWord = questions.length > 0 ? questions[currentQuestionIndex]?.word : "";

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => {
      setRevealedLetters([]); setUserAnswer(""); setIsAnswering(false); setAnswerTimeLeft(30); setIsTransitioning(false); setAnswerStatus("idle");
      return prev < questions.length - 1 ? prev + 1 : (setIsGameActive(false), prev);
    });
  };

  const handleWrongAnswer = (penalty: number, isTimeout: boolean = false) => {
    setIsAnswering(false); setIsTransitioning(true); setScore((prev) => prev - penalty); setAnswerStatus("wrong");
    setTimeout(() => {
      setAnswerStatus("idle"); setUserAnswer("");
      setRevealedLetters(Array.from({ length: currentQuestionWord.length }, (_, i) => i));
      setTimeout(() => handleNextQuestion(), 1500);
    }, 1500);
  };

  const handleCorrectAnswer = (reward: number) => {
    setIsAnswering(false); setIsTransitioning(true); setScore((prev) => prev + reward); setAnswerStatus("correct");
    setRevealedLetters(Array.from({ length: currentQuestionWord.length }, (_, i) => i));
    setTimeout(() => handleNextQuestion(), 1500);
  };

  useEffect(() => {
    if (questions.length === 0 || !hasStarted) return;
    if (isGameActive && answerStatus === "idle" && !isAnswering && currentQuestionWord && revealedLetters.length === currentQuestionWord.length) {
      setIsTransitioning(true);
      const timer = setTimeout(() => handleNextQuestion(), 2000);
      return () => clearTimeout(timer);
    }
  }, [revealedLetters, currentQuestionIndex, isGameActive, isAnswering, questions, hasStarted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && isGameActive && !isAnswering && questions.length > 0 && currentQuestionIndex < questions.length) {
        if (revealedLetters.length !== questions[currentQuestionIndex].word.length) {
          e.preventDefault(); setIsAnswering(true); setAnswerTimeLeft(30);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGameActive, isAnswering, questions, currentQuestionIndex, revealedLetters.length]);

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  if (questions.length === 0) return <div className="min-h-screen bg-slate-50">Soru bulunamadı.</div>;

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-3">
        <h1 className="text-5xl font-black text-orange-500 mb-6">ZIPIR (Demo)</h1>
        <button onClick={() => setHasStarted(true)} className="px-8 py-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl font-bold transition-all shadow-md">Oyuna Başla</button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentPotentialScore = (currentQuestion.word.length - revealedLetters.length) * 100;

  const handleGetLetter = () => {
    if (!isGameActive || isAnswering) return;
    const unrevealedIndices: number[] = [];
    for (let i = 0; i < currentQuestion.word.length; i++) if (!revealedLetters.includes(i)) unrevealedIndices.push(i);
    if (unrevealedIndices.length > 0) setRevealedLetters((prev) => [...prev, unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)]]);
  };

  const handleAnswerClick = () => {
    if (!isGameActive || revealedLetters.length === currentQuestion.word.length) return;
    setIsAnswering(true); setAnswerTimeLeft(30);
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (userAnswer.length !== currentQuestion.word.length - revealedLetters.length) {
      setIsShaking(true); setTimeout(() => setIsShaking(false), 500); return;
    }
    let fullWord = "", typedIndex = 0;
    for (let i = 0; i < currentQuestion.word.length; i++) {
      if (revealedLetters.includes(i)) fullWord += currentQuestion.word[i];
      else fullWord += userAnswer[typedIndex++] || "";
    }
    if (fullWord.toLocaleLowerCase("tr-TR") === currentQuestion.word.toLocaleLowerCase("tr-TR")) handleCorrectAnswer(currentPotentialScore);
    else {
      setAnswerStatus("wrong"); setIsShaking(true);
      setTimeout(() => { setIsShaking(false); setAnswerStatus("idle"); setUserAnswer(""); document.getElementById('hidden-answer-input')?.focus(); }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <div className="fixed top-0 left-0 w-full z-40 pt-2 sm:pt-4 flex justify-center pointer-events-none">
        <div className="w-full max-w-4xl px-4 flex justify-center">
          <header className={`pointer-events-auto w-full bg-white/40 backdrop-blur-md shadow-sm border border-slate-200/60 rounded-2xl px-3 py-3 sm:px-4 flex items-center justify-between gap-1 sm:gap-4 transition-all duration-300 ${(showGameOverModal || showToast) ? 'blur-sm' : ''}`}>
            {/* Sol: Demo Tag */}
            <div className="flex-1 flex justify-start shrink-0">
              <span className="text-xs sm:text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">DEMO</span>
            </div>

            {/* Orta: Logo */}
            <div className="flex justify-center shrink-1 px-1 sm:px-2">
              <h1 className="text-3xl sm:text-5xl font-nunito font-black tracking-tight text-orange-500 transition-transform origin-center">
                ZIPIR<span className="text-orange-400 italic">!</span>
              </h1>
            </div>

            {/* Sağ: Puan */}
            <div className="flex-1 flex justify-end shrink-0">
              <div className="flex items-center py-1.5 px-3 sm:py-2 sm:px-5 bg-white shadow-sm rounded-xl border border-slate-100">
                <div className="text-sm sm:text-base font-semibold text-slate-600 flex items-center">
                  Puan: <span className="text-orange-500 font-bold text-base sm:text-xl ml-1 sm:ml-1.5 transition-transform duration-300">{score}</span>
                </div>
              </div>
            </div>
          </header>
        </div>
      </div>

      <main className={`flex-1 w-full max-w-4xl mx-auto px-4 flex flex-col justify-center pb-20 pt-28 sm:pt-36 ${isAnswering ? 'max-sm:pb-64' : ''}`}>
        
        {/* ANA KART */}
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

          <div className="absolute -top-4 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm uppercase tracking-wide">
            Bu sorunun değeri: {currentPotentialScore} Puan
          </div>

          <div className="mt-8 mb-10 w-full text-center">
            <h2 className="text-2xl sm:text-3xl font-serif italic text-slate-700 leading-snug">"{currentQuestion.clue}"</h2>
          </div>

          <div className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10 cursor-text ${isShaking || answerStatus === "wrong" ? "animate-shake" : ""}`} onClick={() => isAnswering && document.getElementById('hidden-answer-input')?.focus()}>
            {(() => {
              let typedIndexCounter = 0;
              return currentQuestion.word.split("").map((letter: string, index: number) => {
                const isRevealed = revealedLetters.includes(index);
                let displayChar = "", isUserTyped = false, isActiveBox = false;

                if (isRevealed) displayChar = letter;
                else {
                  if (typedIndexCounter < userAnswer.length) { displayChar = userAnswer[typedIndexCounter]; isUserTyped = true; }
                  else if (isAnswering && typedIndexCounter === userAnswer.length) isActiveBox = true;
                  typedIndexCounter++;
                }

                let boxStyle = "bg-slate-50 border-slate-200 text-transparent";
                if (answerStatus === "correct" && isRevealed) boxStyle = "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md transform -translate-y-1 transition-all duration-300";
                else if (answerStatus === "wrong" && isUserTyped) boxStyle = "bg-red-50 border-red-500 text-red-700 shadow-md";
                else if (isRevealed) boxStyle = "bg-orange-50 border-orange-200 text-orange-600 shadow-sm";
                else if (isUserTyped) boxStyle = "bg-white border-orange-400 text-orange-600 shadow-md transform -translate-y-1";
                else if (isAnswering && isActiveBox) boxStyle = "bg-orange-50/50 border-orange-300 shadow-inner ring-4 ring-orange-200/50";

                return (
                  <div key={index} className={`relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl border-2 text-2xl sm:text-3xl font-bold uppercase transition-all duration-300 ${boxStyle}`}>
                    {displayChar}
                    {isAnswering && isActiveBox && <div className="absolute w-5 h-1 bg-orange-400 bottom-2 rounded-full animate-pulse"></div>}
                  </div>
                );
              });
            })()}
          </div>

          {!isAnswering ? (
            <div className="flex flex-col sm:flex-row items-center justify-center w-full gap-4 sm:gap-6 mt-4">
              <button 
                onClick={handleGetLetter} disabled={!isGameActive || revealedLetters.length === currentQuestion.word.length}
                className="w-full sm:w-auto flex flex-col items-center justify-center group px-8 py-3.5 rounded-xl border-2 border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:border-orange-300 transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="font-bold text-lg">Harf Al</span>
                <span className="text-xs font-semibold opacity-70 mt-0.5 group-hover:opacity-100">-100 Puan</span>
              </button>
              <button 
                onClick={handleAnswerClick} disabled={!isGameActive || revealedLetters.length === currentQuestion.word.length}
                className="w-full sm:w-auto flex flex-col items-center justify-center px-10 py-3.5 rounded-xl bg-orange-500 text-white shadow-md shadow-orange-200 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-300 transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="font-bold text-lg">Cevapla</span>
                <span className="text-xs font-medium text-orange-100 mt-0.5">Tahmini Gir</span>
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center mt-4 relative">
              <div className="absolute -top-12 bg-red-50 text-red-600 border border-red-200 px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-1.5 shadow-sm animate-pulse">
                <span>⏱️</span> Kalan Cevap Süresi: {answerTimeLeft} sn
              </div>
              <form onSubmit={handleSubmitAnswer} className="w-full flex flex-col items-center gap-3 relative">
                <input id="hidden-answer-input" type="text" autoFocus autoComplete="off" autoCorrect="off" spellCheck="false" value={userAnswer} maxLength={currentQuestion.word.length - revealedLetters.length} onChange={(e) => setUserAnswer(e.target.value.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ]/g, '').toLocaleUpperCase('tr-TR'))} className="absolute opacity-0 w-0 h-0 -z-10" />
                <div className="text-center text-slate-500 text-sm mb-4">Klavyeden harfleri tuşlayın. Göndermek için <strong className="text-slate-700">Enter</strong>'a basın.</div>
                <button type="submit" className="px-10 py-3 bg-orange-500 text-white font-bold rounded-xl shadow-md hover:bg-orange-600 transition-all active:scale-95 text-lg">Gönder</button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

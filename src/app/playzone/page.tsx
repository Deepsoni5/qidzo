"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, Trophy, Star, Rocket, Loader2, ArrowLeft, Brain, Swords, Clock3 } from "lucide-react";
import { getCurrentUserRole } from "@/actions/auth";
import { getPlayzoneOverview, startQuestionSession, completeGameSession } from "@/actions/games";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";

type OverlayView = "browse" | "select-level" | "playing";
type GameFilter = "ALL" | "ARCADE" | "QUESTION";

interface QuestionSessionStats {
  score: number;
  correctCount: number;
  totalQuestions: number;
  durationSec: number;
  result: any;
}

interface QuestionSessionProps {
  gameName: string;
  levelName: string;
  data: any;
  onExit: () => void;
  onFinished: (stats: QuestionSessionStats) => void;
}

interface MemoryMatchSessionProps {
  levelName: string;
  config: any;
  onExit: () => void;
  onFinished: (stats: QuestionSessionStats) => void;
}

function QuestionSession({ gameName, levelName, data, onExit, onFinished }: QuestionSessionProps) {
  const questions = data?.questions || [];
  const totalQuestions = questions.length || 0;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const answersRef = useRef<{ questionId: string; isCorrect: boolean }[]>([]);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startedAtRef.current) {
      startedAtRef.current = Date.now();
    }
  }, []);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (option: string) => {
    if (!currentQuestion || showFeedback) return;

    const isCorrect = option === currentQuestion.correctAnswer;
    answersRef.current = [...answersRef.current, { questionId: currentQuestion.id, isCorrect }];

    setSelectedOption(option);
    setShowFeedback(true);

    setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < totalQuestions) {
        setCurrentIndex(nextIndex);
        setSelectedOption(null);
        setShowFeedback(false);
      } else {
        const correctCount = answersRef.current.filter(a => a.isCorrect).length;
        const durationSec = startedAtRef.current
          ? Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000))
          : 0;
        const score = correctCount * 100;

        const result = {
          questions: questions.map((q: any) => ({
            id: q.id,
            type: q.type,
            prompt: q.prompt,
          })),
          answers: answersRef.current,
        };

        onFinished({
          score,
          correctCount,
          totalQuestions,
          durationSec,
          result,
        });
      }
    }, 700);
  };

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Loader2 className="w-10 h-10 text-brand-purple animate-spin" />
        <p className="text-lg font-bold text-gray-700">Loading questions...</p>
      </div>
    );
  }

  const options = (currentQuestion.options || []) as string[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-brand-purple/80 uppercase tracking-[0.15em]">
            {gameName}
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">{levelName}</h2>
        </div>
        <div className="flex items-center gap-2 bg-sky-50 px-4 py-2 rounded-2xl border border-sky-100">
          <Clock3 className="w-5 h-5 text-sky-500" />
          <span className="text-sm font-bold text-sky-700">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-brand-purple/5 via-sky-50 to-hot-pink/5 rounded-[32px] p-5 md:p-7 border border-white shadow-lg shadow-brand-purple/10">
        <p className="text-lg md:text-2xl font-black text-gray-900 leading-snug">
          {currentQuestion.prompt}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {options.map(option => {
          const isSelected = selectedOption === option;
          const isCorrectOption = showFeedback && option === currentQuestion.correctAnswer;
          const isWrongOption = showFeedback && isSelected && option !== currentQuestion.correctAnswer;

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleAnswer(option)}
              disabled={showFeedback}
              className={[
                "w-full text-left px-4 py-4 md:px-5 md:py-5 rounded-[24px] border-3 text-base md:text-lg font-bold transition-all active:scale-95 cursor-pointer",
                "shadow-sm hover:shadow-xl hover:-translate-y-0.5",
                "bg-white",
                isCorrectOption
                  ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                  : isWrongOption
                  ? "border-rose-400 bg-rose-50 text-rose-800"
                  : isSelected
                  ? "border-brand-purple bg-brand-purple/5 text-brand-purple"
                  : "border-gray-100 text-gray-700 hover:border-brand-purple/40",
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-3">
                <span className="w-8 h-8 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-black">
                  {String.fromCharCode(65 + options.indexOf(option))}
                </span>
                <span>{option}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 mt-2">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm bg-white hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit game
        </button>
        <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
          <Brain className="w-4 h-4 text-brand-purple" />
          <span>Think carefully before you tap</span>
        </div>
      </div>
    </div>
  );
}

type MemoryCardState = "hidden" | "visible" | "matched";

interface MemoryCard {
  id: string;
  value: string;
  state: MemoryCardState;
}

function MemoryMatchSession({ levelName, config, onExit, onFinished }: MemoryMatchSessionProps) {
  const pairs = typeof config?.pairs === "number" && config.pairs > 0 ? config.pairs : 6;
  const emojis = ["🧠", "🚀", "🌟", "🧩", "🎈", "🎨", "📚", "🎵", "🦄", "🦊", "🍕", "⚡️"];
  const usedEmojis = emojis.slice(0, pairs);

  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [firstIndex, setFirstIndex] = useState<number | null>(null);
  const [secondIndex, setSecondIndex] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const baseCards: MemoryCard[] = [];
    usedEmojis.forEach((emoji, index) => {
      const firstId = `${emoji}-${index}-a`;
      const secondId = `${emoji}-${index}-b`;
      baseCards.push({ id: firstId, value: emoji, state: "hidden" });
      baseCards.push({ id: secondId, value: emoji, state: "hidden" });
    });

    const shuffled = [...baseCards];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    setCards(shuffled);
    startedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (matches === pairs && pairs > 0) {
      const durationSec = startedAtRef.current
        ? Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000))
        : 0;
      const efficiency = moves > 0 ? pairs / moves : 1;
      const baseScore = pairs * 120;
      const score = Math.max(0, Math.round(baseScore * efficiency));

      const result = {
        pairs,
        moves,
        durationSec,
      };

      onFinished({
        score,
        correctCount: pairs,
        totalQuestions: pairs,
        durationSec,
        result,
      });
    }
  }, [matches, pairs, moves, onFinished]);

  const handleCardClick = (index: number) => {
    if (isBusy) return;
    const card = cards[index];
    if (!card || card.state !== "hidden") return;

    const updated = [...cards];
    updated[index] = { ...card, state: "visible" };
    setCards(updated);

    if (firstIndex === null) {
      setFirstIndex(index);
      return;
    }

    if (secondIndex === null) {
      setSecondIndex(index);
      setIsBusy(true);
      setMoves(prev => prev + 1);

      setTimeout(() => {
        const firstCard = updated[firstIndex];
        const secondCard = updated[index];

        if (firstCard && secondCard && firstCard.value === secondCard.value) {
          updated[firstIndex] = { ...firstCard, state: "matched" };
          updated[index] = { ...secondCard, state: "matched" };
          setCards(updated);
          setMatches(prev => prev + 1);
        } else {
          updated[firstIndex] = { ...firstCard, state: "hidden" };
          updated[index] = { ...secondCard, state: "hidden" };
          setCards(updated);
        }

        setFirstIndex(null);
        setSecondIndex(null);
        setIsBusy(false);
      }, 600);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-brand-purple/80 uppercase tracking-[0.15em]">
            Memory Match
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">{levelName}</h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
            <Brain className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-700">
              Matches: {matches}/{pairs}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-sky-50 px-3 py-1 rounded-2xl border border-sky-100">
            <Clock3 className="w-4 h-4 text-sky-500" />
            <span className="text-xs font-bold text-sky-700">Moves: {moves}</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-brand-purple/5 via-sky-50 to-hot-pink/5 rounded-[32px] p-4 md:p-6 border border-white shadow-lg shadow-brand-purple/10">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3 md:gap-4 max-w-xl mx-auto">
          {cards.map((card, index) => (
            <button
              key={card.id}
              type="button"
              onClick={() => handleCardClick(index)}
              disabled={card.state !== "hidden" || isBusy}
              className={[
                "aspect-square rounded-3xl flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-black transition-all cursor-pointer",
                "border-3 shadow-sm active:scale-95",
                card.state === "matched"
                  ? "bg-emerald-100 border-emerald-300 text-emerald-700 shadow-emerald-100"
                  : card.state === "visible"
                  ? "bg-white border-brand-purple text-brand-purple shadow-brand-purple/20"
                  : "bg-white border-gray-200 text-gray-300 hover:border-brand-purple/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-purple/10",
              ].join(" ")}
            >
              {card.state === "hidden" ? "?" : card.value}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mt-2">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm bg-white hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit game
        </button>
        <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
          <Swords className="w-4 h-4 text-hot-pink" />
          <span>Find all the matching pairs</span>
        </div>
      </div>
    </div>
  );
}

export default function PlayzonePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [roleData, setRoleData] = useState<any>(null);
  const [overview, setOverview] = useState<any | null>(null);
  const [filter, setFilter] = useState<GameFilter>("ALL");
  const [overlayView, setOverlayView] = useState<OverlayView>("browse");
  const [activeGame, setActiveGame] = useState<any | null>(null);
  const [activeLevel, setActiveLevel] = useState<any | null>(null);
  const [sessionData, setSessionData] = useState<any | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isCompletingSession, setIsCompletingSession] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<any | null>(null);

  useEffect(() => {
    const init = async () => {
      const data = await getCurrentUserRole();

      if (data?.isChild && data.child?.focus_mode) {
        toast("Exam Mode is Enabled! 🎓", {
          description: "Focus on your studies and earn rewards! Play Zone is temporarily locked. ✨",
          duration: 6000,
          style: {
            background: "#F0F9FF",
            border: "3px solid #0EA5E9",
            color: "#075985",
            fontSize: "18px",
            fontFamily: "Nunito, sans-serif",
            fontWeight: "bold",
          },
          className: "rounded-[24px] shadow-2xl border-b-8 border-black/5",
        });
        router.push("/");
        return;
      }

      setRoleData(data);

      if (data?.isChild) {
        const nextOverview = await getPlayzoneOverview();
        setOverview(nextOverview);
      }

      setIsLoading(false);
    };

    init();
  }, [router]);

  const handleOpenGame = (game: any) => {
    setActiveGame(game);
    setActiveLevel(null);
    setSessionData(null);
    setSessionSummary(null);
    setOverlayView("select-level");
  };

  const handleStartLevel = async (level: any) => {
    if (!activeGame || !level) return;
    if (!level.canPlay) {
      toast("Unlock this level by beating the previous one!", {
        description: "Clear earlier levels to open this challenge.",
        duration: 4000,
      });
      return;
    }

    if (activeGame.type === "QUESTION") {
      setIsStartingSession(true);
      const session = await startQuestionSession(activeGame.id, level.id);
      setIsStartingSession(false);

      if (!session || !session.success) {
        toast("Unable to start this quiz", {
          description: session?.error || "Please try again in a moment.",
        });
        return;
      }

      setActiveLevel(level);
      setSessionData(session);
      setOverlayView("playing");
      return;
    }

    if (activeGame.slug !== "memory-match") {
      toast("This arcade game is coming soon!", {
        description: "New mini-games are on the way.",
      });
      return;
    }

    setActiveLevel(level);
    setSessionData({
      mode: "memory-match",
      config: level.config || {},
    });
    setOverlayView("playing");
  };

  const handleExitOverlay = () => {
    if (isCompletingSession) return;
    setOverlayView("browse");
    setActiveGame(null);
    setActiveLevel(null);
    setSessionData(null);
    setSessionSummary(null);
  };

  const handleSessionFinished = async (stats: QuestionSessionStats) => {
    if (!activeGame || !activeLevel) return;
    setIsCompletingSession(true);

    const result = await completeGameSession({
      gameId: activeGame.id,
      levelId: activeLevel.id,
      score: stats.score,
      correctCount: stats.correctCount,
      totalQuestions: stats.totalQuestions,
      durationSec: stats.durationSec,
      result: stats.result,
    });

    setIsCompletingSession(false);

    if (!result || !result.success) {
      toast("We could not save your game", {
        description: result?.error || "Please try again later.",
      });
      return;
    }

    setSessionSummary(result);

    toast("Nice game! ✨", {
      description: `You earned ${result.xpAwarded} XP`,
    });

    const nextOverview = await getPlayzoneOverview();
    setOverview(nextOverview);

    if (nextOverview && (nextOverview as any).games) {
      const updatedGame = (nextOverview as any).games.find((g: any) => g.id === activeGame.id);
      if (updatedGame) {
        setActiveGame(updatedGame);
      }
    }

    if (result.passed) {
      setTimeout(() => {
        setOverlayView("select-level");
        setSessionData(null);
        setActiveLevel(null);
        setSessionSummary(null);
      }, 2200);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-purple animate-spin" />
      </div>
    );
  }

  const child = overview?.child;
  const games = (overview?.games || []) as any[];

  const filteredGames = games.filter(game => {
    if (filter === "ALL") return true;
    if (filter === "ARCADE") return game.type === "ARCADE";
    if (filter === "QUESTION") return game.type === "QUESTION";
    return true;
  });

  const showChildOnlyMessage = !roleData?.isChild;

  return (
    <div className="min-h-screen bg-white font-nunito pb-24 lg:pb-0">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="relative rounded-[40px] p-6 md:p-8 lg:p-10 bg-secondary shadow-2xl shadow-brand-purple/20 border border-brand-purple/10 mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-hot-pink/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
            <div className="flex items-center gap-4 md:gap-6 w-full lg:w-auto">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-brand-purple rounded-[32px] flex items-center justify-center text-white shadow-xl shadow-brand-purple/40 ring-8 ring-brand-purple/10">
                <Gamepad2 className="w-10 h-10 md:w-12 md:h-12 stroke-[2.5px]" />
              </div>
              <div className="flex-1 lg:hidden">
                <p className="text-xs md:text-sm font-bold text-brand-purple/80 uppercase tracking-[0.2em] mb-1">
                  Welcome to
                </p>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-1 tracking-tight">
                  Play Zone
                  <span className="inline-block ml-2">🎮</span>
                </h1>
                <p className="text-sm md:text-base text-gray-500 font-bold">
                  Quick mini-games for smart kids who love learning.
                </p>
              </div>
            </div>

            <div className="hidden lg:block flex-1">
              <p className="text-sm font-bold text-brand-purple/80 uppercase tracking-[0.25em] mb-2">
                Welcome to
              </p>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2 tracking-tight">
                Play Zone
                <span className="inline-block ml-3">🎮</span>
              </h1>
              <p className="text-base md:text-lg text-gray-500 font-bold max-w-xl">
                Choose a game, beat fun challenges, and collect shiny XP and stars as you go.
              </p>
            </div>

            {child && (
              <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4">
                <div className="flex-1 bg-secondary rounded-[28px] px-5 py-4 border border-sunshine-yellow/40 shadow-md shadow-sunshine-yellow/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center">
                      <Star className="w-6 h-6 text-sunshine-yellow fill-sunshine-yellow" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-[0.18em]">
                        XP Points
                      </p>
                      <p className="text-xl font-black text-amber-800">
                        {child.xpPoints ?? 0}
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end text-xs font-bold text-amber-700">
                    <span>Keep playing</span>
                    <span>to level up</span>
                  </div>
                </div>
                <div className="flex-1 bg-secondary rounded-[28px] px-5 py-4 border border-brand-purple/30 shadow-md shadow-brand-purple/25 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-brand-purple" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-purple/90 uppercase tracking-[0.18em]">
                        Player Level
                      </p>
                      <p className="text-xl font-black text-brand-purple">
                        Lv. {child.level ?? 1}
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end text-xs font-bold text-brand-purple/80">
                    <span>{child.name}</span>
                    <span className="text-xs text-brand-purple/60">@{child.username}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showChildOnlyMessage && (
          <div className="bg-sky-50 border-4 border-sky-100 p-6 rounded-[32px] mb-8 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center shrink-0">
              <span className="text-3xl">🧒</span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-black text-sky-900 mb-1">For kids only</h2>
              <p className="text-sky-700 font-bold">
                Play Zone is built for child accounts. Ask your parent to switch to your kid profile
                so you can jump into the games.
              </p>
            </div>
          </div>
        )}

        {roleData?.isChild && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
                  Choose your challenge
                </p>
                <p className="text-lg font-black text-gray-900">
                  Tap a game card to see its levels.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur rounded-[999px] p-1 border-2 border-gray-100 shadow-md shadow-brand-purple/10">
                {([
                  { key: "ALL", label: "All" },
                  { key: "ARCADE", label: "Arcade" },
                  { key: "QUESTION", label: "Brainy" },
                ] as { key: GameFilter; label: string }[]).map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key)}
                    className={[
                      "px-3 sm:px-4 py-1.5 rounded-[999px] text-xs sm:text-sm font-bold transition-all cursor-pointer",
                      filter === item.key
                        ? "bg-brand-purple text-white shadow-md shadow-brand-purple/30"
                        : "bg-transparent text-gray-500 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {games.length === 0 && (
              <div className="bg-white rounded-[32px] border-4 border-dashed border-gray-200 p-8 text-center">
                <p className="text-lg font-black text-gray-700 mb-1">Games are warming up</p>
                <p className="text-sm font-bold text-gray-500">
                  Come back soon to see all your learning mini-games.
                </p>
              </div>
            )}

            {games.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
                {filteredGames.map(game => {
                  const totalLevels = game.totalLevels || 0;
                  const unlockedLevels = game.unlockedLevels || 0;
                  const totalStars = game.totalStars || 0;

                  const typeBadge =
                    game.type === "ARCADE"
                      ? {
                          label: "Arcade",
                          color: "bg-emerald-50 text-emerald-700 border-emerald-100",
                          icon: <Rocket className="w-3.5 h-3.5" />,
                        }
                      : {
                          label: "Brainy",
                          color: "bg-sky-50 text-sky-700 border-sky-100",
                          icon: <Brain className="w-3.5 h-3.5" />,
                        };

                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => handleOpenGame(game)}
                      className="group relative bg-white p-4 rounded-[36px] border-4 border-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-left ring-1 ring-black/5 cursor-pointer"
                    >
                      <div className="rounded-[28px] p-6 mb-5 flex items-center justify-between bg-gradient-to-br from-brand-purple/5 via-sky-50 to-hot-pink/5 overflow-hidden">
                        <div className="flex flex-col gap-2">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border bg-white/80 text-gray-700 border-gray-100">
                            {typeBadge.icon}
                            <span>{typeBadge.label}</span>
                          </span>
                          <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            {game.icon || "🎮"} <span>{game.name}</span>
                          </h3>
                          {game.description && (
                            <p className="text-sm font-bold text-gray-500 line-clamp-2">
                              {game.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-gray-100 shadow-sm">
                            <Trophy className="w-4 h-4 text-sunshine-yellow" />
                            <span className="text-xs font-bold text-gray-700">
                              {totalStars} ⭐
                            </span>
                          </div>
                          <div className="text-xs font-bold text-gray-400">
                            {unlockedLevels}/{totalLevels} levels cleared
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-2 pb-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-2xl bg-brand-purple/5 text-brand-purple text-base">
                            {game.icon || "🎮"}
                          </span>
                          <span>Tap to view levels</span>
                        </div>
                        <span className="text-xs font-black text-brand-purple group-hover:translate-x-1 transition-transform">
                          Play
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {activeGame && overlayView !== "browse" && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm px-2 sm:px-4 pt-20 pb-28 md:pt-24 md:pb-20 flex justify-center overflow-y-auto">
          <div className="w-full max-w-3xl md:max-w-4xl bg-secondary rounded-[32px] md:rounded-[40px] border border-brand-purple/10 shadow-2xl shadow-brand-purple/30 p-4 sm:p-5 md:p-7 my-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={overlayView === "playing" ? () => setOverlayView("select-level") : handleExitOverlay}
                  className="w-9 h-9 rounded-2xl bg-white border-2 border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.18em]">
                    {overlayView === "select-level" ? "Game levels" : "Now playing"}
                  </p>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-2xl bg-brand-purple/10 text-lg">
                      {activeGame.icon || "🎮"}
                    </span>
                    <span>{activeGame.name}</span>
                  </h2>
                </div>
              </div>
              {child && (
                <div className="hidden md:flex items-center gap-3 bg-white/80 px-4 py-2 rounded-[999px] border-2 border-gray-100">
                  <Star className="w-4 h-4 text-sunshine-yellow fill-sunshine-yellow" />
                  <span className="text-xs font-bold text-gray-700">
                    {child.xpPoints ?? 0} XP
                  </span>
                </div>
              )}
            </div>

            {overlayView === "select-level" && (
              <div className="space-y-4 md:space-y-5">
                <p className="text-sm font-bold text-gray-500">
                  Pick a level to start playing. Higher levels mean trickier questions and bigger rewards.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  {activeGame.levels.map((level: any) => {
                    const locked = !level.canPlay;
                    const stars = level.progress?.starsEarned ?? 0;
                    const attempts = level.progress?.attemptsCount ?? 0;

                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => handleStartLevel(level)}
                        disabled={isStartingSession || locked}
                        className={[
                          "relative flex flex-col items-stretch text-left rounded-[26px] border-3 p-4 bg-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 cursor-pointer",
                          locked
                            ? "opacity-60 border-dashed border-gray-200 cursor-not-allowed"
                            : "border-brand-purple/20 hover:border-brand-purple/60",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.18em]">
                              Level {level.levelNumber}
                            </p>
                            <p className="text-base font-black text-gray-900">{level.name}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="inline-flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-2xl border border-amber-100">
                              <Star className="w-3.5 h-3.5 text-sunshine-yellow fill-sunshine-yellow" />
                              <span className="text-xs font-bold text-amber-700">{stars}</span>
                            </div>
                            <span className="text-[11px] font-bold text-gray-400">
                              {attempts === 0 ? "New" : `${attempts} tries`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                          <span>Target: {level.targetScore}</span>
                          {locked ? (
                            <span className="inline-flex items-center gap-1 text-rose-500">
                              🔒 Beat earlier level
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-brand-purple">
                              ▶ Play
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {isStartingSession && (
                  <div className="flex items-center justify-center gap-3 text-sm font-bold text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-purple" />
                    <span>Setting up your game...</span>
                  </div>
                )}
              </div>
            )}

            {overlayView === "playing" && sessionData && (
              <div className="space-y-4 md:space-y-5">
                {activeGame.type === "QUESTION" && (
                  <QuestionSession
                    gameName={activeGame.name}
                    levelName={activeLevel?.name || ""}
                    data={sessionData}
                    onExit={handleExitOverlay}
                    onFinished={handleSessionFinished}
                  />
                )}
                {activeGame.type === "ARCADE" && sessionData.mode === "memory-match" && (
                  <MemoryMatchSession
                    levelName={activeLevel?.name || ""}
                    config={sessionData.config}
                    onExit={handleExitOverlay}
                    onFinished={handleSessionFinished}
                  />
                )}

                {isCompletingSession && (
                  <div className="flex items-center justify-center gap-3 text-sm font-bold text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-purple" />
                    <span>Saving your score...</span>
                  </div>
                )}

                {sessionSummary && (
                  <div className="mt-2 bg-white rounded-[28px] border-3 border-brand-purple/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-brand-purple/10 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-brand-purple" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">
                          {sessionSummary.passed ? "Level cleared!" : "Game over, try again!"}
                        </p>
                        <p className="text-xs font-bold text-gray-500">
                          Score {sessionSummary.score} • {sessionSummary.correctCount}/
                          {sessionSummary.totalQuestions} correct
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-sunshine-yellow/20 px-3 py-1.5 rounded-2xl border-2 border-sunshine-yellow/40">
                        <Star className="w-4 h-4 text-sunshine-yellow fill-sunshine-yellow" />
                        <span className="text-xs font-black text-amber-800">
                          +{sessionSummary.xpAwarded} XP
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <MobileNav />
    </div>
  );
}

"use server";

import { supabase } from "@/lib/supabaseClient";
import { getChildSession } from "./auth";

type GameType = "ARCADE" | "QUESTION";

interface RawGame {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: GameType;
  min_age: number | null;
  max_age: number | null;
  icon: string | null;
  is_active: boolean;
}

interface RawLevel {
  id: string;
  game_id: string;
  level_number: number;
  name: string;
  description: string | null;
  min_age: number | null;
  max_age: number | null;
  config: any;
  target_score: number;
  max_time_sec: number | null;
  xp_base: number;
  xp_per_correct: number;
  is_active: boolean;
}

interface RawProgress {
  id: string;
  child_id: string;
  game_id: string;
  level_id: string;
  best_score: number;
  stars_earned: number;
  attempts_count: number;
  last_played_at: string | null;
  unlocked: boolean;
}

interface RawQuestion {
  id: string;
  game_id: string;
  level_id: string | null;
  type: string;
  prompt: string;
  options: any;
  correct_answer: string;
}

interface PlayzoneOverview {
  child: {
    id: string;
    childId: string;
    name: string;
    username: string;
    avatar: string | null;
    age: number | null;
    level: number;
    xpPoints: number;
  };
  games: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    type: GameType;
    minAge: number | null;
    maxAge: number | null;
    icon: string | null;
    totalLevels: number;
    unlockedLevels: number;
    totalStars: number;
    levels: {
      id: string;
      levelNumber: number;
      name: string;
      description: string | null;
      targetScore: number;
      maxTimeSec: number | null;
      config: any;
      progress: {
        bestScore: number;
        starsEarned: number;
        attemptsCount: number;
        unlocked: boolean;
        lastPlayedAt: string | null;
      };
      canPlay: boolean;
    }[];
  }[];
}

export async function getPlayzoneOverview(): Promise<PlayzoneOverview | null> {
  try {
    const session = await getChildSession();
    if (!session || !session.id) {
      return null;
    }

    const { data: childRow, error: childError } = await supabase
      .from("children")
      .select("id, child_id, name, username, avatar, age, level, xp_points")
      .eq("child_id", session.id as string)
      .single();

    if (childError || !childRow) {
      return null;
    }

    const childIdUuid = childRow.id as string;
    const childAge = (childRow.age as number | null) ?? null;

    const { data: gamesData, error: gamesError } = await supabase
      .from("games")
      .select("*")
      .eq("is_active", true)
      .order("min_age", { ascending: true });

    if (gamesError || !gamesData || gamesData.length === 0) {
      return {
        child: {
          id: childIdUuid,
          childId: childRow.child_id,
          name: childRow.name,
          username: childRow.username,
          avatar: childRow.avatar,
          age: childAge,
          level: childRow.level,
          xpPoints: childRow.xp_points,
        },
        games: [],
      };
    }

    const gameIds = (gamesData as RawGame[]).map(g => g.id);

    const { data: levelsData, error: levelsError } = await supabase
      .from("game_levels")
      .select("*")
      .in("game_id", gameIds)
      .eq("is_active", true)
      .order("level_number", { ascending: true });

    if (levelsError || !levelsData) {
      return null;
    }

    const { data: progressData } = await supabase
      .from("child_game_progress")
      .select("*")
      .eq("child_id", childIdUuid);

    const progressList = (progressData || []) as RawProgress[];
    const progressByLevel = new Map<string, RawProgress>();
    for (const p of progressList) {
      progressByLevel.set(p.level_id, p);
    }

    const levelsByGame = new Map<string, RawLevel[]>();
    for (const level of levelsData as RawLevel[]) {
      const byGame = levelsByGame.get(level.game_id) || [];
      byGame.push(level);
      levelsByGame.set(level.game_id, byGame);
    }

    const games: PlayzoneOverview["games"] = [];

    for (const rawGame of gamesData as RawGame[]) {
      const allLevels = (levelsByGame.get(rawGame.id) || []).filter(level => {
        if (childAge === null) return true;
        const minOk = level.min_age == null || level.min_age <= childAge;
        const maxOk = level.max_age == null || level.max_age >= childAge;
        return minOk && maxOk;
      }).sort((a, b) => a.level_number - b.level_number);

      if (allLevels.length === 0) continue;

      let unlockedLevels = 0;
      let totalStars = 0;

      const gameLevels = allLevels.map((level, index) => {
        const progress = progressByLevel.get(level.id);
        const isPlaceholder =
          progress &&
          (progress.attempts_count ?? 0) === 0 &&
          (progress.stars_earned ?? 0) === 0;

        const bestScore = progress?.best_score ?? 0;
        const starsEarned = isPlaceholder ? 0 : progress?.stars_earned ?? 0;
        const attemptsCount = isPlaceholder ? 0 : progress?.attempts_count ?? 0;
        const unlockedFlag = isPlaceholder ? false : progress?.unlocked ?? false;

        const previousLevel = index > 0 ? allLevels[index - 1] : null;
        const previousProgress = previousLevel
          ? progressByLevel.get(previousLevel.id)
          : undefined;
        const prevIsPlaceholder =
          previousProgress &&
          (previousProgress.attempts_count ?? 0) === 0 &&
          (previousProgress.stars_earned ?? 0) === 0;
        const prevUnlocked =
          previousProgress && !prevIsPlaceholder && previousProgress.unlocked;

        const canPlay = index === 0 || Boolean(prevUnlocked);

        if (unlockedFlag) {
          unlockedLevels += 1;
        }
        totalStars += starsEarned;

        return {
          id: level.id,
          levelNumber: level.level_number,
          name: level.name,
          description: level.description,
          targetScore: level.target_score,
          maxTimeSec: level.max_time_sec,
          config: level.config,
          progress: {
            bestScore,
            starsEarned,
            attemptsCount,
            unlocked: unlockedFlag,
            lastPlayedAt: progress?.last_played_at ?? null,
          },
          canPlay,
        };
      });

      games.push({
        id: rawGame.id,
        slug: rawGame.slug,
        name: rawGame.name,
        description: rawGame.description,
        type: rawGame.type,
        minAge: rawGame.min_age,
        maxAge: rawGame.max_age,
        icon: rawGame.icon,
        totalLevels: gameLevels.length,
        unlockedLevels,
        totalStars,
        levels: gameLevels,
      });
    }

    return {
      child: {
        id: childIdUuid,
        childId: childRow.child_id,
        name: childRow.name,
        username: childRow.username,
        avatar: childRow.avatar,
        age: childAge,
        level: childRow.level,
        xpPoints: childRow.xp_points,
      },
      games,
    };
  } catch (error) {
    console.error("Error in getPlayzoneOverview:", error);
    return null;
  }
}

export async function startQuestionSession(gameId: string, levelId: string) {
  try {
    const session = await getChildSession();
    if (!session || !session.id) {
      return { success: false, error: "Not logged in as child" };
    }

    const { data: gameRow, error: gameError } = await supabase
      .from("games")
      .select("id, slug, name, type")
      .eq("id", gameId)
      .single();

    if (gameError || !gameRow) {
      return { success: false, error: "Game not found" };
    }

    if (gameRow.type !== "QUESTION") {
      return { success: false, error: "Game is not question-based" };
    }

    const { data: levelRow, error: levelError } = await supabase
      .from("game_levels")
      .select("id, game_id, level_number, target_score, max_time_sec, xp_base, xp_per_correct, config")
      .eq("id", levelId)
      .single();

    if (levelError || !levelRow || levelRow.game_id !== gameRow.id) {
      return { success: false, error: "Level not found" };
    }

    const { data: questionsData, error: questionsError } = await supabase
      .from("game_questions")
      .select("id, type, prompt, options, correct_answer")
      .eq("game_id", gameRow.id)
      .eq("level_id", levelRow.id)
      .eq("is_active", true);

    if (questionsError || !questionsData || questionsData.length === 0) {
      return { success: false, error: "No questions available for this level yet" };
    }

    const questions = questionsData as RawQuestion[];

    const config = (levelRow.config as any) || {};
    const numConfigured = typeof config.numQuestions === "number" ? config.numQuestions : questions.length;
    const numQuestions = Math.max(1, Math.min(numConfigured, questions.length));

    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    const selected = shuffled.slice(0, numQuestions).map(q => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      correctAnswer: q.correct_answer,
    }));

    const timePerQuestion = typeof config.timePerQuestion === "number" ? config.timePerQuestion : 0;
    const totalTime =
      typeof levelRow.max_time_sec === "number"
        ? levelRow.max_time_sec
        : timePerQuestion > 0
        ? timePerQuestion * numQuestions
        : null;

    return {
      success: true,
      game: {
        id: gameRow.id,
        slug: gameRow.slug,
        name: gameRow.name,
      },
      level: {
        id: levelRow.id,
        levelNumber: levelRow.level_number,
        targetScore: levelRow.target_score,
        xpBase: levelRow.xp_base,
        xpPerCorrect: levelRow.xp_per_correct,
      },
      config: {
        numQuestions,
        timePerQuestion,
        totalTime,
      },
      questions: selected,
    };
  } catch (error) {
    console.error("Error in startQuestionSession:", error);
    return { success: false, error: "Failed to start game session" };
  }
}

interface CompleteSessionPayload {
  gameId: string;
  levelId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  durationSec: number;
  result: any;
}

export async function completeGameSession(payload: CompleteSessionPayload) {
  try {
    const session = await getChildSession();
    if (!session || !session.id) {
      return { success: false, error: "Not logged in as child" };
    }

    const { data: childRow, error: childError } = await supabase
      .from("children")
      .select("id, xp_points")
      .eq("child_id", session.id as string)
      .single();

    if (childError || !childRow) {
      return { success: false, error: "Child not found" };
    }

    const childIdUuid = childRow.id as string;

    const { data: levelRow, error: levelError } = await supabase
      .from("game_levels")
      .select("id, game_id, level_number, target_score, xp_base, xp_per_correct")
      .eq("id", payload.levelId)
      .single();

    if (levelError || !levelRow || levelRow.game_id !== payload.gameId) {
      return { success: false, error: "Invalid level" };
    }

    const passed = payload.score >= levelRow.target_score;

    let stars = 0;
    if (levelRow.target_score > 0) {
      const ratio = payload.score / levelRow.target_score;
      if (ratio >= 1.4) stars = 3;
      else if (ratio >= 1) stars = 2;
      else if (ratio >= 0.6) stars = 1;
    }

    const xpAwardedRaw = levelRow.xp_base + payload.correctCount * levelRow.xp_per_correct;
    const xpAwarded = xpAwardedRaw > 0 ? xpAwardedRaw : 0;

    const now = new Date();
    const startedAt = new Date(now.getTime() - Math.max(0, payload.durationSec) * 1000);

    const { error: attemptError } = await supabase.from("game_attempts").insert({
      child_id: childIdUuid,
      game_id: payload.gameId,
      level_id: payload.levelId,
      started_at: startedAt.toISOString(),
      finished_at: now.toISOString(),
      duration_sec: Math.max(0, Math.round(payload.durationSec)),
      score: payload.score,
      correct_count: payload.correctCount,
      total_questions: payload.totalQuestions,
      result: payload.result,
      xp_awarded: xpAwarded,
    });

    if (attemptError) {
      console.error("Error inserting game_attempt:", attemptError);
    }

    const { data: existingProgress, error: progressError } = await supabase
      .from("child_game_progress")
      .select("*")
      .eq("child_id", childIdUuid)
      .eq("game_id", payload.gameId)
      .eq("level_id", payload.levelId)
      .maybeSingle();

    if (progressError && (progressError as any).code !== "PGRST116") {
      console.error("Error reading child_game_progress:", progressError);
    }

    const existing = existingProgress as RawProgress | null;

    const bestScore = Math.max(existing?.best_score ?? 0, payload.score);
    const attemptsCount = (existing?.attempts_count ?? 0) + 1;
    const starsEarned = Math.max(existing?.stars_earned ?? 0, stars);
    const unlocked = existing?.unlocked || passed;

    const upsertPayload: Partial<RawProgress> & {
      child_id: string;
      game_id: string;
      level_id: string;
      best_score: number;
      stars_earned: number;
      attempts_count: number;
      last_played_at: string;
      unlocked: boolean;
    } = {
      child_id: childIdUuid,
      game_id: payload.gameId,
      level_id: payload.levelId,
      best_score: bestScore,
      stars_earned: starsEarned,
      attempts_count: attemptsCount,
      last_played_at: now.toISOString(),
      unlocked,
    };

    if (existing?.id) {
      (upsertPayload as any).id = existing.id;
    }

    const { error: upsertError } = await supabase
      .from("child_game_progress")
      .upsert(upsertPayload);

    if (upsertError) {
      console.error("Error upserting child_game_progress:", upsertError);
    }

    let newTotalXp = childRow.xp_points || 0;
    if (xpAwarded > 0) {
      newTotalXp += xpAwarded;
      const { error: xpError } = await supabase
        .from("children")
        .update({ xp_points: newTotalXp })
        .eq("id", childIdUuid);

      if (xpError) {
        console.error("Error updating child XP:", xpError);
      }
    }

    return {
      success: true,
      score: payload.score,
      correctCount: payload.correctCount,
      totalQuestions: payload.totalQuestions,
      starsEarned: stars,
      xpAwarded,
      newTotalXp,
      passed,
    };
  } catch (error) {
    console.error("Error in completeGameSession:", error);
    return { success: false, error: "Failed to complete game session" };
  }
}

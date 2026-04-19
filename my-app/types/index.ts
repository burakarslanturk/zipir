export interface Question {
  id?: string;
  word: string;
  clue: string;
  game_date?: string;
}

export interface LeaderboardRow {
  id?: string;
  nickname: string;
  score: number;
  time_left: number;
  game_date: string;
  user_id?: string;
}

export interface UserStats {
  totalGames: number;
  bestScore: number;
  avgScore: number;
  streak: number;
}

export type AnswerStatus = "idle" | "correct" | "wrong";
export type SettingsTab = "ses" | "tema" | "nasil";

export type SeasonId = string;

export type FriendId = string;
export type MatchId = string;
export type PlayerMatchId = string;

export interface Friend {
  id: FriendId;
  realName: string;
  memo?: string | null;
  createdAt: string;
}

export interface Match {
  id: MatchId;
  playedAt: string; // ISO date string
  durationSeconds: number;
  season?: string | null;
  screenshotUrl?: string | null;
  createdAt: string;
}

export type TeamSide = "BLUE" | "RED";

export interface PlayerMatch {
  id: PlayerMatchId;
  matchId: MatchId;
  friendId?: FriendId | null;
  ingameNickname: string;
  team: TeamSide;
  championName: string;
  lane?: "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT" | null;
  level?: number | null;
  kills: number;
  deaths: number;
  assists: number;
  damage?: number | null;
  gold?: number | null;
  cs?: number | null;
  win: boolean;
  createdAt: string;
}



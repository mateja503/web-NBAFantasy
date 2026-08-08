// Mirrors the API's GameDto / GameTeamDto / ScheduledGamesDto casing literally, like the other
// models in this folder — no camelCase remapping on the way in.

export interface GameTeam {
  teamId: number;
  fullName: string | null;
  abbreviation: string | null;
  city: string | null;
  /** 0 for a game that has not been played yet, which is the normal case on this page. */
  score: number;
}

export interface Game {
  gameId: number;
  /** yyyy-MM-dd in the NBA timezone (America/New_York), not the browser's timezone. */
  date: string | null;
  /** balldontlie's own label: a tip-off time before the game, a clock or "Final" once underway. */
  status: string | null;
  time: string | null;
  startTime: string | null;
  postseason: boolean;
  postponed: boolean;
  homeTeam: GameTeam | null;
  visitorTeam: GameTeam | null;
}

export interface ScheduledGames {
  today: Game[];
  tomorrow: Game[];
  /** Day after tomorrow through the Sunday closing the current week; never overlaps the other two. */
  restOfWeek: Game[];
}

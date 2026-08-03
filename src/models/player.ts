/**
 * A player from the league-wide pool, as returned by GET /v1/players.
 * Carries every nba.player column except `tscreated`. `position` is already the
 * readable label ("G", "GF", ...) — the API converts the numeric code before sending it.
 */
export interface Player {
  playerid: number;
  name: string;
  surname: string;
  irlteamname?: string | null;
  irlteamid?: number | null;
  position?: string | null;
  points?: number | null;
  rebounds?: number | null;
  assists?: number | null;
  steals?: number | null;
  blocks?: number | null;
  threepointers?: number | null;
  turnovers?: number | null;
  fieldgoal?: number | null;
  freethrow?: number | null;
  allowdrop?: boolean | null;
  islock?: boolean | null;
  rosterrole?: number | null;
  gameready?: number | null;
  playermemontoid?: number | null;
  tsupdated?: string | null;
  /** Fantasy team rostering this player in the requested league; null unless leagueId was sent. */
  team?: string | null;
}

/**
 * Query for GET /v1/players — mirrors the server's PlayersFilterSearch one for one.
 * Every field is optional; sending none returns the first page of all players.
 * Strings match case-insensitively on "contains"; numeric columns are min/max ranges.
 */
export interface PlayersFilter {
  // identity
  name?: string;
  surname?: string;
  irlteamname?: string;
  irlteamid?: number;
  playerposition?: string[];

  // stat ranges
  minPoints?: number;
  maxPoints?: number;
  minAssists?: number;
  maxAssists?: number;
  minRebounds?: number;
  maxRebounds?: number;
  minBlocks?: number;
  maxBlocks?: number;
  minSteals?: number;
  maxSteals?: number;
  minThreepointers?: number;
  maxThreepointers?: number;
  minTurnovers?: number;
  maxTurnovers?: number;
  minFreethrow?: number;
  maxFreethrow?: number;
  minFieldgoal?: number;
  maxFieldgoal?: number;

  // flags
  allowdrop?: boolean;
  islock?: boolean;

  // internal
  rosterrole?: number;
  gameready?: number;
  playermemontoid?: number;

  // dates (ISO strings)
  tscreatedFrom?: string;
  tscreatedTo?: string;
  tsupdatedFrom?: string;
  tsupdatedTo?: string;

  // Scopes which fantasy team name is returned per player, rather than narrowing the results.
  leagueId?: number;

  // paging
  page?: number;
  pageSize?: number;
}

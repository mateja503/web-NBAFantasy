import { League } from './league';

/**
 * Canonical Team domain model. Single source of truth for the Team shape —
 * services re-export this so existing `import { Team } from './team-service'`
 * paths keep working while the definition lives in one place.
 */
export interface Team {
  teamid: number;
  name: string;
  seed?: number;
  waiverpriority?: number;
  lastweekpoints?: number;
  categoryleaguepoints?: number;
  islock?: boolean;
  competesinleague: League;
}

// Shape returned by /get-leagues-teams/{leagueId}. It's a projection of the team
// (no nested league), so it gets its own DTO rather than reusing the fuller Team model.
export interface GetLeagueTeamsResponse {
  teamid: number;
  name: string;
  seed?: number;
  waiverpriority?: number;
  lastweekpoints?: number;
  categoryleaguepoints?: number;
  islock?: boolean;
}

// A player on a roster, as returned inside /get-user-teams. `position` is already the
// readable label ("G", "GF", ...) — the API converts the numeric code before sending it.
export interface TeamPlayer {
  playerid: number;
  name: string;
  surname: string;
  irlteamname?: string;
  position?: string;
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  threepointers?: number;
  turnovers?: number;
  fieldgoal?: number;
  freethrow?: number;
}

// Shape returned by /get-user-teams/{userId}: a team the signed-in user owns, with its
// roster and a flat league label (rather than the nested league on the Team model).
export interface UserTeamResponse {
  teamid: number;
  name: string;
  seed?: number;
  waiverpriority?: number;
  lastweekpoints?: number;
  categoryleaguepoints?: number;
  islock?: boolean;
  leagueid?: number;
  leaguename?: string;
  players: TeamPlayer[];
}

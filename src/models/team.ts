import { League } from './league';
import { Player } from './player';

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

// Shape returned by /get-user-teams/{userId}: a team the signed-in user owns, with its
// roster and a flat league label (rather than the nested league on the Team model).
// The roster rows are the same PlayerDto the players endpoint returns (only `team` is
// null there, since the roster already implies the fantasy team).
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
  players: Player[];
}

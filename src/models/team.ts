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

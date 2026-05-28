import { League } from "./league-service";

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
import { UserResponse } from '../services/auth-service';
import { League } from '../models/league';
import { Team, GetLeagueTeamsResponse, UserTeamResponse } from '../models/team';
import { Player } from '../models/player';

/**
 * Builders for the domain DTOs. Each takes a partial override so a spec states only
 * the fields it actually asserts on, and stays readable when the model grows a column.
 */

export function makeLeague(overrides: Partial<League> = {}): League {
  return {
    leagueid: 1,
    name: 'Test League',
    commissioner: 10,
    seasonyear: '2026',
    ...overrides,
  };
}

export function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    teamid: 100,
    name: 'Test Team',
    competesinleague: makeLeague(),
    ...overrides,
  };
}

export function makeLeagueTeam(
  overrides: Partial<GetLeagueTeamsResponse> = {},
): GetLeagueTeamsResponse {
  return { teamid: 100, name: 'Test Team', ...overrides };
}

export function makeUserTeam(overrides: Partial<UserTeamResponse> = {}): UserTeamResponse {
  return { teamid: 100, name: 'Test Team', players: [], ...overrides };
}

export function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    playerid: 1000,
    name: 'Test',
    surname: 'Player',
    position: 'G',
    points: 20,
    rebounds: 5,
    assists: 5,
    ...overrides,
  };
}

export function makeUserResponse(overrides: Partial<UserResponse> = {}): UserResponse {
  return {
    token: 'test-jwt-token',
    username: 'tester',
    userid: 42,
    teams: [makeTeam()],
    leagues: [makeLeague({ commissionersTeam: makeTeam() })],
    ...overrides,
  };
}

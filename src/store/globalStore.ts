import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { UserResponse } from '../services/auth-service';
import { TeamService } from '../services/team-service';
import { GetLeagueTeamsResponse } from '../models/team';

export interface TeamInStorage {
  teamId: number;
  name: string;
  competesInLeagueId?: number;
  competesInLeagueName?: string;
}

export interface LeagueInStorage {
  leagueId: number;
  name: string;
  commissionersTeamId: number;
  commissionersTeamName: string;
}

// Define the shape of our user state matching your LoginResponse
export interface UserState {
  username: string;
  userid: number;
  // NOTE: persisting the JWT in localStorage (with the rest of UserState) keeps
  // it readable by any script on the page, so it is exposed to XSS. It's kept
  // here to match the existing persistence model; the more secure long-term
  // option is an in-memory token + httpOnly refresh cookie issued by the API.
  token?: string;
  selectedTeamId?: number;
  selectedTeamName?: string;
  selectedLeagueId?: number;
  selectedLeagueName?: string;
  teams: TeamInStorage[]; // Replace 'any' with your actual Team interface
  leagues: LeagueInStorage[]; // Replace 'any' with your actual League interface
}

// Cached teams for a single league. We keep the leagueId alongside the teams so
// we can tell whether the cache belongs to the league currently being drafted.
export interface LeagueTeamsCache {
  leagueId: number;
  teams: GetLeagueTeamsResponse[];
}

interface GlobalState {
  user: UserState | null;
  leagueTeamsCache: LeagueTeamsCache | null;
}

const LOCAL_STORAGE_KEY = 'use_store_state'; // Key for storing user state in LocalStorage
const LEAGUE_TEAMS_KEY = 'league_teams'; // Key for the cached teams of a league

// Helper function to safely read and initialize state from LocalStorage on app boot
function loadUserFromStorage(): UserState | null {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as UserState;
  } catch {
    return null; // Fallback if data gets corrupted
  }
}

function loadLeagueTeamsFromStorage(): LeagueTeamsCache | null {
  const data = localStorage.getItem(LEAGUE_TEAMS_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as LeagueTeamsCache;
  } catch {
    return null; // Fallback if data gets corrupted
  }
}

export const GlobalStore = signalStore(
  { providedIn: 'root' },

  // 1. Initialize State (Instantly reads from LocalStorage on refresh!)
  withState<GlobalState>({
    user: loadUserFromStorage(),
    leagueTeamsCache: loadLeagueTeamsFromStorage(),
  }),

  // 2. Computed Getters
  withComputed(({ user, leagueTeamsCache }) => ({
    isLoggedIn: computed(() => user() != null),
    token: computed(() => user()?.token ?? null),
    managedTeams: computed(() => user()?.teams ?? []),
    commissionerLeagues: computed(() => user()?.leagues ?? []),
    selectedTeamId: computed(() => user()?.selectedTeamId),
    selectedTeamName: computed(() => user()?.selectedTeamName),
    selectedLeagueId: computed(() => user()?.selectedLeagueId),
    selectedLeagueName: computed(() => user()?.selectedLeagueName),
    userid: computed(() => user()?.userid),
    leagueTeams: computed(() => leagueTeamsCache()?.teams ?? []),
  })),

  // 3. Methods / Actions
  withMethods((store, teamService = inject(TeamService)) => ({
    // Call this right after a successful server login response
    loginSuccess(data: UserResponse) {

      let userState: UserState = {
        username: data.username ?? '',
        userid: data.userid ?? 0,
        token: data.token,
        teams: data.teams.map(t => ({
          teamId: t.teamid,
          name: t.name,
          competesInLeagueId: t.competesinleague?.leagueid,
          competesInLeagueName: t.competesinleague?.name
        })) ?? [],
        leagues: data.leagues.map(l => ({
          leagueId: l.leagueid,
          name: l.name,
          commissionersTeamId: l.commissionersTeam?.teamid ?? 0,
          commissionersTeamName: l.commissionersTeam?.name ?? '',
        })) ?? []
      };

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userState));
      patchState(store, { user: userState });
    },

    logout() {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(LEAGUE_TEAMS_KEY);
      patchState(store, { user: null, leagueTeamsCache: null });
    },

    // Ensures the cached teams belong to `leagueId`. If the cache is empty or
    // holds a different league's teams, it is cleared and refetched from the API.
    ensureLeagueTeams(leagueId: number) {
      const cache = store.leagueTeamsCache();
      if (cache && cache.leagueId === leagueId && cache.teams.length > 0) {
        return; // Already populated for this league.
      }

      // Switching leagues (or nothing cached): empty the store, then refill.
      localStorage.removeItem(LEAGUE_TEAMS_KEY);
      patchState(store, { leagueTeamsCache: null });

      teamService.getLeaguesTeams(leagueId).subscribe((teams) => {
        const next: LeagueTeamsCache = { leagueId, teams };
        localStorage.setItem(LEAGUE_TEAMS_KEY, JSON.stringify(next));
        patchState(store, { leagueTeamsCache: next });
      });
    },

    selectTeam(teamId: number, teamName: string) {
      const updatedUserState: UserState = {
        ...store.user()!,
        selectedTeamId: teamId,
        selectedTeamName: teamName
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUserState));
      patchState(store, { user: updatedUserState });
    },

    selectLeague(leagueId: number, leagueName: string) {
      const updatedUserState: UserState = {
        ...store.user()!,
        selectedLeagueId: leagueId,
        selectedLeagueName: leagueName
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUserState));
      patchState(store, { user: updatedUserState });
    },

    selectCommissionersTeam(commissionersTeamId: number, commissionersTeamName: string) {
      const updatedUserState: UserState = {
        ...store.user()!,
        selectedTeamId: commissionersTeamId,
        selectedTeamName: commissionersTeamName
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUserState));
      patchState(store, { user: updatedUserState });
    },

    selectTeamsLeague(competesInLeagueId: number, competesInLeagueName: string) {
      const updatedUserState: UserState = {
        ...store.user()!,
        selectedLeagueId: competesInLeagueId,
        selectedLeagueName: competesInLeagueName
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUserState));
      patchState(store, { user: updatedUserState });
    }

  }))
);
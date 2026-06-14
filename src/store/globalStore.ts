import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { UserResponse } from '../services/auth-service';

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

interface GlobalState {
  user: UserState | null;
}

const LOCAL_STORAGE_KEY = 'nba_fantasy_teams_leagues';

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

export const GlobalStore = signalStore(
  { providedIn: 'root' },

  // 1. Initialize State (Instantly reads from LocalStorage on refresh!)
  withState<GlobalState>({
    user: loadUserFromStorage(),
  }),

  // 2. Computed Getters
  withComputed(({ user }) => ({
    isLoggedIn: computed(() => user() != null),
    token: computed(() => user()?.token ?? null),
    managedTeams: computed(() => user()?.teams ?? []),
    commissionerLeagues: computed(() => user()?.leagues ?? []),
    selectedTeamId: computed(() => user()?.selectedTeamId),
    selectedTeamName: computed(() => user()?.selectedTeamName),
    selectedLeagueId: computed(() => user()?.selectedLeagueId),
    selectedLeagueName: computed(() => user()?.selectedLeagueName),
    userid: computed(() => user()?.userid),
  })),

  // 3. Methods / Actions
  withMethods((store) => ({
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
      patchState(store, { user: null });
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
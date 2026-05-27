import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { UserResponse } from '../services/auth-service';

export interface TeamInStorage{
    teamId: number;
    name: string;
}

export interface LeagueInStorage{
    leagueId: number;
    name: string;
}

// Define the shape of our user state matching your LoginResponse
export interface UserState {
  username: string;
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
    managedTeams: computed(() => user()?.teams ?? []),
    commissionerLeagues: computed(() => user()?.leagues ?? []),
    selectedTeamId: computed(() => user()?.selectedTeamId),
    selectedTeamName: computed(() => user()?.selectedTeamName),
    selectedLeagueId: computed(() => user()?.selectedLeagueId),
    selectedLeagueName: computed(() => user()?.selectedLeagueName),
  })),
  
  // 3. Methods / Actions
  withMethods((store) => ({
    // Call this right after a successful server login response
    loginSuccess(data: UserResponse) {
         
      let userState: UserState = {
        username: data.username ?? '',
        teams: data.teams.map(t=> ({
            teamId: t.teamid,
            name: t.name
        })) ?? [],
        leagues: data.leagues.map(l => ({
            leagueId: l.leagueid,
            name: l.name
        })) ?? []
      };  

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userState));
      patchState(store, { user: userState });
    },

    logout() {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      patchState(store, { user: null });
    },

    selectTeam(teamId: number) 
    {
        const teams = store?.user()?.teams ?? [];
        if(teams.length === 0) return;

        const team = teams.find(t => t.teamId === teamId);
        if(!team){
            console.warn(`[GlobalStore] Team with ID ${teamId} not found in user context.`);
            return;
        } 

        const updatedUserState: UserState = {
            ...store.user()!,
            selectedTeamId: team.teamId,
            selectedTeamName: team.name
        }

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUserState));

        patchState(store, { user: updatedUserState });
    },

    selectLeague(leagueId: number)
    {
        const leagues = store?.user()?.leagues ?? [];
        if(leagues.length === 0) return;
    
        const league = leagues.find(l => l.leagueId === leagueId);
        if(!league){
            console.warn(`[GlobalStore] League with ID ${leagueId} not found in user context.`);
            return;
        }

        const updatedUserState: UserState = {
            ...store.user()!,
            selectedLeagueId: league.leagueId,
            selectedLeagueName: league.name
        }

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUserState));

        patchState(store, { user: updatedUserState });
    },

  }))
);
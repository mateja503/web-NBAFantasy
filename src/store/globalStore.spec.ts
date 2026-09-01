import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GlobalStore, UserState, LeagueTeamsCache } from './globalStore';
import { TEST_API_BASE_URL, provideConfigStub } from '../testing/test-helpers';
import { makeLeague, makeLeagueTeam, makeTeam, makeUserResponse } from '../testing/fixtures';

const USER_KEY = 'use_store_state';
const TEAMS_KEY = 'league_teams';

describe('GlobalStore', () => {
  let httpMock: HttpTestingController;

  /**
   * The store hydrates from localStorage when it is first injected, so every spec
   * seeds storage first and only then asks for the instance.
   */
  function createStore() {
    const store = TestBed.inject(GlobalStore);
    httpMock = TestBed.inject(HttpTestingController);
    return store;
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideConfigStub()],
    });
  });

  afterEach(() => localStorage.clear());

  describe('hydration from localStorage', () => {
    it('starts logged out when storage is empty', () => {
      const store = createStore();

      expect(store.user()).toBeNull();
      expect(store.isLoggedIn()).toBe(false);
      expect(store.token()).toBeNull();
      expect(store.managedTeams()).toEqual([]);
      expect(store.commissionerLeagues()).toEqual([]);
      expect(store.leagueTeams()).toEqual([]);
    });

    it('restores a persisted session', () => {
      const persisted: UserState = {
        username: 'restored',
        userid: 7,
        token: 'stored-token',
        selectedTeamId: 3,
        selectedTeamName: 'Ballers',
        selectedLeagueId: 9,
        selectedLeagueName: 'Main League',
        teams: [{ teamId: 3, name: 'Ballers' }],
        leagues: [
          {
            leagueId: 9,
            name: 'Main League',
            commissionersTeamId: 3,
            commissionersTeamName: 'Ballers',
          },
        ],
      };
      localStorage.setItem(USER_KEY, JSON.stringify(persisted));

      const store = createStore();

      expect(store.isLoggedIn()).toBe(true);
      expect(store.token()).toBe('stored-token');
      expect(store.userid()).toBe(7);
      expect(store.selectedTeamId()).toBe(3);
      expect(store.selectedTeamName()).toBe('Ballers');
      expect(store.selectedLeagueId()).toBe(9);
      expect(store.selectedLeagueName()).toBe('Main League');
      expect(store.managedTeams()).toHaveLength(1);
    });

    it('restores a cached league-teams entry', () => {
      const cache: LeagueTeamsCache = { leagueId: 9, teams: [makeLeagueTeam({ teamid: 3 })] };
      localStorage.setItem(TEAMS_KEY, JSON.stringify(cache));

      const store = createStore();

      expect(store.leagueTeams()).toHaveLength(1);
      expect(store.leagueTeamsCache()?.leagueId).toBe(9);
    });

    it('falls back to logged-out when the stored user JSON is corrupt', () => {
      localStorage.setItem(USER_KEY, '{not valid json');

      const store = createStore();

      expect(store.user()).toBeNull();
      expect(store.isLoggedIn()).toBe(false);
    });

    it('falls back to an empty cache when the stored teams JSON is corrupt', () => {
      localStorage.setItem(TEAMS_KEY, 'also not json');

      const store = createStore();

      expect(store.leagueTeamsCache()).toBeNull();
      expect(store.leagueTeams()).toEqual([]);
    });
  });

  describe('loginSuccess', () => {
    it('maps the response into user state and persists it', () => {
      const store = createStore();
      const league = makeLeague({ leagueid: 9, name: 'Main League' });

      store.loginSuccess(
        makeUserResponse({
          token: 'jwt',
          username: 'tester',
          userid: 42,
          teams: [makeTeam({ teamid: 3, name: 'Ballers', competesinleague: league })],
          leagues: [
            makeLeague({
              leagueid: 9,
              name: 'Main League',
              commissionersTeam: makeTeam({ teamid: 3, name: 'Ballers' }),
            }),
          ],
        }),
      );

      expect(store.isLoggedIn()).toBe(true);
      expect(store.token()).toBe('jwt');
      expect(store.managedTeams()).toEqual([
        { teamId: 3, name: 'Ballers', competesInLeagueId: 9, competesInLeagueName: 'Main League' },
      ]);
      expect(store.commissionerLeagues()).toEqual([
        {
          leagueId: 9,
          name: 'Main League',
          commissionersTeamId: 3,
          commissionersTeamName: 'Ballers',
        },
      ]);

      const persisted = JSON.parse(localStorage.getItem(USER_KEY) ?? '{}') as UserState;
      expect(persisted.token).toBe('jwt');
      expect(persisted.userid).toBe(42);
    });

    it('defaults a missing username and userid rather than storing undefined', () => {
      const store = createStore();

      store.loginSuccess(makeUserResponse({ username: undefined, userid: undefined }));

      expect(store.user()?.username).toBe('');
      expect(store.userid()).toBe(0);
    });

    it('defaults commissioner-team fields when a league has no commissionersTeam', () => {
      const store = createStore();

      store.loginSuccess(
        makeUserResponse({ leagues: [makeLeague({ leagueid: 9, commissionersTeam: undefined })] }),
      );

      expect(store.commissionerLeagues()[0]).toMatchObject({
        commissionersTeamId: 0,
        commissionersTeamName: '',
      });
    });

    it('accepts a response with no teams or leagues', () => {
      const store = createStore();

      store.loginSuccess(makeUserResponse({ teams: [], leagues: [] }));

      expect(store.isLoggedIn()).toBe(true);
      expect(store.managedTeams()).toEqual([]);
      expect(store.commissionerLeagues()).toEqual([]);
    });
  });

  describe('logout', () => {
    it('clears state and both storage keys', () => {
      const store = createStore();
      store.loginSuccess(makeUserResponse());
      localStorage.setItem(TEAMS_KEY, JSON.stringify({ leagueId: 9, teams: [] }));

      store.logout();

      expect(store.user()).toBeNull();
      expect(store.isLoggedIn()).toBe(false);
      expect(store.leagueTeamsCache()).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
      expect(localStorage.getItem(TEAMS_KEY)).toBeNull();
    });

    it('is safe to call when already logged out', () => {
      const store = createStore();

      expect(() => store.logout()).not.toThrow();
      expect(store.user()).toBeNull();
    });
  });

  describe('ensureLeagueTeams', () => {
    const teamsUrl = (leagueId: number) =>
      `${TEST_API_BASE_URL}/v1/team/get-leagues-teams/${leagueId}`;

    it('fetches and caches when nothing is cached', () => {
      const store = createStore();

      store.ensureLeagueTeams(9);

      const req = httpMock.expectOne(teamsUrl(9));
      expect(req.request.method).toBe('GET');
      req.flush([makeLeagueTeam({ teamid: 3 })]);

      expect(store.leagueTeams()).toHaveLength(1);
      const cached = JSON.parse(localStorage.getItem(TEAMS_KEY) ?? '{}') as LeagueTeamsCache;
      expect(cached.leagueId).toBe(9);
      httpMock.verify();
    });

    it('does not refetch when the cache already holds that league', () => {
      const cache: LeagueTeamsCache = { leagueId: 9, teams: [makeLeagueTeam()] };
      localStorage.setItem(TEAMS_KEY, JSON.stringify(cache));
      const store = createStore();

      store.ensureLeagueTeams(9);

      httpMock.expectNone(teamsUrl(9));
      expect(store.leagueTeams()).toHaveLength(1);
    });

    it('clears and refetches when switching to a different league', () => {
      const cache: LeagueTeamsCache = { leagueId: 9, teams: [makeLeagueTeam({ teamid: 3 })] };
      localStorage.setItem(TEAMS_KEY, JSON.stringify(cache));
      const store = createStore();

      store.ensureLeagueTeams(10);

      // The stale league's teams must be gone before the new ones arrive, so the UI
      // never renders league 9's rosters while league 10 is selected.
      expect(store.leagueTeamsCache()).toBeNull();

      httpMock.expectOne(teamsUrl(10)).flush([makeLeagueTeam({ teamid: 55 })]);

      expect(store.leagueTeamsCache()?.leagueId).toBe(10);
      expect(store.leagueTeams()[0]?.teamid).toBe(55);
      httpMock.verify();
    });

    it('refetches when the cached league matches but holds no teams', () => {
      const cache: LeagueTeamsCache = { leagueId: 9, teams: [] };
      localStorage.setItem(TEAMS_KEY, JSON.stringify(cache));
      const store = createStore();

      store.ensureLeagueTeams(9);

      httpMock.expectOne(teamsUrl(9)).flush([makeLeagueTeam()]);
      expect(store.leagueTeams()).toHaveLength(1);
      httpMock.verify();
    });
  });

  describe('selection methods', () => {
    it('selectTeam updates the selected team and persists', () => {
      const store = createStore();
      store.loginSuccess(makeUserResponse());

      store.selectTeam(3, 'Ballers');

      expect(store.selectedTeamId()).toBe(3);
      expect(store.selectedTeamName()).toBe('Ballers');
      const persisted = JSON.parse(localStorage.getItem(USER_KEY) ?? '{}') as UserState;
      expect(persisted.selectedTeamId).toBe(3);
    });

    it('selectLeague updates the selected league and persists', () => {
      const store = createStore();
      store.loginSuccess(makeUserResponse());

      store.selectLeague(9, 'Main League');

      expect(store.selectedLeagueId()).toBe(9);
      expect(store.selectedLeagueName()).toBe('Main League');
    });

    it('selectCommissionersTeam sets the selected team', () => {
      const store = createStore();
      store.loginSuccess(makeUserResponse());

      store.selectCommissionersTeam(11, 'Commish Team');

      expect(store.selectedTeamId()).toBe(11);
      expect(store.selectedTeamName()).toBe('Commish Team');
    });

    it('selectTeamsLeague sets the selected league for the chosen team', () => {
      const store = createStore();
      store.loginSuccess(makeUserResponse());

      store.selectTeamsLeague(12, 'Team League');

      expect(store.selectedLeagueId()).toBe(12);
      expect(store.selectedLeagueName()).toBe('Team League');
    });

    it('keeps earlier selections when a later one touches a different field', () => {
      const store = createStore();
      store.loginSuccess(makeUserResponse());

      store.selectTeam(3, 'Ballers');
      store.selectLeague(9, 'Main League');

      expect(store.selectedTeamId()).toBe(3);
      expect(store.selectedLeagueId()).toBe(9);
    });
  });
});

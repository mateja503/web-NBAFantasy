import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TeamService } from './team-service';
import { TEST_API_BASE_URL, provideConfigStub } from '../testing/test-helpers';
import { makeLeagueTeam, makePlayer, makeUserTeam } from '../testing/fixtures';

describe('TeamService', () => {
  let service: TeamService;
  let httpMock: HttpTestingController;

  const teamUrl = `${TEST_API_BASE_URL}/v1/team`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideConfigStub()],
    });
    service = TestBed.inject(TeamService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLeaguesTeams', () => {
    it('GETs the teams of a league', () => {
      const expected = [makeLeagueTeam({ teamid: 3 }), makeLeagueTeam({ teamid: 4 })];
      let received: unknown;

      service.getLeaguesTeams(9).subscribe((r) => (received = r));

      const req = httpMock.expectOne(`${teamUrl}/get-leagues-teams/9`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      expect(received).toEqual(expected);
    });

    it('passes an empty result straight through', () => {
      let received: unknown;
      service.getLeaguesTeams(9).subscribe((r) => (received = r));

      httpMock.expectOne(`${teamUrl}/get-leagues-teams/9`).flush([]);

      expect(received).toEqual([]);
    });
  });

  describe('getUserTeams', () => {
    it('GETs the teams owned by a user, with rosters', () => {
      const expected = [makeUserTeam({ teamid: 3, players: [makePlayer()] })];
      let received: unknown;

      service.getUserTeams(42).subscribe((r) => (received = r));

      const req = httpMock.expectOne(`${teamUrl}/get-user-teams/42`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      expect(received).toEqual(expected);
    });

    it('surfaces the API rejection when the userId is not the token holder', () => {
      let status: number | undefined;

      service.getUserTeams(999).subscribe({ error: (e) => (status = e.status) });

      httpMock
        .expectOne(`${teamUrl}/get-user-teams/999`)
        .flush('forbidden', { status: 403, statusText: 'Forbidden' });

      expect(status).toBe(403);
    });
  });

  describe('getTeamPlayers', () => {
    it('GETs one roster', () => {
      const expected = [makePlayer({ playerid: 1 }), makePlayer({ playerid: 2 })];
      let received: unknown;

      service.getTeamPlayers(3).subscribe((r) => (received = r));

      const req = httpMock.expectOne(`${teamUrl}/get-team-players/3`);
      expect(req.request.method).toBe('GET');
      req.flush(expected);

      expect(received).toEqual(expected);
    });

    it('surfaces the league-membership rejection', () => {
      let status: number | undefined;

      service.getTeamPlayers(777).subscribe({ error: (e) => (status = e.status) });

      httpMock
        .expectOne(`${teamUrl}/get-team-players/777`)
        .flush('not your league', { status: 403, statusText: 'Forbidden' });

      expect(status).toBe(403);
    });
  });
});

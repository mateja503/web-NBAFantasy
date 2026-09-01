import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CreateLeagueRequest, JoinLeagueRequest, LeagueService } from './league-service';
import { TEST_API_BASE_URL, provideConfigStub } from '../testing/test-helpers';
import { makeLeague } from '../testing/fixtures';

describe('LeagueService', () => {
  let service: LeagueService;
  let httpMock: HttpTestingController;
  let consoleError: ReturnType<typeof vi.spyOn>;

  const leagueUrl = `${TEST_API_BASE_URL}/v1/league`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideConfigStub()],
    });
    service = TestBed.inject(LeagueService);
    httpMock = TestBed.inject(HttpTestingController);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    httpMock.verify();
    consoleError.mockRestore();
  });

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLeagues', () => {
    it('unwraps items from the pagination envelope', () => {
      const leagues = [makeLeague({ leagueid: 1 }), makeLeague({ leagueid: 2 })];
      let received: unknown;

      service.getLeagues().subscribe((r) => (received = r));

      const req = httpMock.expectOne(leagueUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ items: leagues, page: 1, pageSize: 10, totalCount: 2, totalPages: 1 });

      expect(received).toEqual(leagues);
    });

    it('yields an empty array when the envelope has no items', () => {
      let received: unknown;

      service.getLeagues().subscribe((r) => (received = r));

      httpMock.expectOne(leagueUrl).flush({ page: 1, pageSize: 10, totalCount: 0, totalPages: 0 });

      expect(received).toEqual([]);
    });

    it('surfaces a failure to the caller instead of completing empty', () => {
      // Swallowing this into EMPTY left callers unable to tell "no leagues" from
      // "the request failed"; httpErrorInterceptor handles the user-facing message.
      let emitted = false;
      let completed = false;
      let status: number | undefined;

      service.getLeagues().subscribe({
        next: () => (emitted = true),
        error: (e) => (status = e.status),
        complete: () => (completed = true),
      });

      httpMock.expectOne(leagueUrl).flush('boom', { status: 500, statusText: 'Server Error' });

      expect(emitted).toBe(false);
      expect(completed).toBe(false);
      expect(status).toBe(500);
    });
  });

  describe('addleague', () => {
    it('POSTs the create payload and returns the new league', () => {
      const payload: CreateLeagueRequest = {
        leagueName: 'New League',
        leagueType: 1,
        draftStyle: 2,
        weeksForSeason: 20,
        autoStart: true,
        statsValue: { points: 1, assists: 2 },
      };
      const created = makeLeague({ leagueid: 77, name: 'New League' });
      let received: unknown;

      service.addleague(payload).subscribe((r) => (received = r));

      const req = httpMock.expectOne(`${leagueUrl}/add`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(created);

      expect(received).toEqual(created);
    });

    it('surfaces a validation error to the caller', () => {
      let status: number | undefined;

      service.addleague({ leagueName: '' }).subscribe({ error: (e) => (status = e.status) });

      httpMock
        .expectOne(`${leagueUrl}/add`)
        .flush('name required', { status: 400, statusText: 'Bad Request' });

      expect(status).toBe(400);
    });
  });

  describe('joinLeague', () => {
    it('POSTs the join payload', () => {
      const payload: JoinLeagueRequest = { leagueId: 9, teamName: 'Ballers', userId: 42 };

      service.joinLeague(payload).subscribe();

      const req = httpMock.expectOne(`${leagueUrl}/join`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({});
    });

    it('surfaces a conflict when the league is full or already joined', () => {
      let status: number | undefined;

      service
        .joinLeague({ leagueId: 9, teamName: 'Ballers' })
        .subscribe({ error: (e) => (status = e.status) });

      httpMock
        .expectOne(`${leagueUrl}/join`)
        .flush('already joined', { status: 409, statusText: 'Conflict' });

      expect(status).toBe(409);
    });
  });
});

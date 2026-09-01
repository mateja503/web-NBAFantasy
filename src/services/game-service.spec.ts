import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GameService } from './game-service';
import { ScheduledGames } from '../models/game';
import { TEST_API_BASE_URL, provideConfigStub } from '../testing/test-helpers';

describe('GameService', () => {
  let service: GameService;
  let httpMock: HttpTestingController;

  const gamesUrl = `${TEST_API_BASE_URL}/v1/games`;

  const emptySchedule: ScheduledGames = { today: [], tomorrow: [], restOfWeek: [] };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideConfigStub()],
    });
    service = TestBed.inject(GameService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('GETs the scheduled games and returns all three buckets', () => {
    const schedule: ScheduledGames = {
      today: [
        {
          gameId: 1,
          date: '2026-09-01',
          status: '7:30 PM ET',
          time: null,
          startTime: null,
          postseason: false,
          postponed: false,
          homeTeam: {
            teamId: 1,
            fullName: 'Home',
            abbreviation: 'HOM',
            city: 'Hometown',
            score: 0,
          },
          visitorTeam: {
            teamId: 2,
            fullName: 'Away',
            abbreviation: 'AWY',
            city: 'Awaytown',
            score: 0,
          },
        },
      ],
      tomorrow: [],
      restOfWeek: [],
    };
    let received: ScheduledGames | undefined;

    service.getScheduledGames().subscribe((r) => (received = r));

    const req = httpMock.expectOne(gamesUrl);
    expect(req.request.method).toBe('GET');
    req.flush(schedule);

    expect(received?.today).toHaveLength(1);
    expect(received?.tomorrow).toEqual([]);
    expect(received?.restOfWeek).toEqual([]);
  });

  it('sends no Authorization requirement of its own — the endpoint is anonymous', () => {
    service.getScheduledGames().subscribe();

    const req = httpMock.expectOne(gamesUrl);
    // The service never sets the header itself; authInterceptor is the only thing that would.
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(emptySchedule);
  });

  it('handles an entirely empty schedule', () => {
    let received: ScheduledGames | undefined;

    service.getScheduledGames().subscribe((r) => (received = r));
    httpMock.expectOne(gamesUrl).flush(emptySchedule);

    expect(received).toEqual(emptySchedule);
  });

  it('surfaces an upstream failure to the caller', () => {
    let status: number | undefined;

    service.getScheduledGames().subscribe({ error: (e) => (status = e.status) });
    httpMock.expectOne(gamesUrl).flush('upstream down', { status: 502, statusText: 'Bad Gateway' });

    expect(status).toBe(502);
  });
});

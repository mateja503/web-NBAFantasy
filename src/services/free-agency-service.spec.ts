import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FreeAgencyService } from './free-agency-service';
import { Player } from '../models/player';
import { TEST_API_BASE_URL, provideConfigStub } from '../testing/test-helpers';
import { makePlayer } from '../testing/fixtures';

describe('FreeAgencyService', () => {
  let service: FreeAgencyService;
  let httpMock: HttpTestingController;

  const freeAgentsUrl = `${TEST_API_BASE_URL}/v1/free-agency/all-players`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideConfigStub()],
    });
    service = TestBed.inject(FreeAgencyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('GETs the free-agent pool with the leagueId as a query param', () => {
    service.getFreeAgents(9).subscribe();

    const req = httpMock.expectOne((r) => r.url === freeAgentsUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('leagueId')).toBe('9');
    req.flush([]);
  });

  it('returns a flat array, with no pagination envelope to unwrap', () => {
    const agents = [makePlayer({ playerid: 1 }), makePlayer({ playerid: 2 })];
    let received: Player[] | undefined;

    service.getFreeAgents(9).subscribe((r) => (received = r));

    httpMock.expectOne((r) => r.url === freeAgentsUrl).flush(agents);

    expect(Array.isArray(received)).toBe(true);
    expect(received).toHaveLength(2);
  });

  it('returns an empty array when the pool is exhausted', () => {
    let received: Player[] | undefined;

    service.getFreeAgents(9).subscribe((r) => (received = r));
    httpMock.expectOne((r) => r.url === freeAgentsUrl).flush([]);

    expect(received).toEqual([]);
  });

  it('surfaces the server rejection for a non-positive leagueId', () => {
    // The endpoint rejects leagueId <= 0; the service does not pre-validate, so the
    // caller must see the error rather than an empty list.
    let status: number | undefined;

    service.getFreeAgents(0).subscribe({ error: (e) => (status = e.status) });

    httpMock
      .expectOne((r) => r.url === freeAgentsUrl)
      .flush('invalid leagueId', { status: 400, statusText: 'Bad Request' });

    expect(status).toBe(400);
  });

  it('surfaces a 401 when the request is unauthenticated', () => {
    let status: number | undefined;

    service.getFreeAgents(9).subscribe({ error: (e) => (status = e.status) });

    httpMock
      .expectOne((r) => r.url === freeAgentsUrl)
      .flush('unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
  });
});

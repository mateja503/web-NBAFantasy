import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TradeService } from './trade-service';
import { Trade } from '../models/trade';
import { TEST_API_BASE_URL, provideConfigStub } from '../testing/test-helpers';

describe('TradeService', () => {
  let service: TradeService;
  let httpMock: HttpTestingController;

  const tradesUrl = `${TEST_API_BASE_URL}/v1/trades`;

  const trade = (overrides: Partial<Trade> = {}): Trade => ({
    tradeid: '11111111-1111-1111-1111-111111111111',
    leagueid: 9,
    fromteamid: 3,
    toteamid: 4,
    playerids: [1000, 1001],
    status: 'pending',
    tscreated: '2026-09-01T10:00:00Z',
    tsexpires: '2026-09-02T10:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideConfigStub()],
    });
    service = TestBed.inject(TradeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('GETs the league trades with leagueId only when no status is given', () => {
    // Omitting status must return the whole history, so the param has to be absent
    // rather than sent as an empty string (which the API rejects as unknown).
    service.getLeagueTrades(9).subscribe();

    const req = httpMock.expectOne((r) => r.url === tradesUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('leagueId')).toBe('9');
    expect(req.request.params.has('status')).toBe(false);
    req.flush([]);
  });

  it('adds the status param when one is supplied', () => {
    service.getLeagueTrades(9, 'pending').subscribe();

    const req = httpMock.expectOne((r) => r.url === tradesUrl);
    expect(req.request.params.get('leagueId')).toBe('9');
    expect(req.request.params.get('status')).toBe('pending');
    req.flush([]);
  });

  it.each(['pending', 'superseded', 'accepted', 'rejected'] as const)(
    'passes the %s status through',
    (status) => {
      service.getLeagueTrades(9, status).subscribe();

      const req = httpMock.expectOne((r) => r.url === tradesUrl);
      expect(req.request.params.get('status')).toBe(status);
      req.flush([]);
    },
  );

  it('returns the trades it receives', () => {
    const trades = [trade(), trade({ tradeid: 'other', status: 'accepted' })];
    let received: Trade[] | undefined;

    service.getLeagueTrades(9).subscribe((r) => (received = r));
    httpMock.expectOne((r) => r.url === tradesUrl).flush(trades);

    expect(received).toHaveLength(2);
    expect(received?.[0]?.tradeid).toBe('11111111-1111-1111-1111-111111111111');
  });

  it('returns an empty list for a league with no trades', () => {
    let received: Trade[] | undefined;

    service.getLeagueTrades(9).subscribe((r) => (received = r));
    httpMock.expectOne((r) => r.url === tradesUrl).flush([]);

    expect(received).toEqual([]);
  });

  it('surfaces the rejection for an unknown status', () => {
    let status: number | undefined;

    service
      .getLeagueTrades(9, 'bogus' as never)
      .subscribe({ error: (e) => (status = e.status) });

    httpMock
      .expectOne((r) => r.url === tradesUrl)
      .flush('unknown status', { status: 400, statusText: 'Bad Request' });

    expect(status).toBe(400);
  });
});

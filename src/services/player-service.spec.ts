import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PlayerService } from './player-service';
import { PlayersFilter } from '../models/player';
import { TEST_API_BASE_URL, provideConfigStub } from '../testing/test-helpers';
import { makePlayer } from '../testing/fixtures';

describe('PlayerService', () => {
  let service: PlayerService;
  let httpMock: HttpTestingController;

  const playersUrl = `${TEST_API_BASE_URL}/v1/players`;

  /** Fires getPlayers and hands back the single matching request for param assertions. */
  function requestFor(filter?: PlayersFilter) {
    service.getPlayers(filter).subscribe();
    return httpMock.expectOne((r) => r.url === playersUrl);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideConfigStub()],
    });
    service = TestBed.inject(PlayerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('returns the whole pagination envelope, not just items', () => {
    // The Players page needs totalPages for its pager, so the envelope must not be unwrapped.
    const envelope = {
      items: [makePlayer()],
      page: 2,
      pageSize: 25,
      totalCount: 300,
      totalPages: 12,
    };
    let received: typeof envelope | undefined;

    service.getPlayers().subscribe((r) => (received = r));
    httpMock.expectOne(playersUrl).flush(envelope);

    expect(received?.totalPages).toBe(12);
    expect(received?.items).toHaveLength(1);
  });

  it('sends no params when called with no filter', () => {
    const req = requestFor();

    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ items: [], page: 1, pageSize: 25, totalCount: 0, totalPages: 0 });
  });

  it('serialises scalar filters', () => {
    const req = requestFor({ name: 'LeBron', minPoints: 20, allowdrop: true, page: 2 });

    expect(req.request.params.get('name')).toBe('LeBron');
    expect(req.request.params.get('minPoints')).toBe('20');
    expect(req.request.params.get('allowdrop')).toBe('true');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ items: [], page: 2, pageSize: 25, totalCount: 0, totalPages: 0 });
  });

  it('repeats array filters instead of comma-joining them', () => {
    // The API binds playerposition to a string[]; a comma-joined value would arrive
    // as the single position "G,F" and match nothing.
    const req = requestFor({ playerposition: ['G', 'F'] });

    expect(req.request.params.getAll('playerposition')).toEqual(['G', 'F']);
    req.flush({ items: [], page: 1, pageSize: 25, totalCount: 0, totalPages: 0 });
  });

  it('drops null, undefined and empty-string filters', () => {
    const req = requestFor({
      name: '',
      surname: undefined,
      irlteamname: null as unknown as string,
      minPoints: 10,
    });

    expect(req.request.params.has('name')).toBe(false);
    expect(req.request.params.has('surname')).toBe(false);
    expect(req.request.params.has('irlteamname')).toBe(false);
    expect(req.request.params.get('minPoints')).toBe('10');
    req.flush({ items: [], page: 1, pageSize: 25, totalCount: 0, totalPages: 0 });
  });

  it('keeps zero and false, which are meaningful filter values', () => {
    // A naive falsy check would drop both and silently widen the query.
    const req = requestFor({ minPoints: 0, allowdrop: false });

    expect(req.request.params.get('minPoints')).toBe('0');
    expect(req.request.params.get('allowdrop')).toBe('false');
    req.flush({ items: [], page: 1, pageSize: 25, totalCount: 0, totalPages: 0 });
  });

  it('sends an empty array filter as no param at all', () => {
    const req = requestFor({ playerposition: [] });

    expect(req.request.params.has('playerposition')).toBe(false);
    req.flush({ items: [], page: 1, pageSize: 25, totalCount: 0, totalPages: 0 });
  });

  it('surfaces a server error to the caller', () => {
    let status: number | undefined;

    service.getPlayers().subscribe({ error: (e) => (status = e.status) });
    httpMock.expectOne(playersUrl).flush('boom', { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });
});

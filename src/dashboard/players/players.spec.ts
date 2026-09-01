import { ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Players } from './players';
import { GlobalStore } from '../../store/globalStore';
import { TEST_API_BASE_URL, provideConfigStub } from '../../testing/test-helpers';
import { makePlayer, makeUserResponse } from '../../testing/fixtures';

const DEBOUNCE = 250;

describe('Players', () => {
  let fixture: ComponentFixture<Players>;
  let component: Players;
  let httpMock: HttpTestingController;
  let store: InstanceType<typeof GlobalStore>;

  const playersUrl = `${TEST_API_BASE_URL}/v1/players`;

  const envelope = (overrides: Record<string, unknown> = {}) => ({
    items: [makePlayer()],
    page: 1,
    pageSize: 20,
    totalCount: 100,
    totalPages: 5,
    ...overrides,
  });

  /** Advances past the debounce and returns the request that went out. */
  function flushRequest(payload: Record<string, unknown> = envelope()) {
    vi.advanceTimersByTime(DEBOUNCE);
    const req = httpMock.expectOne((r) => r.url === playersUrl);
    req.flush(payload);
    return req;
  }

  /**
   * Runs ngOnInit directly; it fires one initial load, which this consumes.
   *
   * Not driven through fixture.detectChanges(): players.html binds
   * `[ngModel]="searchQuery()"`, and NgModel's async write makes the checked render throw
   * NG0100 on the first pass. That is a real dev-mode warning in the app, not a spec
   * artefact — these specs cover the component's logic and leave the template out of it.
   */
  function init(payload: Record<string, unknown> = envelope()) {
    component.ngOnInit();
    return flushRequest(payload);
  }

  beforeEach(async () => {
    localStorage.clear();
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [Players],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        // Auto-detect would run ngOnInit for us and fire a second load on top of the one
        // each test drives, leaving two requests in flight for every assertion.
        { provide: ComponentFixtureAutoDetect, useValue: false },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Players);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(GlobalStore);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  describe('initial state', () => {
    it('starts loading on page 1 with no filters', () => {
      expect(component.loading()).toBe(true);
      expect(component.page()).toBe(1);
      expect(component.pageSize()).toBe(20);
      expect(component.players()).toEqual([]);
      expect(component.searchQuery()).toBe('');
      expect(component.selectedPositions()).toEqual([]);
      expect(component.filtersOpen()).toBe(false);
      expect(component.activeFilterCount()).toBe(0);
    });

    it('offers the position and page-size options', () => {
      expect(component.positions).toEqual(['G', 'F', 'C', 'GF', 'CF', 'FG']);
      expect(component.pageSizeOptions).toEqual([10, 20, 50]);
      expect(component.statFilters).toHaveLength(9);
    });

    it('hides the fantasy-team column for anonymous visitors', () => {
      expect(component.showTeamColumn()).toBe(false);

      store.loginSuccess(makeUserResponse());

      expect(component.showTeamColumn()).toBe(true);
    });
  });

  describe('loading', () => {
    it('loads the first page on init and keeps the envelope totals', () => {
      init(envelope({ items: [makePlayer(), makePlayer({ playerid: 2 })], totalCount: 42, totalPages: 3 }));

      expect(component.players()).toHaveLength(2);
      expect(component.totalCount()).toBe(42);
      expect(component.totalPages()).toBe(3);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('defaults missing envelope fields to empty rather than undefined', () => {
      init({ page: 1, pageSize: 20 });

      expect(component.players()).toEqual([]);
      expect(component.totalCount()).toBe(0);
      expect(component.totalPages()).toBe(0);
    });

    it('reports a failure without leaving the page spinning', () => {
      component.ngOnInit();
      vi.advanceTimersByTime(DEBOUNCE);
      httpMock
        .expectOne((r) => r.url === playersUrl)
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(component.error()).toContain('could not load the players');
      expect(component.loading()).toBe(false);
    });

    it('sends page and pageSize on every request', () => {
      const req = init();

      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('pageSize')).toBe('20');
    });

    it('scopes the fantasy-team names to the selected league when there is one', () => {
      store.loginSuccess(makeUserResponse());
      store.selectLeague(9, 'Main League');

      const req = init();

      expect(req.request.params.get('leagueId')).toBe('9');
    });

    it('omits leagueId for an anonymous visitor', () => {
      const req = init();

      expect(req.request.params.has('leagueId')).toBe(false);
    });
  });

  describe('firstRowNumber', () => {
    it('is 1 on the first page', () => {
      expect(component.firstRowNumber()).toBe(1);
    });

    it('continues the count across pages', () => {
      init(envelope({ totalPages: 5 }));

      component.goToPage(3);
      flushRequest();

      expect(component.firstRowNumber()).toBe(41);
    });

    it('follows the page size', () => {
      init(envelope({ totalPages: 5 }));

      component.changePageSize(50);
      flushRequest();
      component.goToPage(2);
      flushRequest();

      expect(component.firstRowNumber()).toBe(51);
    });
  });

  describe('onSearch', () => {
    it('sends the query and returns to page 1', () => {
      init(envelope({ totalPages: 5 }));
      component.goToPage(3);
      flushRequest();

      component.onSearch('LeBron');
      const req = flushRequest();

      expect(req.request.params.get('name')).toBe('LeBron');
      expect(component.page()).toBe(1);
    });

    it('omits a blank query rather than sending an empty name', () => {
      init();

      component.onSearch('   ');
      const req = flushRequest();

      expect(req.request.params.has('name')).toBe(false);
    });

    it('collapses rapid typing into one request', () => {
      init();

      component.onSearch('L');
      vi.advanceTimersByTime(100);
      component.onSearch('Le');
      vi.advanceTimersByTime(100);
      component.onSearch('LeB');

      const req = flushRequest();
      expect(req.request.params.get('name')).toBe('LeB');
      httpMock.verify();
    });
  });

  describe('togglePosition', () => {
    it('adds a position and resets to page 1', () => {
      init(envelope({ totalPages: 5 }));
      component.goToPage(2);
      flushRequest();

      component.togglePosition('G');
      const req = flushRequest();

      expect(req.request.params.getAll('playerposition')).toEqual(['G']);
      expect(component.page()).toBe(1);
    });

    it('sends repeated params for multiple positions', () => {
      init();
      component.togglePosition('G');
      flushRequest();

      component.togglePosition('F');
      const req = flushRequest();

      expect(req.request.params.getAll('playerposition')).toEqual(['G', 'F']);
    });

    it('drops the param entirely when the last position is removed', () => {
      init();
      component.togglePosition('G');
      flushRequest();

      component.togglePosition('G');
      const req = flushRequest();

      expect(req.request.params.has('playerposition')).toBe(false);
    });
  });

  describe('goToPage', () => {
    beforeEach(() => init(envelope({ totalPages: 5 })));

    it('moves to a valid page and refetches', () => {
      component.goToPage(3);
      const req = flushRequest();

      expect(component.page()).toBe(3);
      expect(req.request.params.get('page')).toBe('3');
    });

    it('clamps below 1', () => {
      component.goToPage(4);
      flushRequest();

      component.goToPage(-2);
      flushRequest();

      expect(component.page()).toBe(1);
    });

    it('clamps to the last page', () => {
      component.goToPage(99);
      flushRequest();

      expect(component.page()).toBe(5);
    });

    it('does nothing when already on the target page', () => {
      // No page change means no request — the guard is what stops a pager click storm.
      component.goToPage(1);

      vi.advanceTimersByTime(DEBOUNCE);
      httpMock.verify();
      expect(component.page()).toBe(1);
    });

    it('treats zero total pages as a single page', () => {
      component.totalPages.set(0);

      component.goToPage(5);

      expect(component.page()).toBe(1);
    });
  });

  describe('changePageSize', () => {
    it('applies the new size and resets to page 1', () => {
      init(envelope({ totalPages: 5 }));
      component.goToPage(3);
      flushRequest();

      component.changePageSize(50);
      const req = flushRequest();

      expect(component.pageSize()).toBe(50);
      expect(component.page()).toBe(1);
      expect(req.request.params.get('pageSize')).toBe('50');
    });

    it('coerces a string from the select element', () => {
      // The native <select> hands back a string; sending "50" as a number matters to the API.
      init();

      component.changePageSize('50' as unknown as number);
      const req = flushRequest();

      expect(component.pageSize()).toBe(50);
      expect(req.request.params.get('pageSize')).toBe('50');
    });
  });

  describe('advanced filters', () => {
    it('does not send draft edits until Apply', () => {
      init();
      component.draft.surname = 'James';

      component.onSearch('x');
      const req = flushRequest();

      expect(req.request.params.has('surname')).toBe(false);
      expect(component.activeFilterCount()).toBe(0);
    });

    it('sends the panel on Apply and counts the active filters', () => {
      init();
      component.draft.surname = 'James';
      component.draft.irlteamname = 'Lakers';
      component.draft.allowdrop = true;

      component.applyFilters();
      const req = flushRequest();

      expect(req.request.params.get('surname')).toBe('James');
      expect(req.request.params.get('irlteamname')).toBe('Lakers');
      expect(req.request.params.get('allowdrop')).toBe('true');
      expect(component.activeFilterCount()).toBe(3);
    });

    it('snapshots the draft, so later edits do not leak into the applied filter', () => {
      init();
      component.draft.surname = 'James';
      component.applyFilters();
      flushRequest();

      component.draft.surname = 'Curry';

      expect(component.activeFilterCount()).toBe(1);
      component.onSearch('x');
      const req = flushRequest();
      expect(req.request.params.get('surname')).toBe('James');
    });

    it('sends stat ranges as min/max pairs named for the API', () => {
      init();
      component.draft.statRanges['points'] = { min: 20, max: 40 };
      component.draft.statRanges['assists'] = { min: 5, max: null };

      component.applyFilters();
      const req = flushRequest();

      expect(req.request.params.get('minPoints')).toBe('20');
      expect(req.request.params.get('maxPoints')).toBe('40');
      expect(req.request.params.get('minAssists')).toBe('5');
      expect(req.request.params.has('maxAssists')).toBe(false);
      // Each bound counts separately on the badge.
      expect(component.activeFilterCount()).toBe(3);
    });

    it('keeps a zero bound, which is a real filter value', () => {
      init();
      component.draft.statRanges['turnovers'] = { min: null, max: 0 };

      component.applyFilters();
      const req = flushRequest();

      expect(req.request.params.get('maxTurnovers')).toBe('0');
      expect(component.activeFilterCount()).toBe(1);
    });

    it('keeps a false flag, which is not the same as unset', () => {
      init();
      component.draft.islock = false;

      component.applyFilters();
      const req = flushRequest();

      expect(req.request.params.get('islock')).toBe('false');
      expect(component.activeFilterCount()).toBe(1);
    });

    it('counts every date bound', () => {
      init();
      component.draft.tscreatedFrom = '2026-01-01';
      component.draft.tscreatedTo = '2026-06-01';
      component.draft.tsupdatedFrom = '2026-02-01';
      component.draft.tsupdatedTo = '2026-07-01';

      component.applyFilters();
      const req = flushRequest();

      expect(req.request.params.get('tscreatedFrom')).toBe('2026-01-01');
      expect(req.request.params.get('tsupdatedTo')).toBe('2026-07-01');
      expect(component.activeFilterCount()).toBe(4);
    });

    it('resets to page 1 when applied', () => {
      init(envelope({ totalPages: 5 }));
      component.goToPage(4);
      flushRequest();

      component.applyFilters();
      flushRequest();

      expect(component.page()).toBe(1);
    });
  });

  describe('resetFilters', () => {
    it('clears the panel, the search and the positions', () => {
      init();
      component.draft.surname = 'James';
      component.applyFilters();
      flushRequest();
      component.onSearch('LeBron');
      flushRequest();
      component.togglePosition('G');
      flushRequest();

      component.resetFilters();
      const req = flushRequest();

      expect(component.activeFilterCount()).toBe(0);
      expect(component.searchQuery()).toBe('');
      expect(component.selectedPositions()).toEqual([]);
      expect(req.request.params.has('surname')).toBe(false);
      expect(req.request.params.has('name')).toBe(false);
      expect(req.request.params.has('playerposition')).toBe(false);
      expect(component.page()).toBe(1);
    });

    it('gives the draft a fresh stat-range map', () => {
      init();
      component.draft.statRanges['points'] = { min: 20, max: 40 };

      component.resetFilters();
      flushRequest();

      expect(component.draft.statRanges['points']).toEqual({ min: null, max: null });
    });
  });

  describe('toggleFilters', () => {
    it('opens and closes the panel', () => {
      component.toggleFilters();
      expect(component.filtersOpen()).toBe(true);

      component.toggleFilters();
      expect(component.filtersOpen()).toBe(false);
    });

    it('does not trigger a request on its own', () => {
      init();

      component.toggleFilters();

      vi.advanceTimersByTime(DEBOUNCE);
      httpMock.verify();
    });
  });
});

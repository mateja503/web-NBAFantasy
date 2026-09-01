import { ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FreeAgency } from './free-agency';
import { GlobalStore } from '../../store/globalStore';
import { TEST_API_BASE_URL, provideConfigStub } from '../../testing/test-helpers';
import { makePlayer, makeUserResponse } from '../../testing/fixtures';

describe('FreeAgency', () => {
  let fixture: ComponentFixture<FreeAgency>;
  let component: FreeAgency;
  let httpMock: HttpTestingController;
  let store: InstanceType<typeof GlobalStore>;

  const agentsUrl = `${TEST_API_BASE_URL}/v1/free-agency/all-players`;

  const pool = [
    makePlayer({ playerid: 1, name: 'LeBron', surname: 'James', position: 'F' }),
    makePlayer({ playerid: 2, name: 'Stephen', surname: 'Curry', position: 'G' }),
    makePlayer({ playerid: 3, name: 'Nikola', surname: 'Jokic', position: 'C' }),
  ];

  const names = () => component.filteredPlayers().map((p) => p.name);

  /** Matches the single pending free-agents request, whatever its query string. */
  function expectAgentsRequest() {
    return httpMock.expectOne((r) => r.url === agentsUrl);
  }

  function selectLeague(leagueId: number) {
    store.loginSuccess(makeUserResponse());
    store.selectLeague(leagueId, 'Main League');
  }

  /**
   * Runs ngOnInit through the fixture and flushes the resulting request.
   * The league stream is a `toObservable` over a store signal, so it only emits on a
   * change-detection pass — a bare ngOnInit() call would never fire a request.
   */
  function initWith(players = pool) {
    fixture.detectChanges();
    expectAgentsRequest().flush(players);
  }

  /** Flushes the effect behind `toObservable` after the selected league changes. */
  function settleLeagueChange() {
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [FreeAgency],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        // Auto-detect would run ngOnInit before each test can seed the store.
        { provide: ComponentFixtureAutoDetect, useValue: false },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FreeAgency);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(GlobalStore);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('starts empty and not loading', () => {
    expect(component.players()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.searchText()).toBe('');
    expect(component.selectedPositions()).toEqual([]);
  });

  it('offers the position filters and skeleton placeholders', () => {
    expect(component.positions).toEqual(['G', 'F', 'C', 'GF', 'CF', 'FG']);
    expect(component.skeletons).toHaveLength(8);
    expect(component.skeletonStats).toEqual([0, 1, 2, 3, 4, 5]);
  });

  describe('hasLeague', () => {
    it('is false with no league selected', () => {
      expect(component.hasLeague()).toBe(false);
    });

    it('is true once a real league is selected', () => {
      selectLeague(9);

      expect(component.hasLeague()).toBe(true);
    });

    it('is false for league 0, which the server rejects', () => {
      store.loginSuccess(makeUserResponse());
      store.selectLeague(0, 'None');

      expect(component.hasLeague()).toBe(false);
    });
  });

  describe('loading the pool', () => {
    it('requests the free agents for the selected league', () => {
      selectLeague(9);

      fixture.detectChanges();

      const req = expectAgentsRequest();
      expect(req.request.params.get('leagueId')).toBe('9');
      req.flush(pool);

      expect(component.players()).toHaveLength(3);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('sends nothing when no league is selected', () => {
      fixture.detectChanges();

      httpMock.expectNone((r) => r.url === agentsUrl);
      expect(component.players()).toEqual([]);
      expect(component.loading()).toBe(false);
    });

    it('refetches and replaces the pool when the league changes', () => {
      selectLeague(9);
      initWith(pool);

      store.selectLeague(10, 'Other League');
      settleLeagueChange();

      const req = expectAgentsRequest();
      expect(req.request.params.get('leagueId')).toBe('10');
      req.flush([makePlayer({ playerid: 9, name: 'Luka' })]);

      expect(names()).toEqual(['Luka']);
    });

    it('clears the pool when the league is deselected', () => {
      selectLeague(9);
      initWith(pool);

      store.selectLeague(0, 'None');
      settleLeagueChange();

      httpMock.expectNone((r) => r.url === agentsUrl);
      expect(component.players()).toEqual([]);
    });

    it('shows an inline error and empties the pool when the request fails', () => {
      selectLeague(9);
      fixture.detectChanges();

      expectAgentsRequest().flush('boom', { status: 500, statusText: 'Server Error' });

      expect(component.error()).toContain('could not load the free agents');
      expect(component.players()).toEqual([]);
      expect(component.loading()).toBe(false);
    });

    it('treats a null body as an empty pool', () => {
      selectLeague(9);
      initWith(null as never);

      expect(component.players()).toEqual([]);
    });
  });

  describe('retry', () => {
    it('refetches the current league', () => {
      selectLeague(9);
      fixture.detectChanges();
      expectAgentsRequest().flush('boom', { status: 500, statusText: 'Server Error' });

      component.retry();

      const req = expectAgentsRequest();
      expect(req.request.params.get('leagueId')).toBe('9');
      req.flush(pool);

      // The stream must survive an error, or Retry would be dead after the first failure.
      expect(component.error()).toBeNull();
      expect(component.players()).toHaveLength(3);
    });

    it('sends nothing when there is no league to retry', () => {
      fixture.detectChanges();

      component.retry();

      httpMock.expectNone((r) => r.url === agentsUrl);
    });
  });

  describe('onSearch', () => {
    beforeEach(() => {
      selectLeague(9);
      initWith(pool);
    });

    it('updates the bound text immediately so typing is never swallowed', () => {
      component.onSearch('curr');

      expect(component.searchText()).toBe('curr');
      // The filter itself has not moved yet.
      expect(component.searchQuery()).toBe('');
    });

    it('applies the filter after the debounce', () => {
      component.onSearch('curr');

      vi.advanceTimersByTime(200);

      expect(component.searchQuery()).toBe('curr');
      expect(names()).toEqual(['Stephen']);
    });

    it('keeps only the last value typed within the debounce window', () => {
      component.onSearch('cu');
      vi.advanceTimersByTime(100);
      component.onSearch('joki');
      vi.advanceTimersByTime(200);

      expect(component.searchQuery()).toBe('joki');
      expect(names()).toEqual(['Nikola']);
    });

    it('treats null as an empty query', () => {
      expect(() => component.onSearch(null as never)).not.toThrow();
      expect(component.searchText()).toBe('');
    });

    it('matches on surname as well as name', () => {
      component.onSearch('james');
      vi.advanceTimersByTime(200);

      expect(names()).toEqual(['LeBron']);
    });

    it('is case-insensitive and ignores surrounding whitespace', () => {
      component.onSearch('  CURRY  ');
      vi.advanceTimersByTime(200);

      expect(names()).toEqual(['Stephen']);
    });
  });

  describe('togglePosition', () => {
    beforeEach(() => {
      selectLeague(9);
      initWith(pool);
    });

    it('filters to one position', () => {
      component.togglePosition('G');

      expect(names()).toEqual(['Stephen']);
    });

    it("ORs multiple positions", () => {
      component.togglePosition('G');
      component.togglePosition('C');

      expect(names()).toEqual(['Stephen', 'Nikola']);
    });

    it('removes a position on the second toggle', () => {
      component.togglePosition('G');
      component.togglePosition('G');

      expect(component.selectedPositions()).toEqual([]);
      expect(names()).toHaveLength(3);
    });

    it('matches positions case-insensitively and ignores padding', () => {
      component.players.set([makePlayer({ playerid: 5, name: 'Padded', position: ' g ' })]);

      component.togglePosition('G');

      expect(names()).toEqual(['Padded']);
    });

    it('excludes a player with no position when a position filter is on', () => {
      component.players.set([makePlayer({ playerid: 6, name: 'Unknown', position: null })]);

      component.togglePosition('G');

      expect(names()).toEqual([]);
    });
  });

  describe('counts', () => {
    beforeEach(() => {
      selectLeague(9);
      initWith(pool);
    });

    it('totalCount is the whole pool, filteredCount the visible slice', () => {
      component.togglePosition('G');

      expect(component.totalCount()).toBe(3);
      expect(component.filteredCount()).toBe(1);
    });

    it('isFiltered is false with no filters', () => {
      expect(component.isFiltered()).toBe(false);
    });

    it('isFiltered is true for a search', () => {
      component.onSearch('curry');
      vi.advanceTimersByTime(200);

      expect(component.isFiltered()).toBe(true);
    });

    it('isFiltered is true for a position filter', () => {
      component.togglePosition('G');

      expect(component.isFiltered()).toBe(true);
    });

    it('a whitespace-only search does not count as filtered', () => {
      component.onSearch('   ');
      vi.advanceTimersByTime(200);

      expect(component.isFiltered()).toBe(false);
      expect(component.filteredCount()).toBe(3);
    });
  });

  it('combines search and position as AND', () => {
    selectLeague(9);
    initWith(pool);

    component.togglePosition('G');
    component.onSearch('lebron');
    vi.advanceTimersByTime(200);

    expect(names()).toEqual([]);
  });
});

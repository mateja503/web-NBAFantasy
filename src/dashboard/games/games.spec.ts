import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Games } from './games';
import { Game, GameTeam, ScheduledGames } from '../../models/game';
import { TEST_API_BASE_URL, provideConfigStub } from '../../testing/test-helpers';

describe('Games', () => {
  let fixture: ComponentFixture<Games>;
  let component: Games;
  let httpMock: HttpTestingController;

  const gamesUrl = `${TEST_API_BASE_URL}/v1/games`;

  const team = (overrides: Partial<GameTeam> = {}): GameTeam => ({
    teamId: 1,
    fullName: 'Boston Celtics',
    abbreviation: 'BOS',
    city: 'Boston',
    score: 0,
    ...overrides,
  });

  const game = (overrides: Partial<Game> = {}): Game => ({
    gameId: 1,
    date: '2026-09-01',
    status: '7:30 PM ET',
    time: null,
    startTime: null,
    postseason: false,
    postponed: false,
    homeTeam: team(),
    visitorTeam: team({ teamId: 2, fullName: 'LA Lakers', abbreviation: 'LAL', city: 'Los Angeles' }),
    ...overrides,
  });

  const schedule = (overrides: Partial<ScheduledGames> = {}): ScheduledGames => ({
    today: [],
    tomorrow: [],
    restOfWeek: [],
    ...overrides,
  });

  /** Flushes the ngOnInit request with the given payload. */
  function load(payload: ScheduledGames | null = schedule()) {
    fixture.detectChanges();
    httpMock.expectOne(gamesUrl).flush(payload);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Games],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideConfigStub()],
    }).compileComponents();
    fixture = TestBed.createComponent(Games);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('starts in a loading state with no error', () => {
    expect(component.loading()).toBe(true);
    expect(component.error()).toBeNull();
    expect(component.schedule()).toBeNull();
  });

  describe('load', () => {
    it('fetches the schedule on init and clears loading', () => {
      load(schedule({ today: [game()] }));

      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
      expect(component.schedule()?.today).toHaveLength(1);
    });

    it('sets an error message and stops loading when the fetch fails', () => {
      fixture.detectChanges();

      httpMock.expectOne(gamesUrl).flush('down', { status: 502, statusText: 'Bad Gateway' });

      expect(component.loading()).toBe(false);
      expect(component.error()).toContain('could not load the schedule');
    });

    it('clears a previous error on a successful retry', () => {
      fixture.detectChanges();
      httpMock.expectOne(gamesUrl).flush('down', { status: 502, statusText: 'Bad Gateway' });
      expect(component.error()).not.toBeNull();

      component.load();
      httpMock.expectOne(gamesUrl).flush(schedule({ today: [game()] }));

      expect(component.error()).toBeNull();
      expect(component.totalGames()).toBe(1);
    });

    it('treats a null body as no schedule rather than crashing', () => {
      load(null);

      expect(component.schedule()).toBeNull();
      expect(component.totalGames()).toBe(0);
    });
  });

  describe('sections', () => {
    it('always renders all three buckets, even before data arrives', () => {
      expect(component.sections().map((s) => s.key)).toEqual(['today', 'tomorrow', 'restOfWeek']);
      expect(component.sections().every((s) => s.games.length === 0)).toBe(true);
    });

    it('places each game in its own bucket', () => {
      load(
        schedule({
          today: [game({ gameId: 1 })],
          tomorrow: [game({ gameId: 2 }), game({ gameId: 3 })],
          restOfWeek: [game({ gameId: 4 })],
        }),
      );

      const sections = component.sections();
      expect(sections[0]?.games).toHaveLength(1);
      expect(sections[1]?.games).toHaveLength(2);
      expect(sections[2]?.games).toHaveLength(1);
    });

    it('defaults a missing bucket to an empty list', () => {
      // A missing array from the API must render as "no games", not crash the page.
      load({ today: [game()] } as ScheduledGames);

      expect(component.sections()[1]?.games).toEqual([]);
      expect(component.sections()[2]?.games).toEqual([]);
    });

    it('gives every section a title and subtitle', () => {
      for (const section of component.sections()) {
        expect(section.title.length).toBeGreaterThan(0);
        expect(section.subtitle.length).toBeGreaterThan(0);
      }
    });
  });

  describe('totalGames', () => {
    it('is zero with no schedule', () => {
      expect(component.totalGames()).toBe(0);
    });

    it('sums across every bucket', () => {
      load(
        schedule({
          today: [game({ gameId: 1 })],
          tomorrow: [game({ gameId: 2 }), game({ gameId: 3 })],
          restOfWeek: [game({ gameId: 4 })],
        }),
      );

      expect(component.totalGames()).toBe(4);
    });
  });

  describe('teamShortName', () => {
    it('prefers the abbreviation', () => {
      expect(component.teamShortName(team({ abbreviation: 'BOS' }))).toBe('BOS');
    });

    it('falls back to the full name when the abbreviation is missing or blank', () => {
      expect(component.teamShortName(team({ abbreviation: null }))).toBe('Boston Celtics');
      expect(component.teamShortName(team({ abbreviation: '' }))).toBe('Boston Celtics');
    });

    it('falls back to TBD when there is no team at all', () => {
      expect(component.teamShortName(null)).toBe('TBD');
      expect(component.teamShortName(team({ abbreviation: null, fullName: null }))).toBe('TBD');
    });
  });

  describe('teamFullName', () => {
    it('returns the full name', () => {
      expect(component.teamFullName(team())).toBe('Boston Celtics');
    });

    it('falls back for a missing team or name', () => {
      expect(component.teamFullName(null)).toBe('To be decided');
      expect(component.teamFullName(team({ fullName: null }))).toBe('To be decided');
    });
  });

  describe('gameStatus', () => {
    it("uses the API's own status label", () => {
      expect(component.gameStatus(game({ status: 'Final' }))).toBe('Final');
    });

    it('falls back to time when status is blank', () => {
      expect(component.gameStatus(game({ status: '   ', time: '7:30 PM' }))).toBe('7:30 PM');
      expect(component.gameStatus(game({ status: null, time: '7:30 PM' }))).toBe('7:30 PM');
    });

    it('falls back to Scheduled when both are missing', () => {
      expect(component.gameStatus(game({ status: null, time: null }))).toBe('Scheduled');
    });

    it('trims surrounding whitespace', () => {
      expect(component.gameStatus(game({ status: '  Final  ' }))).toBe('Final');
    });
  });

  describe('hasScore', () => {
    it('is false for a scheduled 0-0 matchup', () => {
      expect(component.hasScore(game())).toBe(false);
    });

    it('is true once either side has scored', () => {
      expect(component.hasScore(game({ homeTeam: team({ score: 10 }) }))).toBe(true);
      expect(component.hasScore(game({ visitorTeam: team({ score: 4 }) }))).toBe(true);
    });

    it('treats a missing team as no score', () => {
      expect(component.hasScore(game({ homeTeam: null, visitorTeam: null }))).toBe(false);
    });
  });

  describe('rendering', () => {
    it('shows the section titles', () => {
      load();

      fixture.detectChanges();
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Today');
      expect(text).toContain('Tomorrow');
    });

    it('shows the error message when loading fails', () => {
      fixture.detectChanges();
      httpMock.expectOne(gamesUrl).flush('down', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain(
        'could not load the schedule',
      );
    });
  });
});

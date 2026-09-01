import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DraftListPlayers } from './draft-list-players';
import { DraftPlayer, TeamDraftBoard } from '../../../services/Hub/draftHub';
import { provideConfigStub } from '../../../testing/test-helpers';

describe('DraftListPlayers', () => {
  let fixture: ComponentFixture<DraftListPlayers>;
  let component: DraftListPlayers;
  let consoleLog: ReturnType<typeof vi.spyOn>;

  const player = (overrides: Partial<DraftPlayer> = {}): DraftPlayer => ({
    playerId: 1000,
    fullName: 'Test Player',
    position: 'G',
    ...overrides,
  });

  const roster = [
    player({ playerId: 1, fullName: 'LeBron James', position: 'F' }),
    player({ playerId: 2, fullName: 'Stephen Curry', position: 'G' }),
    player({ playerId: 3, fullName: 'Nikola Jokic', position: 'C' }),
  ];

  const names = () => component.filteredPlayers().map((p) => p.fullName);

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DraftListPlayers],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        provideNoopAnimations(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DraftListPlayers);
    component = fixture.componentInstance;
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLog.mockRestore();
    localStorage.clear();
  });

  it('creates with an empty, unfiltered list', () => {
    expect(component).toBeTruthy();
    expect(component.filteredPlayers()).toEqual([]);
    expect(component.selectedPositions()).toEqual([]);
    expect(component.searchQuery()).toBe('');
  });

  it('offers the full set of positions as filters', () => {
    expect(component.positions).toEqual(['G', 'F', 'C', 'GF', 'CF', 'FG']);
  });

  describe('filteredPlayers', () => {
    beforeEach(() => {
      component.draftPlayers = roster;
    });

    it('returns everyone when nothing is filtered', () => {
      expect(names()).toEqual(['LeBron James', 'Stephen Curry', 'Nikola Jokic']);
    });

    it('filters by name, case-insensitively', () => {
      component.searchQuery.set('curry');

      expect(names()).toEqual(['Stephen Curry']);
    });

    it('matches on a substring anywhere in the name', () => {
      component.searchQuery.set('jam');

      expect(names()).toEqual(['LeBron James']);
    });

    it('returns nothing when the search matches no one', () => {
      component.searchQuery.set('zzz');

      expect(names()).toEqual([]);
    });

    it('filters by a single position', () => {
      component.selectedPositions.set(['G']);

      expect(names()).toEqual(['Stephen Curry']);
    });

    it('treats multiple positions as OR', () => {
      component.selectedPositions.set(['G', 'C']);

      expect(names()).toEqual(['Stephen Curry', 'Nikola Jokic']);
    });

    it('applies name and position together as AND', () => {
      component.selectedPositions.set(['F', 'G']);
      component.searchQuery.set('lebron');

      expect(names()).toEqual(['LeBron James']);
    });

    it('returns nothing when the two filters cannot both be satisfied', () => {
      component.selectedPositions.set(['C']);
      component.searchQuery.set('curry');

      expect(names()).toEqual([]);
    });

    it('reflects a new player list', () => {
      component.draftPlayers = [player({ playerId: 9, fullName: 'Luka Doncic' })];

      expect(names()).toEqual(['Luka Doncic']);
    });
  });

  describe('togglePosition', () => {
    it('adds a position that is not selected', () => {
      component.togglePosition('G');

      expect(component.selectedPositions()).toEqual(['G']);
    });

    it('removes a position that is already selected', () => {
      component.togglePosition('G');
      component.togglePosition('G');

      expect(component.selectedPositions()).toEqual([]);
    });

    it('keeps the other selections when removing one', () => {
      component.togglePosition('G');
      component.togglePosition('F');
      component.togglePosition('G');

      expect(component.selectedPositions()).toEqual(['F']);
    });
  });

  describe('draftPlayer', () => {
    it('emits the pick from the team on the clock', () => {
      const emitted = vi.fn();
      component.onPlayerDrafted.subscribe(emitted);
      component.draftStarted = true;
      component.onTheClock = { teamId: 3, teamName: 'Ballers', pick: 7 } as TeamDraftBoard;

      component.draftPlayer(1000);

      expect(emitted).toHaveBeenCalledWith({ playerId: 1000, pick: 7 });
    });

    it('emits pick 0 when nobody is on the clock', () => {
      const emitted = vi.fn();
      component.onPlayerDrafted.subscribe(emitted);
      component.draftStarted = true;

      component.draftPlayer(1000);

      expect(emitted).toHaveBeenCalledWith({ playerId: 1000, pick: 0 });
    });

    it('emits nothing before the draft starts', () => {
      // The server would reject the pick anyway; refusing here keeps the room quiet.
      const emitted = vi.fn();
      component.onPlayerDrafted.subscribe(emitted);
      component.draftStarted = false;
      component.onTheClock = { teamId: 3, teamName: 'Ballers', pick: 7 } as TeamDraftBoard;

      component.draftPlayer(1000);

      expect(emitted).not.toHaveBeenCalled();
    });
  });

  it('renders the filtered players', () => {
    component.draftPlayers = roster;
    component.searchQuery.set('curry');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Stephen Curry');
    expect(text).not.toContain('LeBron James');
  });
});

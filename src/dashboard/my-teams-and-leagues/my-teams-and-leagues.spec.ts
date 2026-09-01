import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MyTeamsAndLeagues } from './my-teams-and-leagues';
import { GlobalStore } from '../../store/globalStore';
import { provideConfigStub } from '../../testing/test-helpers';
import { makeLeague, makeTeam, makeUserResponse } from '../../testing/fixtures';

describe('MyTeamsAndLeagues', () => {
  let fixture: ComponentFixture<MyTeamsAndLeagues>;
  let component: MyTeamsAndLeagues;
  let store: InstanceType<typeof GlobalStore>;
  let alert: ReturnType<typeof vi.fn>;
  let consoleLog: ReturnType<typeof vi.spyOn>;

  /** A user managing one team (id 3, in league 9) and commissioning one league (id 9). */
  function signInWithOneOfEach() {
    store.loginSuccess(
      makeUserResponse({
        teams: [
          makeTeam({
            teamid: 3,
            name: 'Ballers',
            competesinleague: makeLeague({ leagueid: 9, name: 'Main League' }),
          }),
        ],
        leagues: [
          makeLeague({
            leagueid: 9,
            name: 'Main League',
            commissionersTeam: makeTeam({ teamid: 3, name: 'Ballers' }),
          }),
        ],
      }),
    );
  }

  beforeEach(async () => {
    localStorage.clear();
    alert = vi.fn();
    // jsdom does not implement window.alert; confirmAndSaveToLocalStorage calls it.
    vi.stubGlobal('alert', alert);
    await TestBed.configureTestingModule({
      imports: [MyTeamsAndLeagues],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        provideNoopAnimations(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MyTeamsAndLeagues);
    component = fixture.componentInstance;
    store = TestBed.inject(GlobalStore);
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    consoleLog.mockRestore();
    localStorage.clear();
  });

  it('starts on the "all" filter with nothing selected', () => {
    expect(component.currentFilter()).toBe('all');
    expect(component.selectedItem()).toBeNull();
  });

  describe('items', () => {
    it('is empty when signed out', () => {
      expect(component.items()).toEqual([]);
    });

    it('lists leagues before teams', () => {
      // The command centre leads with leagues, so ordering is part of the contract.
      signInWithOneOfEach();

      expect(component.items().map((i) => i.type)).toEqual(['league', 'team']);
    });

    it('maps a team with its league details', () => {
      signInWithOneOfEach();

      const team = component.items().find((i) => i.type === 'team');
      expect(team).toMatchObject({
        id: 3,
        name: 'Ballers',
        competesInLeagueId: 9,
        competesInLeagueName: 'Main League',
        avatar: '🦁',
      });
    });

    it("maps a league with its commissioner's team", () => {
      signInWithOneOfEach();

      const league = component.items().find((i) => i.type === 'league');
      expect(league).toMatchObject({
        id: 9,
        name: 'Main League',
        commissionersTeamId: 3,
        commissionersTeamName: 'Ballers',
        avatar: '🏆',
      });
    });

    it('tracks the store, so a later login populates the list', () => {
      expect(component.items()).toEqual([]);

      signInWithOneOfEach();

      expect(component.items()).toHaveLength(2);
    });
  });

  describe('ngOnInit preselection', () => {
    it('preselects the stored team', () => {
      signInWithOneOfEach();
      store.selectTeam(3, 'Ballers');

      component.ngOnInit();

      expect(component.selectedItem()?.type).toBe('team');
      expect(component.selectedItem()?.id).toBe(3);
    });

    it('preselects the stored league', () => {
      signInWithOneOfEach();
      store.selectLeague(9, 'Main League');

      component.ngOnInit();

      expect(component.selectedItem()?.type).toBe('league');
      expect(component.selectedItem()?.id).toBe(9);
    });

    it('selects nothing when the stored ids match no item', () => {
      signInWithOneOfEach();
      store.selectTeam(999, 'Gone');

      component.ngOnInit();

      expect(component.selectedItem()).toBeNull();
    });

    it('selects nothing when signed out', () => {
      component.ngOnInit();

      expect(component.selectedItem()).toBeNull();
    });
  });

  describe('filteredItems', () => {
    beforeEach(() => signInWithOneOfEach());

    it('shows everything on "all"', () => {
      expect(component.filteredItems()).toHaveLength(2);
    });

    it('narrows to teams', () => {
      component.setFilter('team');

      expect(component.filteredItems().map((i) => i.type)).toEqual(['team']);
    });

    it('narrows to leagues', () => {
      component.setFilter('league');

      expect(component.filteredItems().map((i) => i.type)).toEqual(['league']);
    });

    it('goes back to everything', () => {
      component.setFilter('team');
      component.setFilter('all');

      expect(component.filteredItems()).toHaveLength(2);
    });
  });

  describe('selectItem', () => {
    it('highlights the clicked item without writing to the store', () => {
      signInWithOneOfEach();
      const team = component.items().find((i) => i.type === 'team')!;

      component.selectItem(team);

      expect(component.selectedItem()).toBe(team);
      // Highlighting is not confirming — the store only changes on confirm.
      expect(store.selectedTeamId()).toBeUndefined();
    });
  });

  describe('confirmAndSaveToLocalStorage', () => {
    beforeEach(() => signInWithOneOfEach());

    it('saves a team along with the league it competes in', () => {
      component.selectItem(component.items().find((i) => i.type === 'team')!);

      component.confirmAndSaveToLocalStorage();

      expect(store.selectedTeamId()).toBe(3);
      expect(store.selectedTeamName()).toBe('Ballers');
      expect(store.selectedLeagueId()).toBe(9);
      expect(store.selectedLeagueName()).toBe('Main League');
      expect(alert).toHaveBeenCalled();
    });

    it("saves a league along with the commissioner's team", () => {
      component.selectItem(component.items().find((i) => i.type === 'league')!);

      component.confirmAndSaveToLocalStorage();

      expect(store.selectedLeagueId()).toBe(9);
      expect(store.selectedLeagueName()).toBe('Main League');
      expect(store.selectedTeamId()).toBe(3);
      expect(store.selectedTeamName()).toBe('Ballers');
    });

    it('persists the selection so it survives a reload', () => {
      component.selectItem(component.items().find((i) => i.type === 'team')!);

      component.confirmAndSaveToLocalStorage();

      const persisted = JSON.parse(localStorage.getItem('use_store_state') ?? '{}');
      expect(persisted.selectedTeamId).toBe(3);
    });

    it('writes nothing to the store when no item is selected', () => {
      component.confirmAndSaveToLocalStorage();

      expect(store.selectedTeamId()).toBeUndefined();
      expect(store.selectedLeagueId()).toBeUndefined();
      // The alert still fires — pinned so the empty-confirm path stays visible.
      expect(alert).toHaveBeenCalled();
    });
  });
});

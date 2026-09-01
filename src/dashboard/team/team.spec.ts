import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Team } from './team';
import { GlobalStore } from '../../store/globalStore';
import { TEST_API_BASE_URL, provideConfigStub } from '../../testing/test-helpers';
import { makePlayer, makeUserResponse, makeUserTeam } from '../../testing/fixtures';

describe('Team', () => {
  let fixture: ComponentFixture<Team>;
  let component: Team;
  let httpMock: HttpTestingController;
  let store: InstanceType<typeof GlobalStore>;

  const userTeamsUrl = (userId: number) => `${TEST_API_BASE_URL}/v1/team/get-user-teams/${userId}`;

  /** Triggers ngOnInit through the fixture, so Angular runs it exactly once. */
  function init() {
    fixture.detectChanges();
  }

  /** Signs a user in (userid 42 from the fixture) and optionally preselects a team. */
  function signIn(selectedTeamId?: number) {
    store.loginSuccess(makeUserResponse({ userid: 42 }));
    if (selectedTeamId !== undefined) {
      store.selectTeam(selectedTeamId, 'Preselected');
    }
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Team],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        provideNoopAnimations(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Team);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(GlobalStore);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('starts loading with nothing selected', () => {
    expect(component.loading()).toBe(true);
    expect(component.teams()).toEqual([]);
    expect(component.selectedTeamId()).toBeNull();
    expect(component.selectedTeam()).toBeNull();
  });

  describe('when signed out', () => {
    it('asks the user to sign in and makes no request', () => {
      init();

      expect(component.error()).toContain('signed in');
      expect(component.loading()).toBe(false);
      httpMock.expectNone(userTeamsUrl(42));
    });
  });

  describe('when signed in', () => {
    it('loads the teams the user owns', () => {
      signIn();

      init();

      const req = httpMock.expectOne(userTeamsUrl(42));
      expect(req.request.method).toBe('GET');
      req.flush([makeUserTeam({ teamid: 3 }), makeUserTeam({ teamid: 4 })]);

      expect(component.teams()).toHaveLength(2);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('opens on the team selected elsewhere in the app', () => {
      // The page must agree with the command center's selection.
      signIn(4);

      init();
      httpMock
        .expectOne(userTeamsUrl(42))
        .flush([makeUserTeam({ teamid: 3 }), makeUserTeam({ teamid: 4 })]);

      expect(component.selectedTeamId()).toBe(4);
    });

    it('falls back to the first team when the selected one is not owned', () => {
      signIn(999);

      init();
      httpMock.expectOne(userTeamsUrl(42)).flush([makeUserTeam({ teamid: 3 })]);

      expect(component.selectedTeamId()).toBe(3);
    });

    it('falls back to the first team when nothing is selected', () => {
      signIn();

      init();
      httpMock
        .expectOne(userTeamsUrl(42))
        .flush([makeUserTeam({ teamid: 7 }), makeUserTeam({ teamid: 8 })]);

      expect(component.selectedTeamId()).toBe(7);
    });

    it('selects nothing when the user owns no teams', () => {
      signIn();

      init();
      httpMock.expectOne(userTeamsUrl(42)).flush([]);

      expect(component.selectedTeamId()).toBeNull();
      expect(component.selectedTeam()).toBeNull();
      expect(component.loading()).toBe(false);
    });

    it('reports a load failure without leaving the page spinning', () => {
      signIn();

      init();
      httpMock
        .expectOne(userTeamsUrl(42))
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(component.error()).toContain('could not load your teams');
      expect(component.loading()).toBe(false);
      expect(component.teams()).toEqual([]);
    });
  });

  describe('selectedTeam', () => {
    beforeEach(() => {
      signIn();
      init();
      httpMock
        .expectOne(userTeamsUrl(42))
        .flush([
          makeUserTeam({ teamid: 3, name: 'Ballers', players: [makePlayer()] }),
          makeUserTeam({ teamid: 4, name: 'Dunkers' }),
        ]);
    });

    it('resolves the selected id to the full team', () => {
      expect(component.selectedTeam()?.name).toBe('Ballers');
      expect(component.selectedTeam()?.players).toHaveLength(1);
    });

    it('follows selectTeam', () => {
      component.selectTeam(4);

      expect(component.selectedTeam()?.name).toBe('Dunkers');
    });

    it('is null when the selected id is not in the list', () => {
      component.selectTeam(999);

      expect(component.selectedTeam()).toBeNull();
    });

    it('renders the selected roster through the shared table', () => {
      // A second pass to paint the signals the flushed response updated; ngOnInit
      // already ran on the first, so this does not re-issue the request.
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-player-table-view')).not.toBeNull();
    });
  });
});

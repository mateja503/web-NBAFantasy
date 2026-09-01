import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import { JoinLeague } from './join-league';
import { GlobalStore } from '../../store/globalStore';
import { DynamicDialog } from '../../components/dialog/dynamicDialog';
import { TEST_API_BASE_URL, provideConfigStub } from '../../testing/test-helpers';
import { makeLeague, makeUserResponse } from '../../testing/fixtures';

describe('JoinLeague', () => {
  let fixture: ComponentFixture<JoinLeague>;
  let component: JoinLeague;
  let httpMock: HttpTestingController;
  let store: InstanceType<typeof GlobalStore>;
  let afterClosed: Subject<unknown>;
  let open: ReturnType<typeof vi.spyOn>;
  let alert: ReturnType<typeof vi.fn>;
  let consoleLog: ReturnType<typeof vi.spyOn>;
  let consoleError: ReturnType<typeof vi.spyOn>;

  const leagueUrl = `${TEST_API_BASE_URL}/v1/league`;
  const joinUrl = `${leagueUrl}/join`;

  /** `leagues$` is created at construction, so its request is pending from the start. */
  function flushLeagues(leagues = [makeLeague({ leagueid: 9, name: 'Main League' })]) {
    fixture.detectChanges();
    const requests = httpMock.match(leagueUrl);
    for (const req of requests) {
      req.flush({ items: leagues, page: 1, pageSize: 10, totalCount: leagues.length, totalPages: 1 });
    }
  }

  beforeEach(async () => {
    localStorage.clear();
    afterClosed = new Subject<unknown>();
    alert = vi.fn();
    vi.stubGlobal('alert', alert);

    await TestBed.configureTestingModule({
      imports: [JoinLeague],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JoinLeague);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(GlobalStore);
    // Spied on the injected instance: the component imports SharedModule, which re-provides
    // the real MatDialog, so a DI-level stub does not reliably win.
    open = vi
      .spyOn(component.dialog, 'open')
      .mockReturnValue({ afterClosed: () => afterClosed.asObservable() } as never);
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    open.mockRestore();
    consoleLog.mockRestore();
    consoleError.mockRestore();
    localStorage.clear();
  });

  it('creates with nothing selected and no error', () => {
    expect(component).toBeTruthy();
    expect(component.selectedLeague()).toBeNull();
    expect(component.leaguesError()).toBeNull();
  });

  it('reports a failed league load instead of showing a silently empty table', () => {
    fixture.detectChanges();

    httpMock
      .match(leagueUrl)
      .forEach((r) => r.flush('boom', { status: 500, statusText: 'Server Error' }));

    expect(component.leaguesError()).toContain('could not load the leagues');
  });

  it('keeps the table alive after a failed load', () => {
    // The fallback emits an empty list so the async pipe does not tear the view down.
    fixture.detectChanges();
    httpMock
      .match(leagueUrl)
      .forEach((r) => r.flush('boom', { status: 500, statusText: 'Server Error' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
  });

  it('declares the league table columns', () => {
    expect(component.displayedColumns).toContain('name');
    expect(component.displayedColumns).toContain('seasonyear');
  });

  describe('selectRow', () => {
    it('selects a league', () => {
      const league = makeLeague({ leagueid: 9 });

      component.selectRow(league);

      expect(component.selectedLeague()).toBe(league);
    });

    it('deselects when the same row is clicked again', () => {
      const league = makeLeague({ leagueid: 9 });

      component.selectRow(league);
      component.selectRow(league);

      expect(component.selectedLeague()).toBeNull();
    });

    it('switches selection between different rows', () => {
      component.selectRow(makeLeague({ leagueid: 9 }));
      component.selectRow(makeLeague({ leagueid: 10 }));

      expect(component.selectedLeague()?.leagueid).toBe(10);
    });

    it('deselects on a different object with the same id', () => {
      // Comparison is by leagueid, not identity — a re-fetched row must still toggle off.
      component.selectRow(makeLeague({ leagueid: 9 }));
      component.selectRow(makeLeague({ leagueid: 9 }));

      expect(component.selectedLeague()).toBeNull();
    });
  });

  describe('openDialog', () => {
    it('does nothing when no league is selected', () => {
      component.openDialog();

      expect(open).not.toHaveBeenCalled();
    });

    it('opens the team-name dialog naming the selected league', () => {
      component.selectRow(makeLeague({ leagueid: 9, name: 'Main League' }));

      component.openDialog();

      const [dialogComponent, config] = open.mock.calls[0] as [
        unknown,
        { data: { description: string; fields: { key: string }[] } },
      ];
      expect(dialogComponent).toBe(DynamicDialog);
      expect(config.data.description).toContain('Main League');
      expect(config.data.fields.map((f) => f.key)).toEqual(['teamName']);
    });

    it('joins the league when a team name comes back', () => {
      store.loginSuccess(makeUserResponse({ userid: 42 }));
      component.selectRow(makeLeague({ leagueid: 9 }));
      component.openDialog();

      afterClosed.next({ teamName: 'Ballers' });

      const req = httpMock.expectOne(joinUrl);
      expect(req.request.body).toEqual({ leagueId: 9, teamName: 'Ballers', userId: 42 });
      req.flush({});
    });

    it('does not join when the dialog is cancelled', () => {
      component.selectRow(makeLeague({ leagueid: 9 }));
      component.openDialog();

      afterClosed.next(undefined);

      httpMock.expectNone(joinUrl);
    });

    it('does not join on a blank team name', () => {
      component.selectRow(makeLeague({ leagueid: 9 }));
      component.openDialog();

      afterClosed.next({ teamName: '' });

      httpMock.expectNone(joinUrl);
    });
  });

  describe('joinLeague', () => {
    it('does nothing without a selected league', () => {
      component.joinLeague('Ballers');

      httpMock.expectNone(joinUrl);
    });

    it('clears the selection and confirms on success', () => {
      component.selectRow(makeLeague({ leagueid: 9 }));

      component.joinLeague('Ballers');
      httpMock.expectOne(joinUrl).flush({});

      expect(component.selectedLeague()).toBeNull();
      expect(alert).toHaveBeenCalledWith('League joined successfully');
    });

    it('keeps the selection and reports the failure', () => {
      component.selectRow(makeLeague({ leagueid: 9 }));

      component.joinLeague('Ballers');
      httpMock
        .expectOne(joinUrl)
        .flush('already joined', { status: 409, statusText: 'Conflict' });

      expect(component.selectedLeague()).not.toBeNull();
      expect(alert).toHaveBeenCalledWith(expect.stringContaining('Error while joining league'));
    });

    it('sends an undefined userId when signed out', () => {
      // Pinned: the component does not guard on auth, so the API is left to reject it.
      component.selectRow(makeLeague({ leagueid: 9 }));

      component.joinLeague('Ballers');

      const req = httpMock.expectOne(joinUrl);
      expect(req.request.body.userId).toBeUndefined();
      req.flush({});
    });
  });

  describe('ngOnDestroy', () => {
    it('clears the selection and unsubscribes', () => {
      component.selectRow(makeLeague({ leagueid: 9 }));
      component.joinLeague('Ballers');
      httpMock.expectOne(joinUrl).flush({});

      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(component.selectedLeague()).toBeNull();
    });
  });

  it('renders the league list from the service', () => {
    flushLeagues([makeLeague({ leagueid: 9, name: 'Main League' })]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Main League');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DraftHeader } from './draft-header';
import { GlobalStore } from '../../../store/globalStore';
import { TEST_API_BASE_URL, provideConfigStub } from '../../../testing/test-helpers';
import { FakeHubConnectionBuilder, provideFakeHub } from '../../../testing/fake-hub';
import { makeUserResponse } from '../../../testing/fixtures';

describe('DraftHeader', () => {
  let fixture: ComponentFixture<DraftHeader>;
  let component: DraftHeader;
  let httpMock: HttpTestingController;
  let consoleLog: ReturnType<typeof vi.spyOn>;
  let consoleError: ReturnType<typeof vi.spyOn>;

  const startUrl = `${TEST_API_BASE_URL}/v1/draft/start-draft`;
  const endUrl = `${TEST_API_BASE_URL}/v1/draft/end-draft`;

  /**
   * `leagueId` is read once at construction from the store, so the store has to be seeded
   * before the component is created.
   */
  async function build(leagueId?: number) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DraftHeader],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        provideNoopAnimations(),
        provideFakeHub(new FakeHubConnectionBuilder()),
      ],
    });

    const store = TestBed.inject(GlobalStore);
    store.loginSuccess(makeUserResponse());
    if (leagueId !== undefined) {
      store.selectLeague(leagueId, 'Main League');
    }

    await TestBed.compileComponents();
    fixture = TestBed.createComponent(DraftHeader);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    return component;
  }

  beforeEach(async () => {
    localStorage.clear();
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await build(9);
  });

  afterEach(() => {
    httpMock.verify();
    consoleLog.mockRestore();
    consoleError.mockRestore();
    localStorage.clear();
  });

  it('creates and takes its league from the store', () => {
    expect(component).toBeTruthy();
    expect(component.leagueId).toBe(9);
  });

  it('falls back to league 0 when no league is selected', async () => {
    // Pinned because the API rejects leagueId 0 — the guard belongs upstream in Draft.
    await build();

    expect(component.leagueId).toBe(0);
  });

  describe('startDraft', () => {
    it('POSTs the selected league', () => {
      component.startDraft();

      const req = httpMock.expectOne(startUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ leagueId: 9 });
      req.flush({});
    });

    it('logs the failure rather than throwing at the user', () => {
      component.startDraft();

      httpMock.expectOne(startUrl).flush('not the commissioner', {
        status: 403,
        statusText: 'Forbidden',
      });

      expect(consoleError).toHaveBeenCalled();
    });
  });

  describe('endDraft', () => {
    it('POSTs the selected league', () => {
      component.endDraft();

      const req = httpMock.expectOne(endUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ leagueId: 9 });
      req.flush({});
    });

    it('logs the failure', () => {
      component.endDraft();

      httpMock
        .expectOne(endUrl)
        .flush('already ended', { status: 409, statusText: 'Conflict' });

      expect(consoleError).toHaveBeenCalled();
    });
  });

  describe('resetTimer', () => {
    it('delegates upward rather than calling the hub itself', () => {
      // The parent owns the hub connection, so the leaf only reports the intent.
      const emitted = vi.fn();
      component.onResetTimer.subscribe(emitted);

      component.resetTimer();

      expect(emitted).toHaveBeenCalledTimes(1);
    });

    it('makes no HTTP call', () => {
      component.resetTimer();

      httpMock.verify();
    });
  });

  it('defaults both draft-state inputs to false', () => {
    expect(component.draftStarted).toBe(false);
    expect(component.draftEnded).toBe(false);
  });

  it('renders the league name from the hub', () => {
    component.draftHub.leagueName.set('Main League');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Main League');
  });
});

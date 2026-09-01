import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Draft } from './draft';
import { DraftStatus } from '../../services/Hub/draftHub';
import { GlobalStore } from '../../store/globalStore';
import { TEST_API_BASE_URL, provideConfigStub } from '../../testing/test-helpers';
import { FakeHubConnectionBuilder, provideFakeHub } from '../../testing/fake-hub';
import { makeUserResponse } from '../../testing/fixtures';

describe('Draft', () => {
  let fixture: ComponentFixture<Draft>;
  let component: Draft;
  let builder: FakeHubConnectionBuilder;
  let alert: ReturnType<typeof vi.fn>;
  let consoleLog: ReturnType<typeof vi.spyOn>;

  /** `leagueId` is captured at construction, so the store is seeded before createComponent. */
  async function build(leagueId?: number) {
    TestBed.resetTestingModule();
    builder = new FakeHubConnectionBuilder();
    TestBed.configureTestingModule({
      imports: [Draft],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        provideNoopAnimations(),
        provideFakeHub(builder),
      ],
    });

    const store = TestBed.inject(GlobalStore);
    store.loginSuccess(makeUserResponse());
    if (leagueId !== undefined) {
      store.selectLeague(leagueId, 'Main League');
    }

    await TestBed.compileComponents();
    fixture = TestBed.createComponent(Draft);
    component = fixture.componentInstance;
    return component;
  }

  beforeEach(async () => {
    localStorage.clear();
    vi.useFakeTimers();
    alert = vi.fn();
    // jsdom does not implement window.alert; the component calls it on the no-league path.
    vi.stubGlobal('alert', alert);
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await build(9);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    consoleLog.mockRestore();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('creates and takes its league from the store', () => {
    expect(component).toBeTruthy();
    expect(component.leagueId).toBe(9);
  });

  describe('ngOnInit', () => {
    it('opens the draft hub for the selected league', () => {
      component.ngOnInit();

      expect(builder.url).toBe(`${TEST_API_BASE_URL}/draftHub?leagueId=9`);
    });

    it('warns and connects to nothing when no league is selected', async () => {
      await build();

      component.ngOnInit();

      expect(alert).toHaveBeenCalledWith('Please select a league to start the draft!');
      expect(builder.connections).toHaveLength(0);
    });
  });

  describe('draft status flags', () => {
    it('isDraftStarted is true only while the draft is running', () => {
      component.draftHub.draftStatus.set(DraftStatus.DraftStarted);
      expect(component.isDraftStarted()).toBe(true);

      component.draftHub.draftStatus.set(DraftStatus.Paused);
      expect(component.isDraftStarted()).toBe(false);
    });

    it('isDraftEnded tracks the Ended status exactly', () => {
      component.draftHub.draftStatus.set(DraftStatus.DraftEnded);
      expect(component.isDraftEnded()).toBe(true);

      // Completed is a different status — isDraftOver covers it, isDraftEnded does not.
      component.draftHub.draftStatus.set(DraftStatus.DraftCompleted);
      expect(component.isDraftEnded()).toBe(false);
    });

    it('isDraftOver covers both Ended and Completed', () => {
      component.draftHub.draftStatus.set(DraftStatus.DraftEnded);
      expect(component.isDraftOver()).toBe(true);

      component.draftHub.draftStatus.set(DraftStatus.DraftCompleted);
      expect(component.isDraftOver()).toBe(true);

      component.draftHub.draftStatus.set(DraftStatus.Initial);
      expect(component.isDraftOver()).toBe(false);
    });
  });

  it('describes its layout tiles', () => {
    expect(component.tiles).toHaveLength(3);
    for (const tile of component.tiles) {
      expect(tile.cols).toBeGreaterThan(0);
      expect(tile.rows).toBeGreaterThan(0);
      expect(tile.text.length).toBeGreaterThan(0);
    }
  });

  it('renders the draft room panels', () => {
    fixture.detectChanges();

    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('app-draft-header')).not.toBeNull();
    expect(html.querySelector('app-draft-board')).not.toBeNull();
    expect(html.querySelector('app-draft-list-players')).not.toBeNull();
    expect(html.querySelector('app-drafted-players')).not.toBeNull();
  });
});

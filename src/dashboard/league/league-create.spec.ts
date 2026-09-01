import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { LeagueCreate } from './league-create';
import { TEST_API_BASE_URL, provideConfigStub } from '../../testing/test-helpers';
import { makeLeague } from '../../testing/fixtures';

describe('LeagueCreate', () => {
  let fixture: ComponentFixture<LeagueCreate>;
  let component: LeagueCreate;
  let httpMock: HttpTestingController;
  let consoleLog: ReturnType<typeof vi.spyOn>;
  let consoleError: ReturnType<typeof vi.spyOn>;

  const addUrl = `${TEST_API_BASE_URL}/v1/league/add`;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LeagueCreate],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        provideNoopAnimations(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LeagueCreate);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    httpMock.verify();
    consoleLog.mockRestore();
    consoleError.mockRestore();
    localStorage.clear();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  describe('form defaults', () => {
    it('starts with an empty name and the default league/draft types', () => {
      expect(component.form.value.leagueName).toBe('');
      expect(component.form.value.leagueType).toBe(1);
      expect(component.form.value.draftStyle).toBe(1);
      expect(component.form.value.typeTransactionsLimit).toBe(1);
      expect(component.form.value.autoStartPlayer).toBe(true);
    });

    it('leaves the scoring weights unset so the server applies its own defaults', () => {
      expect(component.form.value.points).toBeNull();
      expect(component.form.value.assists).toBeNull();
      expect(component.form.value.threePointsMade).toBeNull();
    });

    it('exposes every stat weight the API accepts', () => {
      for (const control of [
        'points',
        'assists',
        'rebounds',
        'blocks',
        'steals',
        'turnovers',
        'fgMade',
        'fgMissed',
        'ftMade',
        'ftMissed',
        'threePointsMade',
        'threePointsMissed',
      ]) {
        expect(component.form.get(control)).not.toBeNull();
      }
    });
  });

  describe('onSubmit', () => {
    it('POSTs the form as a create-league payload', () => {
      component.form.patchValue({
        leagueName: 'New League',
        leagueType: 2,
        draftStyle: 3,
        weeksForSeason: 20,
        transactionLimit: 5,
        autoStartPlayer: false,
      });

      component.onSubmit();

      const req = httpMock.expectOne(addUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toMatchObject({
        leagueName: 'New League',
        leagueType: 2,
        draftStyle: 3,
        weeksForSeason: 20,
        transactionLimit: 5,
        autoStart: false,
      });
      req.flush(makeLeague({ leagueid: 77 }));
    });

    it('renames the transaction-limit and auto-start fields to the API spelling', () => {
      // The form control names differ from the DTO: typeTransactionsLimit ->
      // typeTransactionLimits, autoStartPlayer -> autoStart. A silent rename bug here
      // would drop both settings server-side.
      component.form.patchValue({ typeTransactionsLimit: 4, autoStartPlayer: true });

      component.onSubmit();

      const req = httpMock.expectOne(addUrl);
      expect(req.request.body.typeTransactionLimits).toBe(4);
      expect(req.request.body.autoStart).toBe(true);
      expect(req.request.body.typeTransactionsLimit).toBeUndefined();
      expect(req.request.body.autoStartPlayer).toBeUndefined();
      req.flush(makeLeague());
    });

    it('nests the scoring weights under statsValue, mapping the 3-point names', () => {
      component.form.patchValue({
        points: 1,
        assists: 2,
        rebounds: 1.5,
        threePointsMade: 3,
        threePointsMissed: -1,
      });

      component.onSubmit();

      const req = httpMock.expectOne(addUrl);
      expect(req.request.body.statsValue).toMatchObject({
        points: 1,
        assists: 2,
        rebounds: 1.5,
        threePointersMade: 3,
        threePointersMissed: -1,
      });
      req.flush(makeLeague());
    });

    it('submits an untouched form rather than validating client-side', () => {
      // There are no validators on the form, so an empty name reaches the API and the
      // server's 400 is what the user sees.
      component.onSubmit();

      const req = httpMock.expectOne(addUrl);
      expect(req.request.body.leagueName).toBe('');
      req.flush(makeLeague());
    });

    it('logs the failure instead of surfacing it', () => {
      component.onSubmit();

      httpMock
        .expectOne(addUrl)
        .flush('name required', { status: 400, statusText: 'Bad Request' });

      expect(consoleError).toHaveBeenCalled();
    });

    it('tracks the subscription so it can be cleaned up', () => {
      component.onSubmit();
      httpMock.expectOne(addUrl).flush(makeLeague());

      expect(component.subscriptions).toHaveLength(1);
    });
  });

  describe('ngOnDestroy', () => {
    it('unsubscribes everything it opened', () => {
      const unsubscribe = vi.fn();
      component.subscriptions.push({ unsubscribe } as never);

      component.ngOnDestroy();

      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('is safe with nothing subscribed', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  it('renders the create-league form', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import { Header } from './header';
import { GlobalStore } from '../store/globalStore';
import { DynamicDialog } from '../components/dialog/dynamicDialog';
import { TEST_API_BASE_URL, provideConfigStub } from '../testing/test-helpers';
import { makeUserResponse } from '../testing/fixtures';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let component: Header;
  let httpMock: HttpTestingController;
  let store: InstanceType<typeof GlobalStore>;
  let afterClosed: Subject<unknown>;
  let open: ReturnType<typeof vi.spyOn>;
  let consoleLog: ReturnType<typeof vi.spyOn>;
  let consoleError: ReturnType<typeof vi.spyOn>;

  const loginUrl = `${TEST_API_BASE_URL}/v1/auth/login`;
  const registerUrl = `${TEST_API_BASE_URL}/v1/auth/register`;

  beforeEach(async () => {
    localStorage.clear();
    afterClosed = new Subject<unknown>();

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    // MatDialog.open is spied on the instance the component actually injected rather than
    // swapped through DI: Header imports SharedModule, which re-provides the real MatDialog
    // into the environment injector, so a provider override does not reliably win.
    // What matters here is what the header does with the dialog's *result*, not the overlay.
    open = vi
      .spyOn(component.dialog, 'open')
      .mockReturnValue({ afterClosed: () => afterClosed.asObservable() } as never);
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(GlobalStore);
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    httpMock.verify();
    open.mockRestore();
    consoleLog.mockRestore();
    consoleError.mockRestore();
    localStorage.clear();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  describe('openLoginDialog', () => {
    it('opens the dynamic dialog with username and password fields', () => {
      component.openLoginDialog();

      expect(open).toHaveBeenCalledTimes(1);
      const [dialogComponent, config] = open.mock.calls[0] as [unknown, { data: { fields: { key: string }[]; title: string } }];
      expect(dialogComponent).toBe(DynamicDialog);
      expect(config.data.title).toBe('Login');
      expect(config.data.fields.map((f) => f.key)).toEqual(['username', 'password']);
    });

    it('logs the user in when the dialog returns credentials', () => {
      component.openLoginDialog();

      afterClosed.next({ username: 'tester', password: 'secret' });

      const req = httpMock.expectOne(loginUrl);
      expect(req.request.body).toEqual({ username: 'tester', password: 'secret' });
      req.flush(makeUserResponse({ token: 'jwt' }));

      expect(store.isLoggedIn()).toBe(true);
      expect(store.token()).toBe('jwt');
    });

    it('does nothing when the dialog is cancelled', () => {
      component.openLoginDialog();

      afterClosed.next(undefined);

      httpMock.expectNone(loginUrl);
      expect(store.isLoggedIn()).toBe(false);
    });

    it.each([
      ['no username', { username: '', password: 'secret' }],
      ['no password', { username: 'tester', password: '' }],
      ['neither', { username: '', password: '' }],
    ])('does not submit with %s', (_case, result) => {
      component.openLoginDialog();

      afterClosed.next(result);

      httpMock.expectNone(loginUrl);
    });

    it('leaves the user logged out and logs the failure when login is rejected', () => {
      component.openLoginDialog();
      afterClosed.next({ username: 'tester', password: 'wrong' });

      httpMock
        .expectOne(loginUrl)
        .flush('bad credentials', { status: 401, statusText: 'Unauthorized' });

      expect(store.isLoggedIn()).toBe(false);
      expect(consoleError).toHaveBeenCalled();
    });
  });

  describe('openRegisterDialog', () => {
    it('opens the dialog with username, email and password fields', () => {
      component.openRegisterDialog();

      const [, config] = open.mock.calls[0] as [unknown, { data: { fields: { key: string }[]; title: string } }];
      expect(config.data.title).toBe('Sign Up');
      expect(config.data.fields.map((f) => f.key)).toEqual(['username', 'email', 'password']);
    });

    it('registers the account and signs the user in on success', () => {
      // The register endpoint issues a token, so there is no reason to make a new user
      // immediately retype the same credentials into the login dialog.
      component.openRegisterDialog();

      afterClosed.next({ username: 'tester', email: 'a@b.test', password: 'secret' });

      const req = httpMock.expectOne(registerUrl);
      expect(req.request.body).toEqual({
        username: 'tester',
        email: 'a@b.test',
        password: 'secret',
      });
      req.flush(makeUserResponse({ token: 'new-jwt', teams: [], leagues: [] }));

      expect(store.isLoggedIn()).toBe(true);
      expect(store.token()).toBe('new-jwt');
    });

    it('does nothing when the sign-up dialog is cancelled', () => {
      component.openRegisterDialog();

      afterClosed.next(undefined);

      httpMock.expectNone(registerUrl);
      expect(store.isLoggedIn()).toBe(false);
    });

    it.each([
      ['no username', { username: '', email: 'a@b.test', password: 'secret' }],
      ['no email', { username: 'tester', email: '', password: 'secret' }],
      ['no password', { username: 'tester', email: 'a@b.test', password: '' }],
    ])('does not submit with %s', (_case, result) => {
      component.openRegisterDialog();

      afterClosed.next(result);

      httpMock.expectNone(registerUrl);
    });

    it('leaves the user signed out and logs the failure when the name is taken', () => {
      component.openRegisterDialog();
      afterClosed.next({ username: 'taken', email: 'a@b.test', password: 'secret' });

      httpMock
        .expectOne(registerUrl)
        .flush('username taken', { status: 409, statusText: 'Conflict' });

      expect(store.isLoggedIn()).toBe(false);
      expect(consoleError).toHaveBeenCalled();
    });
  });

  it('exposes the store so the template can react to auth state', () => {
    expect(component.globalStore.isLoggedIn()).toBe(false);

    store.loginSuccess(makeUserResponse());

    expect(component.globalStore.isLoggedIn()).toBe(true);
  });
});

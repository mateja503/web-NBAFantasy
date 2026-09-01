import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService, LoginRequest, RegisterRequest, UserResponse } from './auth-service';
import { TEST_API_BASE_URL, provideConfigStub } from '../testing/test-helpers';
import { makeUserResponse } from '../testing/fixtures';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const loginUrl = `${TEST_API_BASE_URL}/v1/auth/login`;
  const registerUrl = `${TEST_API_BASE_URL}/v1/auth/register`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideConfigStub()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('POSTs credentials to the login endpoint and returns the user', () => {
    const credentials: LoginRequest = { username: 'tester', password: 'secret' };
    const expected = makeUserResponse();
    let received: UserResponse | undefined;

    service.login(credentials).subscribe((r) => (received = r));

    const req = httpMock.expectOne(loginUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);
    req.flush(expected);

    expect(received).toEqual(expected);
  });

  it('does not touch auth state itself — the caller owns that', () => {
    // AuthService deliberately performs only the network call; GlobalStore is the
    // single source of auth truth. Nothing here should write to localStorage.
    localStorage.clear();

    service.login({ username: 'tester', password: 'secret' }).subscribe();
    httpMock.expectOne(loginUrl).flush(makeUserResponse());

    expect(localStorage.getItem('use_store_state')).toBeNull();
  });

  it('surfaces a 401 to the caller instead of swallowing it', () => {
    let status: number | undefined;

    service
      .login({ username: 'tester', password: 'wrong' })
      .subscribe({ error: (e) => (status = e.status) });

    httpMock.expectOne(loginUrl).flush('bad credentials', {
      status: 401,
      statusText: 'Unauthorized',
    });

    expect(status).toBe(401);
  });

  describe('register', () => {
    it('POSTs username, email and password to the register endpoint', () => {
      const details: RegisterRequest = {
        username: 'tester',
        email: 'tester@example.test',
        password: 'secret',
      };

      service.register(details).subscribe();

      const req = httpMock.expectOne(registerUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(details);
      req.flush(makeUserResponse());
    });

    it('returns a token, so a sign-up can sign the user straight in', () => {
      let received: UserResponse | undefined;

      service
        .register({ username: 'tester', email: 'a@b.test', password: 'secret' })
        .subscribe((r) => (received = r));

      httpMock
        .expectOne(registerUrl)
        .flush(makeUserResponse({ token: 'new-jwt', teams: [], leagues: [] }));

      expect(received?.token).toBe('new-jwt');
      // A brand-new account owns nothing yet.
      expect(received?.teams).toEqual([]);
      expect(received?.leagues).toEqual([]);
    });

    it('surfaces a duplicate-username conflict to the caller', () => {
      let status: number | undefined;

      service
        .register({ username: 'taken', email: 'a@b.test', password: 'secret' })
        .subscribe({ error: (e) => (status = e.status) });

      httpMock
        .expectOne(registerUrl)
        .flush('username taken', { status: 409, statusText: 'Conflict' });

      expect(status).toBe(409);
    });
  });

  it('builds the URL from the runtime config, never a hardcoded host', () => {
    service.login({ username: 'a', password: 'b' }).subscribe();

    const req = httpMock.expectOne(loginUrl);
    expect(req.request.url.startsWith(TEST_API_BASE_URL)).toBe(true);
    req.flush(makeUserResponse());
  });
});

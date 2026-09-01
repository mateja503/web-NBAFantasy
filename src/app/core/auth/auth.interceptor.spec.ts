import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { GlobalStore } from '../../../store/globalStore';
import { provideConfigStub } from '../../../testing/test-helpers';
import { makeUserResponse } from '../../../testing/fixtures';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let store: InstanceType<typeof GlobalStore>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideConfigStub(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(GlobalStore);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('passes the request through untouched when no token is stored', () => {
    http.get('/config.json').subscribe();

    const req = httpMock.expectOne('/config.json');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('attaches a bearer header once a token exists in the store', () => {
    store.loginSuccess(makeUserResponse({ token: 'abc123' }));

    http.get('/v1/team').subscribe();

    const req = httpMock.expectOne('/v1/team');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    req.flush({});
  });

  it('stops attaching the header after logout', () => {
    store.loginSuccess(makeUserResponse({ token: 'abc123' }));
    store.logout();

    http.get('/v1/team').subscribe();

    const req = httpMock.expectOne('/v1/team');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('does not mutate the original request object', () => {
    store.loginSuccess(makeUserResponse({ token: 'abc123' }));

    http.get('/v1/team', { headers: { 'X-Custom': 'kept' } }).subscribe();

    const req = httpMock.expectOne('/v1/team');
    // clone() must preserve unrelated headers rather than replacing the header bag.
    expect(req.request.headers.get('X-Custom')).toBe('kept');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    req.flush({});
  });

  it('treats an empty-string token as "no token"', () => {
    // A blank token would otherwise produce the header "Bearer ", which the API
    // rejects with a 401 instead of the anonymous 403 the caller expects.
    store.loginSuccess(makeUserResponse({ token: '' }));

    http.get('/v1/team').subscribe();

    const req = httpMock.expectOne('/v1/team');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});

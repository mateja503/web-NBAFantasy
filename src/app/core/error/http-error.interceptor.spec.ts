import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { httpErrorInterceptor } from './http-error.interceptor';
import { GlobalStore } from '../../../store/globalStore';
import { MatSnackBarStub, provideConfigStub, provideSnackBarStub } from '../../../testing/test-helpers';
import { makeUserResponse } from '../../../testing/fixtures';

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let store: InstanceType<typeof GlobalStore>;
  let snackBar: MatSnackBarStub;
  let navigate: ReturnType<typeof vi.spyOn>;

  /** Fires a request and captures whatever error reaches the caller. */
  function requestFailingWith(status: number, statusText = 'Error') {
    let caught: HttpErrorResponse | undefined;
    http.get('/v1/team').subscribe({ error: (e: HttpErrorResponse) => (caught = e) });
    httpMock.expectOne('/v1/team').flush('body', { status, statusText });
    return () => caught;
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        provideSnackBarStub(),
        provideConfigStub(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(GlobalStore);
    snackBar = TestBed.inject(MatSnackBar) as unknown as MatSnackBarStub;
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('passes a successful response straight through', () => {
    let body: unknown;
    http.get('/v1/team').subscribe((r) => (body = r));

    httpMock.expectOne('/v1/team').flush({ ok: true });

    expect(body).toEqual({ ok: true });
    expect(snackBar.opened).toHaveLength(0);
  });

  it('on 401 clears auth state, redirects home and warns the user', () => {
    store.loginSuccess(makeUserResponse());
    expect(store.isLoggedIn()).toBe(true);

    requestFailingWith(401, 'Unauthorized');

    expect(store.isLoggedIn()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/home']);
    expect(snackBar.opened[0]?.message).toContain('session has expired');
  });

  it('on 0 reports the server as unreachable without logging out', () => {
    store.loginSuccess(makeUserResponse());

    requestFailingWith(0, 'Unknown Error');

    expect(store.isLoggedIn()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
    expect(snackBar.opened[0]?.message).toContain('Cannot reach the server');
  });

  it('on 500 shows the generic server-fault message', () => {
    requestFailingWith(500, 'Server Error');

    expect(snackBar.opened[0]?.message).toContain('Something went wrong on our end');
  });

  it('on 503 also shows the server-fault message', () => {
    requestFailingWith(503, 'Service Unavailable');

    expect(snackBar.opened[0]?.message).toContain('Something went wrong on our end');
  });

  it('stays silent on 4xx errors other than 401', () => {
    // 400/404/409 are the caller's business (form validation, missing entity) —
    // a global snackbar would double up on the component's own message.
    requestFailingWith(404, 'Not Found');
    requestFailingWith(400, 'Bad Request');

    expect(snackBar.opened).toHaveLength(0);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('re-throws the error so callers can add their own handling', () => {
    const caught = requestFailingWith(500, 'Server Error');

    expect(caught()).toBeInstanceOf(HttpErrorResponse);
    expect(caught()?.status).toBe(500);
  });
});

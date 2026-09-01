import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { authGuard } from './auth.guard';
import { GlobalStore } from '../../../store/globalStore';
import { provideConfigStub } from '../../../testing/test-helpers';
import { makeUserResponse } from '../../../testing/fixtures';

describe('authGuard', () => {
  let store: InstanceType<typeof GlobalStore>;
  let router: Router;

  // CanActivateFn is invoked by the router with the snapshot pair; the guard
  // itself ignores both, so empty stand-ins keep the specs focused on auth state.
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  const run = () => TestBed.runInInjectionContext(() => authGuard(route, state));

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
      ],
    });
    store = TestBed.inject(GlobalStore);
    router = TestBed.inject(Router);
  });

  afterEach(() => localStorage.clear());

  it('blocks an anonymous visitor with a redirect to /home', () => {
    const result = run();

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/home');
  });

  it('allows a logged-in user through', () => {
    store.loginSuccess(makeUserResponse());

    expect(run()).toBe(true);
  });

  it('blocks again after logout', () => {
    store.loginSuccess(makeUserResponse());
    store.logout();

    const result = run();
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/home');
  });

  it('allows a user whose session has no token but is otherwise present', () => {
    // isLoggedIn() is `user != null`, not `token != null`. Pinning that down: a
    // tokenless user still passes the guard and is rejected later by the API/401 path.
    store.loginSuccess(makeUserResponse({ token: undefined }));

    expect(run()).toBe(true);
  });
});

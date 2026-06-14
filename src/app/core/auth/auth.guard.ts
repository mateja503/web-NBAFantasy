import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GlobalStore } from '../../../store/globalStore';

/**
 * Blocks routes for unauthenticated users and redirects them home.
 *
 * Functional guard (CanActivateFn) — the current Angular idiom; it runs in an
 * injection context so it can `inject()` the store and router directly without
 * a class. Returning a UrlTree performs the redirect as part of navigation,
 * which is cleaner than calling router.navigate() and returning false.
 *
 * Auth truth comes from GlobalStore.isLoggedIn() so guard, interceptor, and UI
 * all read the same state.
 */
export const authGuard: CanActivateFn = () => {
  const store = inject(GlobalStore);
  const router = inject(Router);

  return store.isLoggedIn() ? true : router.createUrlTree(['/home']);
};

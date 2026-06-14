import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { GlobalStore } from '../../../store/globalStore';

/**
 * Attaches the bearer token to every outgoing HttpClient request.
 *
 * WHY an interceptor (vs. setting the header in each service):
 *   one cross-cutting place applies auth uniformly, so services stay unaware
 *   of auth and you can't forget the header on a new endpoint. The token is
 *   read from GlobalStore — the single source of auth truth — not duplicated.
 *
 * When no token exists (before login, and for the startup /config.json fetch)
 * the request passes through untouched, so this never blocks bootstrap.
 *
 * Note: SignalR uses its own transport and does NOT pass through HttpClient
 * interceptors; authenticate those hubs via accessTokenFactory separately.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(GlobalStore).token();

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }),
  );
};

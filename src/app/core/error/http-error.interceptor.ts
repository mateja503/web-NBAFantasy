import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { GlobalStore } from '../../../store/globalStore';

/**
 * Centralizes HTTP error handling so every request gets consistent treatment
 * instead of each component doing its own console.error / alert().
 *
 *   401 -> session is invalid: clear auth state and bounce to home.
 *   0   -> network/CORS failure: the server was unreachable.
 *   5xx -> server fault: generic "try again" message.
 *
 * The error is re-thrown so a component can still add context-specific handling
 * (e.g. inline form validation) on top of the global behaviour.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const store = inject(GlobalStore);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        store.logout();
        router.navigate(['/home']);
        snackBar.open('Your session has expired. Please sign in again.', 'Dismiss', { duration: 5000 });
      } else if (error.status === 0) {
        snackBar.open('Cannot reach the server. Check your connection.', 'Dismiss', { duration: 5000 });
      } else if (error.status >= 500) {
        snackBar.open('Something went wrong on our end. Please try again.', 'Dismiss', { duration: 5000 });
      }

      return throwError(() => error);
    }),
  );
};

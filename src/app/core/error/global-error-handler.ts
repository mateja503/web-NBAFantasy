import { ErrorHandler, Injectable, Injector, NgZone, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Catches errors that escape the RxJS / component layer (e.g. thrown in a
 * lifecycle hook or template) so the app never fails silently.
 *
 * WHY lazy injection via Injector:
 *   ErrorHandler is instantiated very early in bootstrap — earlier than most
 *   services. Injecting MatSnackBar directly into the constructor risks a
 *   circular/early-DI failure, so we resolve dependencies on demand inside
 *   handleError() instead.
 *
 * Snackbar is opened inside NgZone.run() because errors can originate outside
 * Angular's zone, where UI updates would not be picked up by change detection.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);

  handleError(error: unknown): void {
    console.error('Unhandled error:', error);

    const zone = this.injector.get(NgZone);
    const snackBar = this.injector.get(MatSnackBar);

    zone.run(() =>
      snackBar.open('An unexpected error occurred.', 'Dismiss', { duration: 5000 }),
    );
  }
}

import { Provider } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigService } from '../app/core/config/config.service';

/**
 * Shared test doubles. Excluded from coverage (see `coverageExclude` in
 * angular.json) — this file is scaffolding, not production code.
 */

/** Base URL every service spec asserts against. No trailing slash, matching the real config. */
export const TEST_API_BASE_URL = 'https://api.test';

/**
 * ConfigService normally resolves its value from a /config.json fetch performed by
 * provideAppInitializer. Specs never bootstrap the app, so `apiBaseUrl` would throw.
 * This stub supplies a fixed URL so service specs can assert full request URLs.
 */
export class ConfigServiceStub {
  readonly apiBaseUrl = TEST_API_BASE_URL;
  async load(): Promise<void> {
    /* no-op: config is already "loaded" */
  }
}

export function provideConfigStub(): Provider {
  return { provide: ConfigService, useClass: ConfigServiceStub };
}

/** Records snackbar calls so specs can assert user-facing messaging without Material overlays. */
export class MatSnackBarStub {
  readonly opened: { message: string; action?: string }[] = [];

  open(message: string, action?: string) {
    this.opened.push({ message, action });
    return { dismiss: () => undefined } as unknown as ReturnType<MatSnackBar['open']>;
  }
}

export function provideSnackBarStub(): Provider {
  return { provide: MatSnackBar, useClass: MatSnackBarStub };
}

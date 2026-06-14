import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * Shape of the runtime configuration served from /config.json.
 * Add new environment-specific values here (feature flags, etc.).
 */
export interface AppConfig {
  /** Base URL of the .NET backend, e.g. https://localhost:7041 (no trailing slash, no /v1). */
  apiBaseUrl: string;
}

/**
 * Loads runtime configuration once at application startup.
 *
 * WHY runtime (not build-time environment.ts):
 *   environment.ts is inlined into the bundle at build time, which forces a
 *   separate build per environment and breaks "build one image, deploy many".
 *   Fetching /config.json at boot lets the SAME compiled artifact / Docker image
 *   be reconfigured per environment (see docker/entrypoint.sh + envsubst).
 *
 * Populated by provideAppInitializer in app.config.ts BEFORE the app bootstraps,
 * so any root service may safely read apiBaseUrl in its own initialization.
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private config: AppConfig | null = null;

  /** Called by the app initializer; resolves once config is in memory. */
  async load(): Promise<void> {
    this.config = await firstValueFrom(this.http.get<AppConfig>('/config.json'));
  }

  get apiBaseUrl(): string {
    if (!this.config) {
      throw new Error(
        'ConfigService read before config was loaded. Ensure provideAppInitializer is registered.',
      );
    }
    return this.config.apiBaseUrl;
  }
}

import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { ConfigService } from './core/config/config.service';
import { authInterceptor } from './core/auth/auth.interceptor';
import { httpErrorInterceptor } from './core/error/http-error.interceptor';
import { GlobalErrorHandler } from './core/error/global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Interceptor order matters: authInterceptor adds the token on the way out,
    // httpErrorInterceptor wraps the response so it sees errors from downstream.
    provideHttpClient(withInterceptors([authInterceptor, httpErrorInterceptor])),
    // Required for Angular Material overlays (snackbar/dialog) to animate.
    provideAnimationsAsync(),
    // Single global handler for errors that escape the RxJS/component layer.
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    // Loads /config.json before the app bootstraps so services have apiBaseUrl ready.
    provideAppInitializer(() => inject(ConfigService).load()),
  ],
};

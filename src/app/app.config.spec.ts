import { EnvironmentProviders, ErrorHandler, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { appConfig } from './app.config';
import { GlobalErrorHandler } from './core/error/global-error-handler';

describe('appConfig', () => {
  /**
   * Stands the real provider list up in a TestBed.
   *
   * `provideHttpClientTesting()` comes last on purpose: appConfig registers
   * `provideAppInitializer(() => ConfigService.load())`, which TestBed runs when the injector
   * is created. Against a live backend that fetch fails, httpErrorInterceptor opens a
   * snackbar, and the overlay blows up outside any test. The testing backend parks the
   * request instead.
   */
  function configure() {
    TestBed.configureTestingModule({
      providers: [
        ...(appConfig.providers as (Provider | EnvironmentProviders)[]),
        provideHttpClientTesting(),
      ],
    });
  }

  afterEach(() => TestBed.resetTestingModule());

  it('declares a provider list', () => {
    expect(Array.isArray(appConfig.providers)).toBe(true);
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });

  it('routes every escaped error through the single global handler', () => {
    configure();

    expect(TestBed.inject(ErrorHandler)).toBeInstanceOf(GlobalErrorHandler);
  });

  it('registers no class-based HTTP interceptors — the functional ones are used instead', () => {
    // authInterceptor and httpErrorInterceptor go through withInterceptors(), which does not
    // populate HTTP_INTERCEPTORS. A non-empty list here would mean a second, competing
    // interceptor chain had been introduced.
    configure();

    expect(TestBed.inject(HTTP_INTERCEPTORS, [])).toEqual([]);
  });

  it('stands up without a browser bootstrap', () => {
    expect(() => {
      configure();
      TestBed.inject(ErrorHandler);
    }).not.toThrow();
  });
});

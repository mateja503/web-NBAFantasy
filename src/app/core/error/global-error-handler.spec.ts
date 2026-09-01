import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GlobalErrorHandler } from './global-error-handler';
import { MatSnackBarStub, provideSnackBarStub } from '../../../testing/test-helpers';

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let snackBar: MatSnackBarStub;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GlobalErrorHandler, provideSnackBarStub()],
    });
    handler = TestBed.inject(GlobalErrorHandler);
    snackBar = TestBed.inject(MatSnackBar) as unknown as MatSnackBarStub;
    // Silenced so a passing suite doesn't print red noise; still asserted on.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => consoleError.mockRestore());

  it('logs the error and shows a snackbar', () => {
    const error = new Error('boom');

    handler.handleError(error);

    expect(consoleError).toHaveBeenCalledWith('Unhandled error:', error);
    expect(snackBar.opened).toEqual([
      { message: 'An unexpected error occurred.', action: 'Dismiss' },
    ]);
  });

  it('handles non-Error values without throwing', () => {
    // Anything can be thrown in JS; the handler must not assume `.message` exists.
    expect(() => handler.handleError('a bare string')).not.toThrow();
    expect(() => handler.handleError(null)).not.toThrow();
    expect(() => handler.handleError(undefined)).not.toThrow();

    expect(snackBar.opened).toHaveLength(3);
  });

  it('shows one snackbar per error', () => {
    handler.handleError(new Error('first'));
    handler.handleError(new Error('second'));

    expect(snackBar.opened).toHaveLength(2);
  });
});

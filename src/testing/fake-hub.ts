import { Provider } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { HUB_CONNECTION_BUILDER } from '../services/Hub/hub-connection-builder';

type Handler = (...args: never[]) => unknown;

/**
 * A stand-in for signalR.HubConnection.
 *
 * Only the surface Hubservice and its subclasses actually touch is implemented — start, stop,
 * on, invoke, onclose and `state`. Specs drive it from the server side with `emit()` and
 * `triggerClose()`, and assert the client side with `invocations`.
 */
export class FakeHubConnection {
  state: signalR.HubConnectionState = signalR.HubConnectionState.Disconnected;

  /** Handlers registered via `.on()`, keyed by server method name. */
  readonly handlers = new Map<string, Handler[]>();
  /** Every `.invoke()` the code under test made, in order. */
  readonly invocations: { method: string; args: unknown[] }[] = [];
  readonly closeHandlers: (() => void)[] = [];

  startCount = 0;
  stopCount = 0;

  /** Set to an Error to make `start()` reject, exercising the failure path. */
  startError: unknown = null;
  /** Set to an Error to make `stop()` reject. */
  stopError: unknown = null;

  /** Per-method canned results for `invoke()`. Falls back to `undefined`. */
  private readonly invokeResults = new Map<string, { value?: unknown; error?: unknown }>();

  start(): Promise<void> {
    this.startCount++;
    if (this.startError) {
      return Promise.reject(this.startError);
    }
    this.state = signalR.HubConnectionState.Connected;
    return Promise.resolve();
  }

  stop(): Promise<void> {
    this.stopCount++;
    if (this.stopError) {
      return Promise.reject(this.stopError);
    }
    this.state = signalR.HubConnectionState.Disconnected;
    return Promise.resolve();
  }

  on(method: string, handler: Handler): void {
    const existing = this.handlers.get(method) ?? [];
    this.handlers.set(method, [...existing, handler]);
  }

  off(method: string): void {
    this.handlers.delete(method);
  }

  onclose(callback: () => void): void {
    this.closeHandlers.push(callback);
  }

  invoke<T>(method: string, ...args: unknown[]): Promise<T> {
    this.invocations.push({ method, args });

    const canned = this.invokeResults.get(method);
    if (canned?.error) {
      return Promise.reject(canned.error);
    }
    return Promise.resolve(canned?.value as T);
  }

  // ---- test-side controls --------------------------------------------------------------------

  /** Plays a server push through every handler registered for `method`. */
  emit(method: string, ...args: unknown[]): void {
    for (const handler of this.handlers.get(method) ?? []) {
      (handler as (...a: unknown[]) => unknown)(...args);
    }
  }

  /** True when the code under test registered a handler for this server method. */
  hasHandler(method: string): boolean {
    return (this.handlers.get(method)?.length ?? 0) > 0;
  }

  /** Fires the reconnect path Hubservice.handleDisconnects registers. */
  triggerClose(): void {
    this.state = signalR.HubConnectionState.Disconnected;
    for (const handler of this.closeHandlers) handler();
  }

  setInvokeResult(method: string, value: unknown): void {
    this.invokeResults.set(method, { value });
  }

  setInvokeError(method: string, error: unknown): void {
    this.invokeResults.set(method, { error });
  }

  /** The single invocation of `method`, or undefined. Fails loudly if called more than once. */
  invocationOf(method: string) {
    const matches = this.invocations.filter((i) => i.method === method);
    if (matches.length > 1) {
      throw new Error(`Expected one ${method} invocation, saw ${matches.length}`);
    }
    return matches[0];
  }
}

/**
 * Captures what Hubservice.startConnection configured, and hands back a FakeHubConnection.
 * `connections` grows one entry per build, which is how the specs prove a re-connect
 * actually tore down and rebuilt rather than reusing the old one.
 */
export class FakeHubConnectionBuilder {
  readonly urls: string[] = [];
  readonly optionsList: signalR.IHttpConnectionOptions[] = [];
  readonly connections: FakeHubConnection[] = [];
  automaticReconnectCount = 0;

  /**
   * Applied to every connection this builder produces. Set it before the call under test to
   * exercise the "handshake refused" path without reaching inside startConnection.
   */
  startError: unknown = null;

  /** The connection handed to the most recent build(). */
  get connection(): FakeHubConnection {
    const last = this.connections.at(-1);
    if (!last) throw new Error('build() has not been called yet');
    return last;
  }

  get url(): string {
    const last = this.urls.at(-1);
    if (last === undefined) throw new Error('withUrl() has not been called yet');
    return last;
  }

  get options(): signalR.IHttpConnectionOptions {
    const last = this.optionsList.at(-1);
    if (!last) throw new Error('withUrl() has not been called with options yet');
    return last;
  }

  withUrl(url: string, options?: signalR.IHttpConnectionOptions): this {
    this.urls.push(url);
    this.optionsList.push(options ?? {});
    return this;
  }

  withAutomaticReconnect(): this {
    this.automaticReconnectCount++;
    return this;
  }

  build(): signalR.HubConnection {
    const connection = new FakeHubConnection();
    connection.startError = this.startError;
    this.connections.push(connection);
    return connection as unknown as signalR.HubConnection;
  }
}

/**
 * Provides the fake builder for HUB_CONNECTION_BUILDER. Every hub built during the spec
 * shares this one builder, so `builder.connections` is the full history.
 */
export function provideFakeHub(builder: FakeHubConnectionBuilder): Provider {
  return {
    provide: HUB_CONNECTION_BUILDER,
    useValue: () => builder as unknown as signalR.HubConnectionBuilder,
  };
}

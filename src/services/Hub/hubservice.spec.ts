import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import * as signalR from '@microsoft/signalr';
import { Hubservice } from './hubservice';
import { GlobalStore } from '../../store/globalStore';
import { TEST_API_BASE_URL, provideConfigStub } from '../../testing/test-helpers';
import { FakeHubConnectionBuilder, provideFakeHub } from '../../testing/fake-hub';
import { makeUserResponse } from '../../testing/fixtures';

/** Hubservice is abstract; this is the smallest concrete subclass that exercises the base. */
@Injectable()
class TestHub extends Hubservice {
  protected override hubUrl = 'testHub';
  protected override retryTime = 3000;

  get connected(): boolean {
    return this.isConnected();
  }

  get connection() {
    return this.hubConnection;
  }
}

describe('Hubservice', () => {
  let hub: TestHub;
  let builder: FakeHubConnectionBuilder;
  let store: InstanceType<typeof GlobalStore>;
  let consoleLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    builder = new FakeHubConnectionBuilder();
    TestBed.configureTestingModule({
      providers: [
        TestHub,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        provideFakeHub(builder),
      ],
    });
    hub = TestBed.inject(TestHub);
    store = TestBed.inject(GlobalStore);
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLog.mockRestore();
    localStorage.clear();
    vi.useRealTimers();
  });

  describe('startConnection', () => {
    it('builds the URL from the runtime config and the hub name', async () => {
      await hub.startConnection();

      expect(builder.url).toBe(`${TEST_API_BASE_URL}/testHub`);
    });

    it('appends params as a query string', async () => {
      await hub.startConnection({ leagueId: 9, teamId: 3 });

      expect(builder.url).toBe(`${TEST_API_BASE_URL}/testHub?leagueId=9&teamId=3`);
    });

    it('URL-encodes param values', async () => {
      await hub.startConnection({ name: 'a b&c' });

      expect(builder.url).toContain('name=a+b%26c');
    });

    it('adds no query string when params is omitted or empty', async () => {
      await hub.startConnection({});

      // An empty object still takes the params branch, producing a bare "?" — pinned so a
      // change to that behaviour is a deliberate one.
      expect(builder.url).toBe(`${TEST_API_BASE_URL}/testHub?`);
    });

    it('enables automatic reconnect', async () => {
      await hub.startConnection();

      expect(builder.automaticReconnectCount).toBe(1);
    });

    it('authenticates with the token from the store, not an HTTP interceptor', async () => {
      // SignalR bypasses HttpClient entirely, so accessTokenFactory is the only auth path.
      store.loginSuccess(makeUserResponse({ token: 'hub-token' }));

      await hub.startConnection();

      expect(builder.options.accessTokenFactory?.()).toBe('hub-token');
    });

    it('supplies an empty token rather than undefined when signed out', async () => {
      await hub.startConnection();

      expect(builder.options.accessTokenFactory?.()).toBe('');
    });

    it('re-reads the token on every handshake, so a later login is picked up', async () => {
      await hub.startConnection();
      const factory = builder.options.accessTokenFactory;
      expect(factory?.()).toBe('');

      store.loginSuccess(makeUserResponse({ token: 'fresh' }));

      expect(factory?.()).toBe('fresh');
    });

    it('marks the hub connected once start resolves', async () => {
      expect(hub.connected).toBe(false);

      await hub.startConnection();

      expect(hub.connected).toBe(true);
      expect(builder.connection.startCount).toBe(1);
    });

    it('swallows a failed start and reports disconnected', async () => {
      // The promise must still resolve: callers chain .then(() => registerListeners()) on it,
      // and an unhandled rejection here would take out the calling component.
      builder.startError = new Error('handshake refused');

      await expect(hub.startConnection()).resolves.toBeUndefined();

      expect(hub.connected).toBe(false);
    });

    it('flips back to disconnected if a later start fails after a good one', async () => {
      await hub.startConnection();
      expect(hub.connected).toBe(true);

      builder.startError = new Error('server restarted');
      await hub.startConnection();

      expect(hub.connected).toBe(false);
    });
  });

  describe('handleDisconnects', () => {
    it('reconnects after retryTime when the connection closes', async () => {
      vi.useFakeTimers();
      await hub.startConnection();
      hub.handleDisconnects();

      builder.connection.triggerClose();
      expect(builder.connections).toHaveLength(1);

      vi.advanceTimersByTime(3000);

      // A second connection was built, i.e. startConnection ran again.
      expect(builder.connections).toHaveLength(2);
    });

    it('does not reconnect before retryTime has elapsed', async () => {
      vi.useFakeTimers();
      await hub.startConnection();
      hub.handleDisconnects();

      builder.connection.triggerClose();
      vi.advanceTimersByTime(2999);

      expect(builder.connections).toHaveLength(1);
    });

    it('leaves the connection object in place until the retry runs', async () => {
      vi.useFakeTimers();
      await hub.startConnection();
      const first = hub.connection;
      hub.handleDisconnects();

      builder.connection.triggerClose();

      expect(hub.connection).toBe(first);
      expect((first as unknown as { state: signalR.HubConnectionState }).state).toBe(
        signalR.HubConnectionState.Disconnected,
      );
    });
  });
});

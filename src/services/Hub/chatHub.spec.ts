import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChatHub } from './chatHub';
import { HubMethods } from '../../constraints/HubMethods';
import { TEST_API_BASE_URL, provideConfigStub } from '../../testing/test-helpers';
import { FakeHubConnectionBuilder, provideFakeHub } from '../../testing/fake-hub';

const MAX_MESSAGES = 200;

describe('ChatHub', () => {
  let hub: ChatHub;
  let builder: FakeHubConnectionBuilder;
  let consoleLog: ReturnType<typeof vi.spyOn>;
  let consoleError: ReturnType<typeof vi.spyOn>;

  /** Connects and registers the listener — the state every message spec starts from. */
  async function connected() {
    await hub.startConnection();
    hub.addMessageListener();
    return builder.connection;
  }

  beforeEach(() => {
    localStorage.clear();
    builder = new FakeHubConnectionBuilder();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        provideFakeHub(builder),
      ],
    });
    hub = TestBed.inject(ChatHub);
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLog.mockRestore();
    consoleError.mockRestore();
    localStorage.clear();
  });

  it('starts with no messages', () => {
    expect(hub.messages()).toEqual([]);
  });

  it('connects to the chatHub endpoint', async () => {
    await hub.startConnection();

    expect(builder.url).toBe(`${TEST_API_BASE_URL}/chatHub`);
  });

  describe('addMessageListener', () => {
    it('registers a handler for ReceiveMessage', async () => {
      const connection = await connected();

      expect(connection.hasHandler(HubMethods.Server.ReceiveMessage)).toBe(true);
    });

    it('appends an incoming message, mapping message -> text', async () => {
      const connection = await connected();

      connection.emit(HubMethods.Server.ReceiveMessage, 'alice', 'hello');

      expect(hub.messages()).toEqual([{ user: 'alice', text: 'hello' }]);
    });

    it('keeps messages in arrival order', async () => {
      const connection = await connected();

      connection.emit(HubMethods.Server.ReceiveMessage, 'alice', 'first');
      connection.emit(HubMethods.Server.ReceiveMessage, 'bob', 'second');

      expect(hub.messages().map((m) => m.text)).toEqual(['first', 'second']);
    });

    it('keeps duplicate messages — repeats are legitimate in chat', async () => {
      const connection = await connected();

      connection.emit(HubMethods.Server.ReceiveMessage, 'alice', 'ok');
      connection.emit(HubMethods.Server.ReceiveMessage, 'alice', 'ok');

      expect(hub.messages()).toHaveLength(2);
    });

    it(`caps retained messages at ${MAX_MESSAGES}, dropping the oldest`, async () => {
      const connection = await connected();

      for (let i = 0; i < MAX_MESSAGES + 5; i++) {
        connection.emit(HubMethods.Server.ReceiveMessage, 'alice', `msg-${i}`);
      }

      const messages = hub.messages();
      expect(messages).toHaveLength(MAX_MESSAGES);
      // The five oldest are gone; the newest is still last.
      expect(messages[0]?.text).toBe('msg-5');
      expect(messages.at(-1)?.text).toBe(`msg-${MAX_MESSAGES + 4}`);
    });

    it('holds exactly the cap without dropping anything', async () => {
      const connection = await connected();

      for (let i = 0; i < MAX_MESSAGES; i++) {
        connection.emit(HubMethods.Server.ReceiveMessage, 'alice', `msg-${i}`);
      }

      expect(hub.messages()).toHaveLength(MAX_MESSAGES);
      expect(hub.messages()[0]?.text).toBe('msg-0');
    });
  });

  describe('sendMessage', () => {
    it('invokes SendMessage with the user and text', async () => {
      const connection = await connected();

      hub.sendMessage('alice', 'hello');

      expect(connection.invocationOf(HubMethods.Client.SendMessage)).toEqual({
        method: HubMethods.Client.SendMessage,
        args: ['alice', 'hello'],
      });
    });

    it('does not optimistically add the sent message locally', async () => {
      // The server echoes it back on ReceiveMessage; adding it here too would double it.
      const connection = await connected();

      hub.sendMessage('alice', 'hello');

      expect(hub.messages()).toEqual([]);
      connection.emit(HubMethods.Server.ReceiveMessage, 'alice', 'hello');
      expect(hub.messages()).toHaveLength(1);
    });

    it('logs and swallows an invoke rejection instead of throwing at the caller', async () => {
      const connection = await connected();
      connection.setInvokeError(HubMethods.Client.SendMessage, new Error('hub down'));

      expect(() => hub.sendMessage('alice', 'hello')).not.toThrow();

      await Promise.resolve();
      await Promise.resolve();
      expect(consoleError).toHaveBeenCalled();
    });
  });
});

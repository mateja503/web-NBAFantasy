import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Chatroom } from './chatroom';
import { HubMethods } from '../../constraints/HubMethods';
import { TEST_API_BASE_URL, provideConfigStub } from '../../testing/test-helpers';
import { FakeHubConnectionBuilder, provideFakeHub } from '../../testing/fake-hub';

describe('Chatroom', () => {
  let fixture: ComponentFixture<Chatroom>;
  let component: Chatroom;
  let builder: FakeHubConnectionBuilder;
  let consoleLog: ReturnType<typeof vi.spyOn>;

  /** ngOnInit connects, then registers the listener on a later microtask. */
  async function initialized() {
    component.ngOnInit();
    await vi.waitFor(() => expect(builder.connections.length).toBeGreaterThan(0));
    return builder.connection;
  }

  beforeEach(async () => {
    localStorage.clear();
    builder = new FakeHubConnectionBuilder();
    await TestBed.configureTestingModule({
      imports: [Chatroom],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        provideNoopAnimations(),
        provideFakeHub(builder),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Chatroom);
    component = fixture.componentInstance;
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLog.mockRestore();
    localStorage.clear();
  });

  it('creates with an empty draft message and no user', () => {
    expect(component).toBeTruthy();
    expect(component.user).toBe('');
    expect(component.message()).toBe('');
  });

  describe('ngOnInit', () => {
    it('opens the chat hub connection', async () => {
      await initialized();

      expect(builder.url).toBe(`${TEST_API_BASE_URL}/chatHub`);
    });

    it('registers the incoming-message listener', async () => {
      const connection = await initialized();

      expect(connection.hasHandler(HubMethods.Server.ReceiveMessage)).toBe(true);
    });
  });

  describe('sendMessage', () => {
    it('sends the typed message under the current user', async () => {
      const connection = await initialized();
      component.user = 'alice';
      component.message.set('hello');

      component.sendMessage();

      expect(connection.invocationOf(HubMethods.Client.SendMessage)).toEqual({
        method: HubMethods.Client.SendMessage,
        args: ['alice', 'hello'],
      });
    });

    it('clears the input after sending', async () => {
      await initialized();
      component.message.set('hello');

      component.sendMessage();

      expect(component.message()).toBe('');
    });

    it('sends an empty message if the user submits a blank input', async () => {
      // Pinned deliberately: there is no guard here, so blank sends reach the hub.
      const connection = await initialized();

      component.sendMessage();

      expect(connection.invocationOf(HubMethods.Client.SendMessage)?.args).toEqual(['', '']);
    });
  });

  describe('rendering', () => {
    it('shows messages pushed from the hub', async () => {
      const connection = await initialized();

      connection.emit(HubMethods.Server.ReceiveMessage, 'alice', 'hello everyone');
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain('hello everyone');
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('alice');
    });

    it('shows the messages the hub already holds from an earlier visit', async () => {
      // The hub is a root singleton, so the log survives navigating away and back.
      const connection = await initialized();
      connection.emit(HubMethods.Server.ReceiveMessage, 'bob', 'earlier message');

      const second = TestBed.createComponent(Chatroom);
      second.detectChanges();

      expect((second.nativeElement as HTMLElement).textContent).toContain('earlier message');
    });
  });
});

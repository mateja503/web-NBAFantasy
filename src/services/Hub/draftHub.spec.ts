import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DraftHub, DraftStatus } from './draftHub';
import { HubMethods } from '../../constraints/HubMethods';
import { TEST_API_BASE_URL, provideConfigStub } from '../../testing/test-helpers';
import { FakeHubConnectionBuilder, provideFakeHub } from '../../testing/fake-hub';

/** The DraftState payload the server pushes. Local shape — the interface is not exported. */
function draftState(overrides: Record<string, unknown> = {}) {
  return {
    leagueName: 'Main League',
    pickEndTime: '2026-09-01T12:00:60.000Z',
    draftStatus: DraftStatus.DraftStarted,
    draftBoardTeams: {
      currentRound: 2,
      onTheClockTeam: { teamId: 3, teamName: 'Ballers', pick: 5 },
      draftOrder: [
        { teamId: 3, teamName: 'Ballers', pick: 5 },
        { teamId: 4, teamName: 'Dunkers', pick: 6 },
      ],
    },
    draftPlayers: [{ playerId: 1000, fullName: 'Test Player', position: 'G' }],
    draftedPlayersPerTeam: { 3: [{ playerId: 999, fullName: 'Picked Player', position: 'F' }] },
    ...overrides,
  };
}

describe('DraftHub', () => {
  let hub: DraftHub;
  let builder: FakeHubConnectionBuilder;
  let consoleLog: ReturnType<typeof vi.spyOn>;
  let consoleError: ReturnType<typeof vi.spyOn>;

  /** Connects and registers the UpdateDraftState listener. */
  async function connected() {
    await hub.startConnection();
    hub.updateDraftState();
    return builder.connection;
  }

  beforeEach(() => {
    localStorage.clear();
    // DraftHub starts a 1s setInterval in its CONSTRUCTOR, so the timers must already be
    // faked when the hub is injected — enabling them inside a test is too late to drive it.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-01T12:00:00.000Z'));
    builder = new FakeHubConnectionBuilder();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        provideFakeHub(builder),
      ],
    });
    hub = TestBed.inject(DraftHub);
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLog.mockRestore();
    consoleError.mockRestore();
    localStorage.clear();
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts with placeholder values and an unfinished draft', () => {
      expect(hub.leagueName()).toBe('Loading...');
      expect(hub.displayTime()).toBe('00:00');
      expect(hub.round()).toBe(1);
      expect(hub.draftStatus()).toBe(DraftStatus.Initial);
      expect(hub.teamOnTheClock()).toBeNull();
      expect(hub.draftTeams()).toEqual([]);
      expect(hub.draftPlayers()).toEqual([]);
      expect(hub.teamsDraftedPlayers()).toEqual({});
      expect(hub.isDraftOver()).toBe(false);
    });
  });

  describe('isDraftOver', () => {
    it.each([
      [DraftStatus.Initial, false],
      [DraftStatus.DraftStarted, false],
      [DraftStatus.Paused, false],
      [DraftStatus.DraftEnded, true],
      // A draft finished in an earlier session reports Completed, not Ended.
      [DraftStatus.DraftCompleted, true],
    ])('is %s -> %s', (status, expected) => {
      hub.draftStatus.set(status);

      expect(hub.isDraftOver()).toBe(expected);
    });
  });

  describe('initialize', () => {
    it('connects with the leagueId and registers the state listener', async () => {
      // initialize() returns the connect promise, so the listener is guaranteed registered
      // by the time it resolves — no polling required.
      await hub.initialize(9);

      expect(builder.url).toBe(`${TEST_API_BASE_URL}/draftHub?leagueId=9`);
      expect(builder.connection.hasHandler(HubMethods.Server.UpdateDraftState)).toBe(true);
    });

    it('still resolves and registers when the handshake is refused', async () => {
      // startConnection swallows a failed handshake, so initialize must not reject either —
      // the room falls back to whatever state it already has.
      builder.startError = new Error('handshake refused');

      await expect(hub.initialize(9)).resolves.toBeUndefined();
      expect(builder.connection.hasHandler(HubMethods.Server.UpdateDraftState)).toBe(true);
    });
  });

  describe('the pick clock', () => {
    it('does not tick before any draft state arrives', async () => {
      // It used to start unconditionally in the constructor and run for the life of the tab.
      await connected();

      vi.advanceTimersByTime(10_000);

      expect(hub.displayTime()).toBe('00:00');
    });

    it('starts once a live draft state arrives', async () => {
      const connection = await connected();

      connection.emit(
        HubMethods.Server.UpdateDraftState,
        draftState({ pickEndTime: '2026-09-01T12:01:00.000Z' }),
      );
      vi.advanceTimersByTime(1000);

      expect(hub.displayTime()).toBe('00:59');
    });

    it('stops once the draft is over', async () => {
      const connection = await connected();
      connection.emit(
        HubMethods.Server.UpdateDraftState,
        draftState({ pickEndTime: '2026-09-01T12:05:00.000Z' }),
      );
      vi.advanceTimersByTime(1000);
      const lastTick = hub.displayTime();

      connection.emit(
        HubMethods.Server.UpdateDraftState,
        draftState({
          pickEndTime: '2026-09-01T12:05:00.000Z',
          draftStatus: DraftStatus.DraftEnded,
          draftBoardTeams: null,
        }),
      );
      vi.advanceTimersByTime(10_000);

      // Frozen at the moment the draft ended rather than counting on for ever.
      expect(hub.displayTime()).toBe(lastTick);
    });

    it('restarts when a finished league opens a new draft', async () => {
      const connection = await connected();
      connection.emit(
        HubMethods.Server.UpdateDraftState,
        draftState({ draftStatus: DraftStatus.DraftEnded, draftBoardTeams: null }),
      );

      connection.emit(
        HubMethods.Server.UpdateDraftState,
        draftState({
          pickEndTime: '2026-09-01T12:00:45.000Z',
          draftStatus: DraftStatus.DraftStarted,
        }),
      );
      vi.advanceTimersByTime(1000);

      expect(hub.displayTime()).toBe('00:44');
    });

    it('stopClock is idempotent', async () => {
      await connected();

      expect(() => {
        hub.stopClock();
        hub.stopClock();
      }).not.toThrow();
    });
  });

  describe('UpdateDraftState handling', () => {
    it('maps a full state onto the signals', async () => {
      const connection = await connected();

      connection.emit(HubMethods.Server.UpdateDraftState, draftState());

      expect(hub.leagueName()).toBe('Main League');
      expect(hub.draftStatus()).toBe(DraftStatus.DraftStarted);
      expect(hub.round()).toBe(2);
      expect(hub.teamOnTheClock()).toEqual({ teamId: 3, teamName: 'Ballers', pick: 5 });
      expect(hub.draftTeams()).toHaveLength(2);
      expect(hub.draftPlayers()).toHaveLength(1);
      expect(hub.teamsDraftedPlayers()[3]).toHaveLength(1);
    });

    it('keeps the previous league name when the payload omits it', async () => {
      const connection = await connected();
      connection.emit(HubMethods.Server.UpdateDraftState, draftState());

      connection.emit(HubMethods.Server.UpdateDraftState, draftState({ leagueName: null }));

      expect(hub.leagueName()).toBe('Main League');
    });

    it('clears the board when the draft is over and no board is sent', async () => {
      const connection = await connected();
      connection.emit(HubMethods.Server.UpdateDraftState, draftState());

      connection.emit(
        HubMethods.Server.UpdateDraftState,
        draftState({ draftBoardTeams: null, draftStatus: DraftStatus.DraftEnded }),
      );

      // The last team must come off the clock rather than sitting there forever.
      expect(hub.teamOnTheClock()).toBeNull();
      expect(hub.draftTeams()).toEqual([]);
      expect(hub.isDraftOver()).toBe(true);
    });

    it('defaults null player collections to empty rather than null', async () => {
      const connection = await connected();

      connection.emit(
        HubMethods.Server.UpdateDraftState,
        draftState({ draftPlayers: null, draftedPlayersPerTeam: null }),
      );

      expect(hub.draftPlayers()).toEqual([]);
      expect(hub.teamsDraftedPlayers()).toEqual({});
    });

    it('defaults a null draftOrder to an empty list while keeping the round', async () => {
      const connection = await connected();

      connection.emit(
        HubMethods.Server.UpdateDraftState,
        draftState({
          draftBoardTeams: { currentRound: 4, onTheClockTeam: null, draftOrder: null },
        }),
      );

      expect(hub.round()).toBe(4);
      expect(hub.teamOnTheClock()).toBeNull();
      expect(hub.draftTeams()).toEqual([]);
    });

    it('replaces state wholesale on each push rather than merging', async () => {
      // The server sends the entire DraftState every time, so stale entries must not survive.
      const connection = await connected();
      connection.emit(HubMethods.Server.UpdateDraftState, draftState());

      connection.emit(
        HubMethods.Server.UpdateDraftState,
        draftState({ draftPlayers: [], draftedPlayersPerTeam: {} }),
      );

      expect(hub.draftPlayers()).toEqual([]);
      expect(hub.teamsDraftedPlayers()).toEqual({});
    });
  });

  describe('countdown', () => {
    it('renders the remaining time as mm:ss on each tick', async () => {
      const connection = await connected();
      connection.emit(
        HubMethods.Server.UpdateDraftState,
        draftState({ pickEndTime: '2026-09-01T12:01:30.000Z' }),
      );

      vi.advanceTimersByTime(1000);

      expect(hub.displayTime()).toBe('01:29');
    });

    it('zero-pads single digits', async () => {
      const connection = await connected();
      connection.emit(
        HubMethods.Server.UpdateDraftState,
        draftState({ pickEndTime: '2026-09-01T12:00:06.000Z' }),
      );

      vi.advanceTimersByTime(1000);

      expect(hub.displayTime()).toBe('00:05');
    });

    it('clamps to 00:00 once the pick clock has expired', async () => {
      const connection = await connected();
      connection.emit(
        HubMethods.Server.UpdateDraftState,
        draftState({ pickEndTime: '2026-09-01T11:59:00.000Z' }),
      );

      vi.advanceTimersByTime(1000);

      expect(hub.displayTime()).toBe('00:00');
    });

    it('leaves the clock alone until a state with an end time arrives', async () => {
      await connected();

      vi.advanceTimersByTime(5000);

      expect(hub.displayTime()).toBe('00:00');
    });
  });

  describe('resetTimer', () => {
    it('invokes ResetTimer with the leagueId', async () => {
      const connection = await connected();
      connection.setInvokeResult(HubMethods.Client.ResetTimer, draftState());

      hub.resetTimer(9);

      expect(connection.invocationOf(HubMethods.Client.ResetTimer)).toEqual({
        method: HubMethods.Client.ResetTimer,
        args: [9],
      });
    });

    it('logs and swallows a rejection', async () => {
      const connection = await connected();
      connection.setInvokeError(HubMethods.Client.ResetTimer, new Error('not the commissioner'));

      expect(() => hub.resetTimer(9)).not.toThrow();

      await Promise.resolve();
      await Promise.resolve();
      expect(consoleError).toHaveBeenCalled();
    });
  });

  describe('draftPlayer', () => {
    it('invokes DraftPlayer with leagueId, playerId and pick in that order', async () => {
      const connection = await connected();

      hub.draftPlayer(9, 1000, 5);

      expect(connection.invocationOf(HubMethods.Client.DraftPlayer)).toEqual({
        method: HubMethods.Client.DraftPlayer,
        args: [9, 1000, 5],
      });
    });

    it('does not apply the invoke result to state', async () => {
      // The hub method returns nothing; the real state arrives on the UpdateDraftState
      // broadcast. Feeding the undefined result into handleDraftState used to throw on every pick.
      const connection = await connected();
      connection.emit(HubMethods.Server.UpdateDraftState, draftState());

      hub.draftPlayer(9, 1000, 5);
      await Promise.resolve();
      await Promise.resolve();

      expect(hub.leagueName()).toBe('Main League');
      expect(hub.round()).toBe(2);
    });

    it('logs and swallows a rejected pick', async () => {
      const connection = await connected();
      connection.setInvokeError(HubMethods.Client.DraftPlayer, new Error('not your pick'));

      expect(() => hub.draftPlayer(9, 1000, 5)).not.toThrow();

      await Promise.resolve();
      await Promise.resolve();
      expect(consoleError).toHaveBeenCalled();
    });
  });
});

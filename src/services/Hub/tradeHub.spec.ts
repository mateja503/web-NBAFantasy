import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TradeHub, TradeBetweenTeams } from './tradeHub';
import { HubMethods } from '../../constraints/HubMethods';
import { Trade } from '../../models/trade';
import { TEST_API_BASE_URL, provideConfigStub } from '../../testing/test-helpers';
import { FakeHubConnectionBuilder, provideFakeHub } from '../../testing/fake-hub';

const LEAGUE_ID = 9;
const MY_TEAM = 3;
const OTHER_TEAM = 4;

function push(overrides: Partial<TradeBetweenTeams> = {}): TradeBetweenTeams {
  return {
    tradeId: 'trade-1',
    fromTeam: OTHER_TEAM,
    toTeam: MY_TEAM,
    playersIds: [1000, 1001],
    tradeDate: '2026-09-01T10:00:00Z',
    ...overrides,
  };
}

function restTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    tradeid: 'trade-1',
    leagueid: LEAGUE_ID,
    fromteamid: OTHER_TEAM,
    toteamid: MY_TEAM,
    playerids: [1000],
    status: 'pending',
    tscreated: '2026-09-01T09:00:00Z',
    tsexpires: '2026-09-02T09:00:00Z',
    ...overrides,
  };
}

describe('TradeHub', () => {
  let hub: TradeHub;
  let builder: FakeHubConnectionBuilder;
  let consoleLog: ReturnType<typeof vi.spyOn>;

  async function connected() {
    await hub.initialize(LEAGUE_ID, MY_TEAM);
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
    hub = TestBed.inject(TradeHub);
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLog.mockRestore();
    localStorage.clear();
  });

  it('starts empty and disconnected', () => {
    expect(hub.incomingTradeRequests()).toEqual([]);
    expect(hub.leagueTrades()).toEqual([]);
    expect(hub.lastAcceptedTrade()).toBeNull();
    expect(hub.connected()).toBe(false);
  });

  describe('initialize', () => {
    it('connects with leagueId and teamId and registers every listener', async () => {
      const connection = await connected();

      expect(builder.url).toBe(`${TEST_API_BASE_URL}/tradeHub?leagueId=9&teamId=3`);
      expect(hub.connected()).toBe(true);
      for (const method of [
        HubMethods.Server.ReceiveTradeRequest,
        HubMethods.Server.ReceiveTradeRequests,
        HubMethods.Server.ReceiveTradeAccepted,
        HubMethods.Server.ReceiveTradeRejected,
        HubMethods.Server.ReceiveTradeSuperseded,
      ]) {
        expect(connection.hasHandler(method)).toBe(true);
      }
    });

    it('is idempotent for the same league and team', async () => {
      await connected();

      await hub.initialize(LEAGUE_ID, MY_TEAM);

      // Navigating back to /trade must not stack a second connection and a second set of handlers.
      expect(builder.connections).toHaveLength(1);
    });

    it('tears down and rebuilds when the team changes', async () => {
      const first = await connected();

      await hub.initialize(LEAGUE_ID, OTHER_TEAM);

      expect(first.stopCount).toBe(1);
      expect(builder.connections).toHaveLength(2);
      expect(builder.url).toContain('teamId=4');
    });

    it('tears down and rebuilds when the league changes', async () => {
      const first = await connected();

      await hub.initialize(10, MY_TEAM);

      expect(first.stopCount).toBe(1);
      expect(builder.url).toContain('leagueId=10');
    });

    it('still opens the new connection when stopping the old one fails', async () => {
      const first = await connected();
      first.stopError = new Error('already gone');

      await expect(hub.initialize(10, MY_TEAM)).resolves.toBeUndefined();

      expect(builder.connections).toHaveLength(2);
    });

    it('reconnects for the same pair when the previous connection is no longer connected', async () => {
      const first = await connected();
      await first.stop();

      await hub.initialize(LEAGUE_ID, MY_TEAM);

      expect(builder.connections).toHaveLength(2);
    });
  });

  describe('ReceiveTradeRequest', () => {
    it('adds a new offer to the board and to my incoming list', async () => {
      const connection = await connected();

      connection.emit(HubMethods.Server.ReceiveTradeRequest, push());

      expect(hub.leagueTrades()).toHaveLength(1);
      expect(hub.leagueTrades()[0]?.status).toBe('pending');
      expect(hub.incomingTradeRequests()).toHaveLength(1);
    });

    it('shows an offer between two other teams on the board but not in my list', async () => {
      // ProposeSeasonTrade broadcasts league-wide, so this fires for trades I am not part of.
      const connection = await connected();

      connection.emit(
        HubMethods.Server.ReceiveTradeRequest,
        push({ tradeId: 'other', fromTeam: 4, toTeam: 5 }),
      );

      expect(hub.leagueTrades()).toHaveLength(1);
      expect(hub.incomingTradeRequests()).toEqual([]);
    });

    it('stamps the connected league onto the pushed trade', async () => {
      const connection = await connected();

      connection.emit(HubMethods.Server.ReceiveTradeRequest, push());

      expect(hub.leagueTrades()[0]?.leagueid).toBe(LEAGUE_ID);
    });

    it('defaults a missing tradeDate to now rather than leaving it blank', async () => {
      const connection = await connected();

      connection.emit(HubMethods.Server.ReceiveTradeRequest, push({ tradeDate: undefined }));

      expect(hub.leagueTrades()[0]?.tscreated).not.toBe('');
      expect(Number.isNaN(Date.parse(hub.leagueTrades()[0]!.tscreated))).toBe(false);
    });

    it('defaults missing playersIds to an empty array', async () => {
      const connection = await connected();

      connection.emit(
        HubMethods.Server.ReceiveTradeRequest,
        push({ playersIds: undefined as unknown as number[] }),
      );

      expect(hub.leagueTrades()[0]?.playerids).toEqual([]);
    });

    it('updates rather than duplicates when the same id is redelivered', async () => {
      const connection = await connected();

      connection.emit(HubMethods.Server.ReceiveTradeRequest, push());
      connection.emit(HubMethods.Server.ReceiveTradeRequest, push({ playersIds: [2000] }));

      expect(hub.leagueTrades()).toHaveLength(1);
      expect(hub.leagueTrades()[0]?.playerids).toEqual([2000]);
      expect(hub.incomingTradeRequests()).toHaveLength(1);
    });

    it('puts the newest offer first on the board', async () => {
      const connection = await connected();

      connection.emit(HubMethods.Server.ReceiveTradeRequest, push({ tradeId: 'first' }));
      connection.emit(HubMethods.Server.ReceiveTradeRequest, push({ tradeId: 'second' }));

      expect(hub.leagueTrades().map((t) => t.tradeid)).toEqual(['second', 'first']);
    });
  });

  describe('ReceiveTradeRequests (connect-time backlog)', () => {
    it('adds every backlog entry to the board and my incoming list', async () => {
      const connection = await connected();

      connection.emit(HubMethods.Server.ReceiveTradeRequests, [
        push({ tradeId: 'a' }),
        push({ tradeId: 'b' }),
      ]);

      expect(hub.leagueTrades()).toHaveLength(2);
      expect(hub.incomingTradeRequests()).toHaveLength(2);
    });

    it('tolerates a null backlog', async () => {
      const connection = await connected();

      expect(() =>
        connection.emit(HubMethods.Server.ReceiveTradeRequests, null),
      ).not.toThrow();
      expect(hub.leagueTrades()).toEqual([]);
    });

    it('does not duplicate a backlog entry already pushed live', async () => {
      const connection = await connected();
      connection.emit(HubMethods.Server.ReceiveTradeRequest, push());

      connection.emit(HubMethods.Server.ReceiveTradeRequests, [push()]);

      expect(hub.leagueTrades()).toHaveLength(1);
      expect(hub.incomingTradeRequests()).toHaveLength(1);
    });
  });

  describe('settlement events', () => {
    it('marks an accepted trade and remembers it as the last accepted', async () => {
      const connection = await connected();
      connection.emit(HubMethods.Server.ReceiveTradeRequest, push());

      connection.emit(HubMethods.Server.ReceiveTradeAccepted, push());

      expect(hub.leagueTrades()[0]?.status).toBe('accepted');
      expect(hub.lastAcceptedTrade()?.tradeId).toBe('trade-1');
      expect(hub.incomingTradeRequests()).toEqual([]);
    });

    it('marks a rejected trade and drops it from my actionable list', async () => {
      const connection = await connected();
      connection.emit(HubMethods.Server.ReceiveTradeRequest, push());

      connection.emit(HubMethods.Server.ReceiveTradeRejected, push());

      expect(hub.leagueTrades()[0]?.status).toBe('rejected');
      expect(hub.incomingTradeRequests()).toEqual([]);
      expect(hub.lastAcceptedTrade()).toBeNull();
    });

    it('marks a superseded trade as replaced, not declined', async () => {
      const connection = await connected();
      connection.emit(HubMethods.Server.ReceiveTradeRequest, push());

      connection.emit(HubMethods.Server.ReceiveTradeSuperseded, push());

      expect(hub.leagueTrades()[0]?.status).toBe('superseded');
      expect(hub.incomingTradeRequests()).toEqual([]);
    });

    it('ignores a settlement event with no tradeId', async () => {
      const connection = await connected();
      connection.emit(HubMethods.Server.ReceiveTradeRequest, push());

      connection.emit(HubMethods.Server.ReceiveTradeRejected, { tradeId: '' });

      expect(hub.leagueTrades()[0]?.status).toBe('pending');
      expect(hub.incomingTradeRequests()).toHaveLength(1);
    });

    it('leaves other trades untouched when one settles', async () => {
      const connection = await connected();
      connection.emit(HubMethods.Server.ReceiveTradeRequest, push({ tradeId: 'a' }));
      connection.emit(HubMethods.Server.ReceiveTradeRequest, push({ tradeId: 'b' }));

      connection.emit(HubMethods.Server.ReceiveTradeAccepted, push({ tradeId: 'a' }));

      const byId = Object.fromEntries(hub.leagueTrades().map((t) => [t.tradeid, t.status]));
      expect(byId['a']).toBe('accepted');
      expect(byId['b']).toBe('pending');
    });
  });

  describe('hydrate', () => {
    it('replaces the board with the REST rows', () => {
      hub.hydrate([restTrade(), restTrade({ tradeid: 'trade-2' })]);

      expect(hub.leagueTrades()).toHaveLength(2);
    });

    it('treats a null payload as an empty board', () => {
      hub.hydrate(null as unknown as Trade[]);

      expect(hub.leagueTrades()).toEqual([]);
    });

    it('keeps the REST timestamps when a live event later updates the same trade', async () => {
      // A pushed trade has no expiry and defaults tscreated to now, so it must not
      // overwrite what the REST row already knows.
      hub.hydrate([restTrade()]);
      const connection = await connected();

      connection.emit(HubMethods.Server.ReceiveTradeRequest, push({ playersIds: [7] }));

      const merged = hub.leagueTrades()[0]!;
      expect(merged.tscreated).toBe('2026-09-01T09:00:00Z');
      expect(merged.tsexpires).toBe('2026-09-02T09:00:00Z');
      expect(merged.playerids).toEqual([7]);
    });
  });

  describe('applyTrade', () => {
    it('merges a returned TradeDto into the board', () => {
      hub.applyTrade(restTrade());

      expect(hub.leagueTrades()).toHaveLength(1);
    });

    it('ignores a payload with no tradeid', () => {
      hub.applyTrade({ tradeid: '' } as Trade);

      expect(hub.leagueTrades()).toEqual([]);
    });

    it('ignores a null payload', () => {
      expect(() => hub.applyTrade(null as unknown as Trade)).not.toThrow();
      expect(hub.leagueTrades()).toEqual([]);
    });

    it('drops a settled trade from my incoming list', async () => {
      const connection = await connected();
      connection.emit(HubMethods.Server.ReceiveTradeRequest, push());

      hub.applyTrade(restTrade({ status: 'accepted' }));

      expect(hub.incomingTradeRequests()).toEqual([]);
      expect(hub.leagueTrades()[0]?.status).toBe('accepted');
    });

    it('leaves a still-pending trade in my incoming list', async () => {
      const connection = await connected();
      connection.emit(HubMethods.Server.ReceiveTradeRequest, push());

      hub.applyTrade(restTrade({ status: 'pending' }));

      expect(hub.incomingTradeRequests()).toHaveLength(1);
    });
  });

  describe('server calls', () => {
    it('rejects every call before initialize, with a message the user can act on', async () => {
      const expected = /Not connected to the trade hub/;

      await expect(hub.proposeSeasonTrade(LEAGUE_ID, MY_TEAM, OTHER_TEAM, [1])).rejects.toThrow(
        expected,
      );
      await expect(hub.acceptSeasonTrade(LEAGUE_ID, 'trade-1')).rejects.toThrow(expected);
      await expect(hub.rejectSeasonTrade(LEAGUE_ID, 'trade-1')).rejects.toThrow(expected);
    });

    it('rejects once the connection has dropped', async () => {
      const connection = await connected();
      await connection.stop();

      await expect(hub.acceptSeasonTrade(LEAGUE_ID, 'trade-1')).rejects.toThrow(
        /Not connected to the trade hub/,
      );
    });

    it('proposeSeasonTrade invokes with league, both teams and the players', async () => {
      const connection = await connected();
      connection.setInvokeResult(HubMethods.Client.ProposeSeasonTrade, restTrade());

      const result = await hub.proposeSeasonTrade(LEAGUE_ID, MY_TEAM, OTHER_TEAM, [1000, 1001]);

      expect(connection.invocationOf(HubMethods.Client.ProposeSeasonTrade)).toEqual({
        method: HubMethods.Client.ProposeSeasonTrade,
        args: [LEAGUE_ID, MY_TEAM, OTHER_TEAM, [1000, 1001]],
      });
      expect(result.tradeid).toBe('trade-1');
    });

    it('acceptSeasonTrade invokes with league and trade id', async () => {
      const connection = await connected();
      connection.setInvokeResult(HubMethods.Client.AcceptSeasonTrade, restTrade());

      await hub.acceptSeasonTrade(LEAGUE_ID, 'trade-1');

      expect(connection.invocationOf(HubMethods.Client.AcceptSeasonTrade)).toEqual({
        method: HubMethods.Client.AcceptSeasonTrade,
        args: [LEAGUE_ID, 'trade-1'],
      });
    });

    it('rejectSeasonTrade invokes with league and trade id', async () => {
      const connection = await connected();
      connection.setInvokeResult(HubMethods.Client.RejectSeasonTrade, restTrade());

      await hub.rejectSeasonTrade(LEAGUE_ID, 'trade-1');

      expect(connection.invocationOf(HubMethods.Client.RejectSeasonTrade)).toEqual({
        method: HubMethods.Client.RejectSeasonTrade,
        args: [LEAGUE_ID, 'trade-1'],
      });
    });

    it('surfaces the hub error so the caller can explain why a trade was refused', async () => {
      // Roster limits, a player no longer owned, an offer someone already answered — the
      // caller needs the reason, not a swallowed log line.
      const connection = await connected();
      connection.setInvokeError(
        HubMethods.Client.AcceptSeasonTrade,
        new Error('roster limit exceeded'),
      );

      await expect(hub.acceptSeasonTrade(LEAGUE_ID, 'trade-1')).rejects.toThrow(
        /roster limit exceeded/,
      );
    });
  });
});

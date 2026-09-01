import { ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Trade, TradeView } from './trade';
import { Trade as TradeRow } from '../../models/trade';
import { Player } from '../../models/player';
import { TradeHub } from '../../services/Hub/tradeHub';
import { HubMethods } from '../../constraints/HubMethods';
import { TEST_API_BASE_URL, provideConfigStub } from '../../testing/test-helpers';
import { FakeHubConnectionBuilder, provideFakeHub } from '../../testing/fake-hub';
import { GlobalStore } from '../../store/globalStore';
import { makeLeagueTeam, makePlayer, makeUserResponse } from '../../testing/fixtures';

const LEAGUE_ID = 9;
const MY_TEAM = 3;
const THEIR_TEAM = 4;

describe('Trade', () => {
  let fixture: ComponentFixture<Trade>;
  let component: Trade;
  let httpMock: HttpTestingController;
  let store: InstanceType<typeof GlobalStore>;
  let hub: TradeHub;
  let builder: FakeHubConnectionBuilder;

  const tradesUrl = `${TEST_API_BASE_URL}/v1/trades`;
  const teamsUrl = `${TEST_API_BASE_URL}/v1/team/get-leagues-teams/${LEAGUE_ID}`;
  const rosterUrl = (teamId: number) => `${TEST_API_BASE_URL}/v1/team/get-team-players/${teamId}`;

  const myPlayers = [
    makePlayer({ playerid: 101, name: 'LeBron', surname: 'James', position: 'F' }),
    makePlayer({ playerid: 102, name: 'Anthony', surname: 'Davis', position: 'C' }),
  ];
  const theirPlayers = [
    makePlayer({ playerid: 201, name: 'Stephen', surname: 'Curry', position: 'G' }),
    makePlayer({ playerid: 202, name: 'Draymond', surname: 'Green', position: 'F' }),
  ];

  const tradeRow = (overrides: Partial<TradeRow> = {}): TradeRow => ({
    tradeid: 'trade-1',
    leagueid: LEAGUE_ID,
    fromteamid: THEIR_TEAM,
    toteamid: MY_TEAM,
    playerids: [201, 101],
    status: 'pending',
    tscreated: '2026-09-01T10:00:00Z',
    tsexpires: '2026-09-02T10:00:00Z',
    ...overrides,
  });

  /**
   * `leagueId` and `myTeamId` are read once at construction, so the store is seeded before the
   * component is created.
   */
  async function build(leagueId = LEAGUE_ID, teamId = MY_TEAM) {
    TestBed.resetTestingModule();
    builder = new FakeHubConnectionBuilder();
    TestBed.configureTestingModule({
      imports: [Trade],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        provideFakeHub(builder),
        { provide: ComponentFixtureAutoDetect, useValue: false },
      ],
    });

    store = TestBed.inject(GlobalStore);
    store.loginSuccess(makeUserResponse());
    if (leagueId > 0) store.selectLeague(leagueId, 'Main League');
    if (teamId > 0) store.selectTeam(teamId, 'My Team');

    await TestBed.compileComponents();
    fixture = TestBed.createComponent(Trade);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    hub = TestBed.inject(TradeHub);
    return component;
  }

  /** Runs ngOnInit and answers every request the full load fires. */
  async function init(trades: TradeRow[] = [tradeRow()]) {
    component.ngOnInit();
    await Promise.resolve();

    httpMock.match((r) => r.url === tradesUrl).forEach((r) => r.flush(trades));
    httpMock
      .expectOne(teamsUrl)
      .flush([
        makeLeagueTeam({ teamid: MY_TEAM, name: 'My Team' }),
        makeLeagueTeam({ teamid: THEIR_TEAM, name: 'Their Team' }),
      ]);
    httpMock.expectOne(rosterUrl(MY_TEAM)).flush(myPlayers);
    httpMock.expectOne(rosterUrl(THEIR_TEAM)).flush(theirPlayers);
  }

  /** Waits until TradeHub.initialize has finished registering its listeners. */
  async function hubReady() {
    await vi.waitFor(() =>
      expect(builder.connection.hasHandler(HubMethods.Server.ReceiveTradeRequest)).toBe(true),
    );
    return builder.connection;
  }

  const viewOf = (id: string) => component.tradeViews().find((v) => v.trade.tradeid === id)!;

  beforeEach(async () => {
    localStorage.clear();
    await build();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('context', () => {
    it('reads league and team from the store', () => {
      expect(component.leagueId).toBe(LEAGUE_ID);
      expect(component.myTeamId).toBe(MY_TEAM);
      expect(component.leagueName).toBe('Main League');
      expect(component.hasContext).toBe(true);
    });

    it('has no context without a league', async () => {
      await build(0, MY_TEAM);

      expect(component.hasContext).toBe(false);
    });

    it('has no context without a team', async () => {
      await build(LEAGUE_ID, 0);

      expect(component.hasContext).toBe(false);
    });

    it('loads nothing and opens no hub without context', async () => {
      await build(0, 0);

      component.ngOnInit();

      httpMock.verify();
      expect(builder.connections).toHaveLength(0);
    });
  });

  describe('load', () => {
    it('opens the hub and fetches the board, teams and every roster', async () => {
      await init();

      expect(builder.url).toContain('tradeHub?leagueId=9&teamId=3');
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
      expect(component.teams()).toHaveLength(2);
      expect(component.trades()).toHaveLength(1);
      expect(component.rosters()[MY_TEAM]).toHaveLength(2);
      expect(component.rosters()[THEIR_TEAM]).toHaveLength(2);
      httpMock.verify();
    });

    it('reports a failure without leaving the page spinning', async () => {
      component.ngOnInit();
      await Promise.resolve();

      httpMock
        .match((r) => r.url === tradesUrl)
        .forEach((r) => r.flush('boom', { status: 500, statusText: 'Server Error' }));
      // The teams request is not flushed: forkJoin cancels its sibling as soon as one
      // source errors, and a cancelled request cannot be answered.

      expect(component.error()).toContain('could not load');
      expect(component.loading()).toBe(false);
    });

    it('survives a league with no teams', async () => {
      component.ngOnInit();
      await Promise.resolve();

      httpMock.match((r) => r.url === tradesUrl).forEach((r) => r.flush([]));
      httpMock.expectOne(teamsUrl).flush([]);

      expect(component.rosters()).toEqual({});
      expect(component.loading()).toBe(false);
      httpMock.verify();
    });

    it("keeps the board when one team's roster fails", async () => {
      // One unreadable team costs that team's player names, not the whole trade board.
      component.ngOnInit();
      await Promise.resolve();

      httpMock.match((r) => r.url === tradesUrl).forEach((r) => r.flush([tradeRow()]));
      httpMock
        .expectOne(teamsUrl)
        .flush([
          makeLeagueTeam({ teamid: MY_TEAM, name: 'My Team' }),
          makeLeagueTeam({ teamid: THEIR_TEAM, name: 'Their Team' }),
        ]);
      httpMock.expectOne(rosterUrl(MY_TEAM)).flush(myPlayers);
      httpMock
        .expectOne(rosterUrl(THEIR_TEAM))
        .flush('nope', { status: 403, statusText: 'Forbidden' });

      expect(component.error()).toBeNull();
      expect(component.rosters()[THEIR_TEAM]).toEqual([]);
      expect(component.trades()).toHaveLength(1);
    });
  });

  describe('tradeViews', () => {
    beforeEach(async () => {
      await init([
        tradeRow({ tradeid: 'older', tscreated: '2026-09-01T09:00:00Z' }),
        tradeRow({ tradeid: 'newer', tscreated: '2026-09-01T11:00:00Z' }),
      ]);
    });

    it('sorts newest first', () => {
      expect(component.tradeViews().map((v) => v.trade.tradeid)).toEqual(['newer', 'older']);
    });

    it('resolves both team names', () => {
      const view = viewOf('newer');

      expect(view.fromTeamName).toBe('Their Team');
      expect(view.toTeamName).toBe('My Team');
    });

    it('splits the flat id list into gives and gets by roster', () => {
      // Proposer is THEIR_TEAM: 201 is theirs (a give), 101 is mine (what they want).
      const view = viewOf('newer');

      expect(view.gives.map((p) => p.playerid)).toEqual([201]);
      expect(view.gets.map((p) => p.playerid)).toEqual([101]);
    });

    it('flags an offer aimed at me as incoming, not outgoing', () => {
      const view = viewOf('newer');

      expect(view.isIncoming).toBe(true);
      expect(view.isOutgoing).toBe(false);
      expect(view.isOpen).toBe(true);
    });

    it('flags my own offer as outgoing', async () => {
      await init([tradeRow({ tradeid: 'mine', fromteamid: MY_TEAM, toteamid: THEIR_TEAM })]);

      const view = viewOf('mine');
      expect(view.isOutgoing).toBe(true);
      expect(view.isIncoming).toBe(false);
    });

    it('a settled trade is neither incoming nor outgoing', async () => {
      await init([tradeRow({ tradeid: 'done', status: 'rejected' })]);

      const view = viewOf('done');
      expect(view.isOpen).toBe(false);
      expect(view.isIncoming).toBe(false);
      expect(view.isOutgoing).toBe(false);
    });

    it('inverts the sides of an accepted trade, whose players have already swapped', async () => {
      // Player 201 now sits on MY roster, so for the proposer it is one they gave up.
      await init([tradeRow({ tradeid: 'done', status: 'accepted' })]);
      component.rosters.set({
        [MY_TEAM]: [myPlayers[1]!, theirPlayers[0]!],
        [THEIR_TEAM]: [theirPlayers[1]!, myPlayers[0]!],
      });

      const view = viewOf('done');
      expect(view.gives.map((p) => p.playerid)).toEqual([201]);
      expect(view.gets.map((p) => p.playerid)).toEqual([101]);
    });

    it('renders an unknown player id as a placeholder rather than dropping it', async () => {
      // A trade showing three players when it involves four would be a lie.
      await init([tradeRow({ tradeid: 'ghost', playerids: [201, 999] })]);

      const view = viewOf('ghost');
      expect(view.gives.length + view.gets.length).toBe(2);
      const placeholder = [...view.gives, ...view.gets].find((p) => p.playerid === 999);
      expect(placeholder?.name).toBe('Unknown');
    });

    it('handles a trade with no players at all', async () => {
      await init([tradeRow({ tradeid: 'empty', playerids: [] })]);

      const view = viewOf('empty');
      expect(view.gives).toEqual([]);
      expect(view.gets).toEqual([]);
    });
  });

  describe('filters', () => {
    beforeEach(async () => {
      await init([
        tradeRow({ tradeid: 'in', fromteamid: THEIR_TEAM, toteamid: MY_TEAM }),
        tradeRow({ tradeid: 'out', fromteamid: MY_TEAM, toteamid: THEIR_TEAM }),
        tradeRow({ tradeid: 'done', status: 'accepted' }),
      ]);
    });

    it('defaults to the open tab', () => {
      expect(component.filter()).toBe('open');
      expect(component.visibleTrades().map((v) => v.trade.tradeid).sort()).toEqual(['in', 'out']);
    });

    it('narrows to incoming', () => {
      component.setFilter('incoming');

      expect(component.visibleTrades().map((v) => v.trade.tradeid)).toEqual(['in']);
    });

    it('narrows to outgoing', () => {
      component.setFilter('outgoing');

      expect(component.visibleTrades().map((v) => v.trade.tradeid)).toEqual(['out']);
    });

    it('shows only settled trades on the settled tab', () => {
      component.setFilter('settled');

      expect(component.visibleTrades().map((v) => v.trade.tradeid)).toEqual(['done']);
    });

    it('counts open and incoming for the tab badges', () => {
      expect(component.openCount()).toBe(2);
      expect(component.incomingCount()).toBe(1);
    });
  });

  describe('selectedTrade', () => {
    beforeEach(async () => {
      await init([tradeRow({ tradeid: 'in' })]);
    });

    it('is null until a card is picked', () => {
      expect(component.selectedTrade()).toBeNull();
    });

    it('resolves the picked card', () => {
      component.selectTrade(viewOf('in'));

      expect(component.selectedTrade()?.trade.tradeid).toBe('in');
    });

    it('closes the builder and clears the action error when a card is picked', () => {
      component.startNewOffer();
      component.actionError.set('previous failure');

      component.selectTrade(viewOf('in'));

      expect(component.builderOpen()).toBe(false);
      expect(component.actionError()).toBeNull();
    });

    it('empties once the offer is settled and leaves the visible list', () => {
      // A panel still describing an answered offer would be the only thing on screen
      // claiming there is something left to answer.
      component.selectTrade(viewOf('in'));
      expect(component.selectedTrade()).not.toBeNull();

      hub.applyTrade({ ...tradeRow({ tradeid: 'in' }), status: 'accepted' });

      expect(component.selectedTrade()).toBeNull();
    });

    it('still shows a settled offer while the settled tab is open', () => {
      component.selectTrade(viewOf('in'));
      hub.applyTrade({ ...tradeRow({ tradeid: 'in' }), status: 'accepted' });

      component.setFilter('settled');

      expect(component.selectedTrade()?.trade.tradeid).toBe('in');
    });
  });

  describe('accept and decline', () => {
    beforeEach(async () => {
      await init([tradeRow({ tradeid: 'in' })]);
    });

    it('accept invokes the hub and applies the settled trade', async () => {
      const connection = builder.connection;
      connection.setInvokeResult(
        HubMethods.Client.AcceptSeasonTrade,
        tradeRow({ tradeid: 'in', status: 'accepted' }),
      );

      component.accept(viewOf('in'));
      await vi.waitFor(() => expect(component.sending()).toBe(false));

      expect(connection.invocationOf(HubMethods.Client.AcceptSeasonTrade)?.args).toEqual([
        LEAGUE_ID,
        'in',
      ]);
      expect(component.trades()[0]?.status).toBe('accepted');
      expect(component.actionError()).toBeNull();
    });

    it('decline uses the reject call — withdrawing and declining are the same', async () => {
      const connection = builder.connection;
      connection.setInvokeResult(
        HubMethods.Client.RejectSeasonTrade,
        tradeRow({ tradeid: 'in', status: 'rejected' }),
      );

      component.decline(viewOf('in'));
      await vi.waitFor(() => expect(component.sending()).toBe(false));

      expect(connection.invocationOf(HubMethods.Client.RejectSeasonTrade)?.args).toEqual([
        LEAGUE_ID,
        'in',
      ]);
      expect(component.trades()[0]?.status).toBe('rejected');
    });

    it('surfaces the hub error next to the action', async () => {
      builder.connection.setInvokeError(
        HubMethods.Client.AcceptSeasonTrade,
        new Error('roster limit exceeded'),
      );

      component.accept(viewOf('in'));
      await vi.waitFor(() => expect(component.sending()).toBe(false));

      expect(component.actionError()).toContain('roster limit exceeded');
    });

    it('clears sending even when the call fails', async () => {
      builder.connection.setInvokeError(HubMethods.Client.AcceptSeasonTrade, new Error('nope'));

      component.accept(viewOf('in'));
      await vi.waitFor(() => expect(component.sending()).toBe(false));

      expect(component.sending()).toBe(false);
    });
  });

  describe('offer builder', () => {
    beforeEach(async () => {
      await init([tradeRow({ tradeid: 'in' })]);
    });

    it('startNewOffer opens an empty builder and drops the selection', () => {
      component.selectTrade(viewOf('in'));

      component.startNewOffer();

      expect(component.builderOpen()).toBe(true);
      expect(component.partnerTeamId()).toBeNull();
      expect(component.offeredPlayerIds()).toEqual([]);
      expect(component.requestedPlayerIds()).toEqual([]);
      expect(component.counterOf()).toBeNull();
      expect(component.selectedTradeId()).toBeNull();
    });

    it('cancelBuilder closes it and forgets the counter', () => {
      component.startCounter(viewOf('in'));

      component.cancelBuilder();

      expect(component.builderOpen()).toBe(false);
      expect(component.counterOf()).toBeNull();
    });

    it('offers only the other teams as partners', () => {
      expect(component.otherTeams().map((t) => t.teamid)).toEqual([THEIR_TEAM]);
    });

    it('exposes my roster and the partner roster', () => {
      expect(component.myRoster()).toHaveLength(2);
      expect(component.partnerRoster()).toEqual([]);

      component.selectPartner(THEIR_TEAM);

      expect(component.partnerRoster().map((p) => p.playerid)).toEqual([201, 202]);
    });

    it('clears requested players when the partner changes', () => {
      // Players requested from the old partner are not on the new team's roster, so the
      // server would reject them as unowned.
      component.selectPartner(THEIR_TEAM);
      component.toggleRequested(201);
      component.toggleOffered(101);

      component.selectPartner(5);

      expect(component.requestedPlayerIds()).toEqual([]);
      // What I am putting up is still mine, so it survives the switch.
      expect(component.offeredPlayerIds()).toEqual([101]);
    });

    it('keeps the selection when the same partner is picked again', () => {
      component.selectPartner(THEIR_TEAM);
      component.toggleRequested(201);

      component.selectPartner(THEIR_TEAM);

      expect(component.requestedPlayerIds()).toEqual([201]);
    });

    it('toggles offered and requested players on and off', () => {
      component.toggleOffered(101);
      expect(component.isOffered(101)).toBe(true);

      component.toggleOffered(101);
      expect(component.isOffered(101)).toBe(false);

      component.toggleRequested(201);
      expect(component.isRequested(201)).toBe(true);

      component.toggleRequested(201);
      expect(component.isRequested(201)).toBe(false);
    });

    it('resolves both sides of the offer being built', () => {
      component.toggleOffered(101);
      component.toggleRequested(201);

      expect(component.offeredPlayers().map((p) => p.playerid)).toEqual([101]);
      expect(component.requestedPlayers().map((p) => p.playerid)).toEqual([201]);
    });

    describe('canSend', () => {
      it('is false with no partner', () => {
        component.toggleOffered(101);

        expect(component.canSend()).toBe(false);
      });

      it('is false with a partner but an empty offer', () => {
        component.selectPartner(THEIR_TEAM);

        expect(component.canSend()).toBe(false);
      });

      it('is true with a partner and at least one player on either side', () => {
        component.selectPartner(THEIR_TEAM);
        component.toggleRequested(201);

        expect(component.canSend()).toBe(true);
      });

      it('is false while a send is in flight', () => {
        component.selectPartner(THEIR_TEAM);
        component.toggleOffered(101);
        component.sending.set(true);

        expect(component.canSend()).toBe(false);
      });
    });
  });

  describe('startCounter', () => {
    beforeEach(async () => {
      await init([tradeRow({ tradeid: 'in', playerids: [201, 101] })]);
    });

    it('mirrors the offer: what they asked for becomes what I put up', () => {
      component.startCounter(viewOf('in'));

      expect(component.builderOpen()).toBe(true);
      expect(component.partnerTeamId()).toBe(THEIR_TEAM);
      expect(component.counterOf()?.tradeid).toBe('in');
      expect(component.offeredPlayerIds()).toEqual([101]);
      expect(component.requestedPlayerIds()).toEqual([201]);
    });

    it('picks the other side as the partner when the offer was mine', async () => {
      await init([
        tradeRow({ tradeid: 'mine', fromteamid: MY_TEAM, toteamid: THEIR_TEAM }),
      ]);

      component.startCounter(viewOf('mine'));

      expect(component.partnerTeamId()).toBe(THEIR_TEAM);
    });
  });

  describe('send', () => {
    beforeEach(async () => {
      await init([tradeRow({ tradeid: 'in' })]);
    });

    it('refuses without a partner and says why', () => {
      component.send();

      expect(component.actionError()).toContain('Pick a team');
      expect(builder.connection.invocations).toHaveLength(0);
    });

    it('refuses an empty offer and says why', () => {
      component.selectPartner(THEIR_TEAM);

      component.send();

      expect(component.actionError()).toContain('at least one player');
      expect(builder.connection.invocations).toHaveLength(0);
    });

    it('proposes both sides in one flat id list', async () => {
      const connection = builder.connection;
      connection.setInvokeResult(
        HubMethods.Client.ProposeSeasonTrade,
        tradeRow({ tradeid: 'new-offer', fromteamid: MY_TEAM, toteamid: THEIR_TEAM }),
      );
      component.selectPartner(THEIR_TEAM);
      component.toggleOffered(101);
      component.toggleRequested(201);

      component.send();
      await vi.waitFor(() => expect(component.sending()).toBe(false));

      expect(connection.invocationOf(HubMethods.Client.ProposeSeasonTrade)?.args).toEqual([
        LEAGUE_ID,
        MY_TEAM,
        THEIR_TEAM,
        [101, 201],
      ]);
    });

    it('closes the builder, selects the new offer and switches to outgoing', async () => {
      builder.connection.setInvokeResult(
        HubMethods.Client.ProposeSeasonTrade,
        tradeRow({ tradeid: 'new-offer', fromteamid: MY_TEAM, toteamid: THEIR_TEAM }),
      );
      component.selectPartner(THEIR_TEAM);
      component.toggleOffered(101);

      component.send();
      await vi.waitFor(() => expect(component.sending()).toBe(false));

      expect(component.builderOpen()).toBe(false);
      expect(component.selectedTradeId()).toBe('new-offer');
      expect(component.filter()).toBe('outgoing');
    });

    it('surfaces a refusal and leaves the builder open to edit', async () => {
      builder.connection.setInvokeError(
        HubMethods.Client.ProposeSeasonTrade,
        new Error('player already traded'),
      );
      component.selectPartner(THEIR_TEAM);
      component.toggleOffered(101);
      component.builderOpen.set(true);

      component.send();
      await vi.waitFor(() => expect(component.sending()).toBe(false));

      expect(component.actionError()).toContain('player already traded');
      expect(component.builderOpen()).toBe(true);
    });

    describe('as a counter', () => {
      it('proposes first, then retires the offer it answers', async () => {
        const connection = builder.connection;
        connection.setInvokeResult(
          HubMethods.Client.ProposeSeasonTrade,
          tradeRow({ tradeid: 'counter', fromteamid: MY_TEAM, toteamid: THEIR_TEAM }),
        );
        connection.setInvokeResult(
          HubMethods.Client.RejectSeasonTrade,
          tradeRow({ tradeid: 'in', status: 'rejected' }),
        );
        component.startCounter(viewOf('in'));

        component.send();
        await vi.waitFor(() => expect(component.sending()).toBe(false));

        const order = connection.invocations.map((i) => i.method);
        // Order matters: a refused proposal must leave the original offer standing.
        expect(order).toEqual([
          HubMethods.Client.ProposeSeasonTrade,
          HubMethods.Client.RejectSeasonTrade,
        ]);
        expect(component.counterOf()).toBeNull();
      });

      it('leaves the original untouched when the counter is refused', async () => {
        builder.connection.setInvokeError(
          HubMethods.Client.ProposeSeasonTrade,
          new Error('refused'),
        );
        component.startCounter(viewOf('in'));

        component.send();
        await vi.waitFor(() => expect(component.sending()).toBe(false));

        expect(
          builder.connection.invocations.some(
            (i) => i.method === HubMethods.Client.RejectSeasonTrade,
          ),
        ).toBe(false);
        expect(component.trades().find((t) => t.tradeid === 'in')?.status).toBe('pending');
      });

      it('warns when the counter lands but the original cannot be closed', async () => {
        const connection = builder.connection;
        connection.setInvokeResult(
          HubMethods.Client.ProposeSeasonTrade,
          tradeRow({ tradeid: 'counter', fromteamid: MY_TEAM, toteamid: THEIR_TEAM }),
        );
        connection.setInvokeError(HubMethods.Client.RejectSeasonTrade, new Error('gone'));
        component.startCounter(viewOf('in'));

        component.send();
        await vi.waitFor(() => expect(component.sending()).toBe(false));

        expect(component.actionError()).toContain('could not be closed');
        // The counter itself is on the board, so the manager can still withdraw the old one.
        expect(component.trades().some((t) => t.tradeid === 'counter')).toBe(true);
      });
    });
  });

  describe('error messages from the hub', () => {
    beforeEach(async () => {
      await init([tradeRow({ tradeid: 'in' })]);
    });

    it('unwraps the ErrorMessage from the hub exception envelope', async () => {
      // SignalR wraps the filter's JSON in its own prose; only the real reason is worth showing.
      builder.connection.setInvokeError(
        HubMethods.Client.AcceptSeasonTrade,
        new Error(
          'An unexpected error occurred invoking AcceptSeasonTrade: {"ErrorMessage":"You already have the maximum number of centers","ErrorCode":409}',
        ),
      );

      component.accept(viewOf('in'));
      await vi.waitFor(() => expect(component.sending()).toBe(false));

      expect(component.actionError()).toBe('You already have the maximum number of centers');
    });

    it('falls back to the raw text when the payload is not our envelope', async () => {
      builder.connection.setInvokeError(
        HubMethods.Client.AcceptSeasonTrade,
        new Error('plain failure {not json}'),
      );

      component.accept(viewOf('in'));
      await vi.waitFor(() => expect(component.sending()).toBe(false));

      expect(component.actionError()).toContain('plain failure');
    });

    it('handles a non-Error rejection', async () => {
      builder.connection.setInvokeError(HubMethods.Client.AcceptSeasonTrade, 'just a string');

      component.accept(viewOf('in'));
      await vi.waitFor(() => expect(component.sending()).toBe(false));

      expect(component.actionError()).toBe('just a string');
    });

    it('falls back to a generic message for an empty rejection', async () => {
      builder.connection.setInvokeError(HubMethods.Client.AcceptSeasonTrade, new Error(''));

      component.accept(viewOf('in'));
      await vi.waitFor(() => expect(component.sending()).toBe(false));

      expect(component.actionError()).toContain('Something went wrong');
    });
  });

  describe('template helpers', () => {
    beforeEach(async () => {
      await init([tradeRow({ tradeid: 'in' })]);
    });

    it('teamName falls back to the id for a team it does not know', () => {
      expect(component.teamName(MY_TEAM)).toBe('My Team');
      expect(component.teamName(999)).toBe('Team 999');
    });

    it('playerLabel joins name and surname, falling back to the id', () => {
      expect(component.playerLabel(makePlayer({ name: 'LeBron', surname: 'James' }))).toBe(
        'LeBron James',
      );
      expect(
        component.playerLabel({ playerid: 7, name: '', surname: '' } as Player),
      ).toBe('#7');
    });

    it('positionLabel shows a dash rather than a blank cell', () => {
      expect(component.positionLabel(makePlayer({ position: 'G' }))).toBe('G');
      expect(component.positionLabel(makePlayer({ position: '  ' }))).toBe('—');
      expect(component.positionLabel(makePlayer({ position: null }))).toBe('—');
    });

    it('formatDate renders a dash rather than "Invalid Date"', () => {
      expect(component.formatDate(null)).toBe('—');
      expect(component.formatDate('')).toBe('—');
      expect(component.formatDate('not a date')).toBe('—');
      expect(component.formatDate('2026-09-01T10:00:00Z')).not.toBe('—');
    });

    it('statusLabel reads in the manager’s language', () => {
      expect(component.statusLabel(tradeRow({ status: 'pending' }))).toBe('Open');
      expect(component.statusLabel(tradeRow({ status: 'accepted' }))).toBe('Accepted');
      expect(component.statusLabel(tradeRow({ status: 'rejected' }))).toBe('Declined');
      // Superseded is a replacement, not a refusal — nobody declined it.
      expect(component.statusLabel(tradeRow({ status: 'superseded' }))).toBe('Replaced');
    });

    it('statusLabel passes an unknown status through', () => {
      expect(component.statusLabel(tradeRow({ status: 'weird' as never }))).toBe('weird');
    });
  });

  describe('live updates', () => {
    it('shows an offer pushed over the hub', async () => {
      await init([]);
      const connection = await hubReady();

      connection.emit(HubMethods.Server.ReceiveTradeRequest, {
        tradeId: 'pushed',
        fromTeam: THEIR_TEAM,
        toTeam: MY_TEAM,
        playersIds: [201],
        tradeDate: '2026-09-01T12:00:00Z',
      });

      expect(component.trades()).toHaveLength(1);
      expect(component.incomingCount()).toBe(1);
    });

    it('exposes the hub connection state for the live/offline badge', async () => {
      await init([]);

      expect(component.connected()).toBe(true);
    });
  });
});

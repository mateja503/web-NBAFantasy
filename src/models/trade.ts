/**
 * A trade row as returned by GET /v1/trades and by the TradeHub's Propose/Accept/Reject
 * methods. Mirrors the API's TradeDto one for one (all-lowercase names, because the DTO
 * mirrors the nba.trades column casing).
 *
 * `tradeid` is a UUID string, not a surrogate number: nba.trades.tradeid is itself the UUID
 * primary key, and the same id travels in the Redis copy and over SignalR. It is the only id
 * a trade has, and the one every call quotes back.
 */
export interface Trade {
  tradeid: string;
  leagueid: number;
  fromteamid: number;
  toteamid: number;
  /** Both sides of the offer in one flat list — the proposer's players and the ones asked for. */
  playerids: number[];
  status: TradeStatus;
  tscreated: string;
  /**
   * When the Redis hot copy lapses. The offer itself stays open past this — it only ends the
   * real-time push window, so an expired timestamp is not a closed trade.
   */
  tsexpires: string;
}

/**
 * The vocabulary of nba.trades.status.
 * - `pending`    — live offer, awaiting a response
 * - `superseded` — replaced by a newer offer from the same team to the same team
 * - `accepted`   — executed; the rosters have already swapped
 * - `rejected`   — declined outright, or retired by the counter-offer that answered it
 */
export type TradeStatus = 'pending' | 'superseded' | 'accepted' | 'rejected';

/** Only a pending trade can still be acted on; the rest are history. */
export const isOpenTrade = (trade: Trade): boolean => trade.status === 'pending';

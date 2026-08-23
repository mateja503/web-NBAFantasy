/**
 * A trade row as returned by GET /v1/trades and by the TradeHub's Propose/Accept/Reject
 * methods. Mirrors the API's TradeDto one for one (all-lowercase names, because the DTO
 * mirrors the nba.trades column casing).
 *
 * `tradeguid` — not `tradeid` — is the id every other call quotes back: it is the id that
 * also travels over SignalR, while `tradeid` is a database surrogate.
 */
export interface Trade {
  tradeid: number;
  tradeguid: string;
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

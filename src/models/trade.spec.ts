import { Trade, isOpenTrade } from './trade';

describe('isOpenTrade', () => {
  const trade = (status: Trade['status']): Trade => ({
    tradeid: '11111111-1111-1111-1111-111111111111',
    leagueid: 9,
    fromteamid: 3,
    toteamid: 4,
    playerids: [1000],
    status,
    tscreated: '2026-09-01T10:00:00Z',
    tsexpires: '2026-09-02T10:00:00Z',
  });

  it('treats a pending trade as open', () => {
    expect(isOpenTrade(trade('pending'))).toBe(true);
  });

  it.each(['superseded', 'accepted', 'rejected'] as const)('treats %s as closed', (status) => {
    expect(isOpenTrade(trade(status))).toBe(false);
  });

  it('ignores tsexpires — an expired push window is not a closed trade', () => {
    // tsexpires only ends the Redis/SignalR hot copy; the offer itself stays actionable.
    const expired = { ...trade('pending'), tsexpires: '2020-01-01T00:00:00Z' };

    expect(isOpenTrade(expired)).toBe(true);
  });
});

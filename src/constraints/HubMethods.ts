export const HubMethods = {
    // Methods the Server calls on the Client
    Server: {
        ReceiveMessage: 'ReceiveMessage',
        UpdateDraftState: 'UpdateDraftState',
        ReceiveTradeRequest: 'ReceiveTradeRequest',
        // The backlog handed to a client on connect: every offer already waiting for its team.
        // Separate from ReceiveTradeRequest so "here is what you missed" can be told apart from
        // "an offer just arrived".
        ReceiveTradeRequests: 'ReceiveTradeRequests',
        ReceiveTradeAccepted: 'ReceiveTradeAccepted',
        ReceiveTradeRejected: 'ReceiveTradeRejected',
        // The proposer replaced an offer with a newer one to the same team. Not a rejection —
        // nobody declined it — so the board says "replaced", not "declined".
        ReceiveTradeSuperseded: 'ReceiveTradeSuperseded',
    },
    // Methods the Client calls on the Server
    Client: {
        SendMessage: 'SendMessage',
        ResetTimer: 'ResetTimer',
        DraftPlayer: 'DraftPlayer',
        // Trades, validated against the Postgres rosters. Trading during the draft was removed, so
        // this is the only trade flow: there is no draft-time pair reading the Redis draft state.
        ProposeSeasonTrade: 'ProposeSeasonTrade',
        AcceptSeasonTrade: 'AcceptSeasonTrade',
        RejectSeasonTrade: 'RejectSeasonTrade',
    }

}

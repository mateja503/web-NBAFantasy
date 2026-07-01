export const HubMethods = {
    // Methods the Server calls on the Client
    Server: {
        ReceiveMessage: 'ReceiveMessage',
        UpdateDraftState: 'UpdateDraftState',
        ReceiveTradeRequest: 'ReceiveTradeRequest',
        ReceiveTradeAccepted: 'ReceiveTradeAccepted',
    },
    // Methods the Client calls on the Server
    Client: {
        SendMessage: 'SendMessage',
        ResetTimer: 'ResetTimer',
        DraftPlayer: 'DraftPlayer',
        ProposeTrade: 'ProposeTrade',
        AcceptTrade: 'AcceptTrade',
    }

}
import * as signalR from '@microsoft/signalr';
import { ChangeDetectorRef, Component, inject, model, Signal, signal, } from '@angular/core';
import { Injectable, } from '@angular/core';
import { HubMethods } from '../../constraints/HubMethods';
import { Hubservice } from './hubservice';

// Keep only the most recent messages in memory. An unbounded array grows
// memory and render cost without limit in a long-running room; capping it is a
// cheap client-side guard (server-side history/pagination is the full fix).
const MAX_MESSAGES = 200;

@Injectable({ providedIn: 'root' })
export class ChatHub extends Hubservice {
    public messages = signal<{user:string,text:string}[]>([])
    protected override hubUrl = 'chatHub';
    protected override retryTime = 3000;

    public addMessageListener = () => {
        this.hubConnection.on(HubMethods.Server.ReceiveMessage, (user: string, message: string) => {
            this.messages.update(prev => [...prev, { user, text: message }].slice(-MAX_MESSAGES));
        });
    }

    public sendMessage = (user: string, message: string) => {
        this.hubConnection.invoke(HubMethods.Client.SendMessage, user, message)
            .catch(err => console.error(err));
    }

}
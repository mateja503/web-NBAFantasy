import * as signalR from '@microsoft/signalr';
import { ChangeDetectorRef, Component, inject, model, Signal, signal, } from '@angular/core';
import { Injectable, } from '@angular/core';
import { HubMethods } from '../../constraints/HubMethods';
import { Hubservice } from './hubservice';

@Injectable({ providedIn: 'root' })
export class ChatHub extends Hubservice {
    public messages = signal<{user:string,text:string}[]>([])
    protected override hubUrl = 'chatHub';
    protected override retryTime = 3000;

    public addMessageListener = () => {
        this.hubConnection.on(HubMethods.Server.ReceiveMessage, (user: string, message: string) => {
            console.log(`User: ${user}, Message: ${message}`);
            this.messages.update(prev => [...prev, { user, text: message }]);
        });
    }

    public sendMessage = (user: string, message: string) => {
        this.hubConnection.invoke(HubMethods.Client.SendMessage, user, message)
            .catch(err => console.error(err));
    }

}
import * as signalR from '@microsoft/signalr';
import { ChangeDetectorRef, Component, inject, model, Signal, signal, } from '@angular/core';
import { Injectable, } from '@angular/core';
import { HubMethods } from '../constraints/HubMethods';

@Injectable({ providedIn: 'root' })
export class ChatHub {
    public isConnected = signal<boolean>(false);
    public messages = signal<{user:string,text:string}[]>([])
    private hubConnection!: signalR.HubConnection;

    public startConnection = () => {
        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl('https://localhost:7041/chatHub')
            .withAutomaticReconnect()
            .build()

        this.hubConnection
            .start()
            .then(() => {
                console.log('Connection started')
                this.isConnected.set(true)
            })
            .catch((err: any) => {
                console.log('Error while starting connections: ' + err)
                this.isConnected.set(false)
            })
    }

    public handleDisconnects = () => {
        this.hubConnection.onclose(() => {
            console.log('Connection lost. Attempting to reconnect...');
            setTimeout(() => this.startConnection(), 3000);  // Try reconnecting after 3 seconds
        });
    }

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
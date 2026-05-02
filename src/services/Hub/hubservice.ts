import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ChangeDetectorRef, Component, inject, model, Signal, signal, } from '@angular/core';
import { HubMethods } from '../../constraints/HubMethods';


@Injectable({
  providedIn: 'root',
})
export abstract class Hubservice {
  protected isConnected = signal<boolean>(false);
  protected hubConnection!: signalR.HubConnection;

  protected abstract hubUrl: string;
  protected abstract readonly retryTime: number;
  

  public startConnection = (params?: {[key:string]:string | number}) => {
    let url =`https://localhost:7041/${this.hubUrl}`;

    if(params){
      const queryParams = new URLSearchParams();
      for(const key in params){
        queryParams.append(key, params[key].toString());
      }
      url += `?${queryParams.toString()}`;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(url)
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
      console.log(`Connection lost for hub ${this.hubUrl}. Attempting to reconnect...`);
      setTimeout(() => this.startConnection(), this.retryTime);  // Try reconnecting after 3 seconds
    });
  }

}

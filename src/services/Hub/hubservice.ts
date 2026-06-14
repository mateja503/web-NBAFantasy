import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { ChangeDetectorRef, Component, inject, model, Signal, signal, } from '@angular/core';
import { HubMethods } from '../../constraints/HubMethods';
import { ConfigService } from '../../app/core/config/config.service';


@Injectable({
  providedIn: 'root',
})
export abstract class Hubservice {
  protected isConnected = signal<boolean>(false);
  protected hubConnection!: signalR.HubConnection;

  protected abstract hubUrl: string;
  protected abstract readonly retryTime: number;

  protected config = inject(ConfigService);

  public startConnection = (params?: {[key:string]:string | number}): Promise<void> => {
    let url =`${this.config.apiBaseUrl}/${this.hubUrl}`;

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

    return this.hubConnection
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

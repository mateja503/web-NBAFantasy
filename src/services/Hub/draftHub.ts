import * as signalR from '@microsoft/signalr';
import { signal, } from '@angular/core';
import { Injectable, } from '@angular/core';
import { HubMethods } from '../../constraints/HubMethods';
import { Hubservice } from './hubservice';


interface DraftState {
  leagueName: string;
  pickEndTime: string;
  isPaused: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DraftHub extends Hubservice {
  protected override hubUrl = 'draftHub'; 
  protected override retryTime = 1000;

  leagueName = signal<string>('Loading...');
  displayTime = signal<string>('00:00');
  private endTime: number | null = null;

  constructor() {
    super();
    setInterval(() => this.calculateTime(), 1000)
  }

  public initialize(leagueId: number) {
    this.startConnection({leagueId});
    this.updateDraftState();
  }


  private calculateTime() {
    if (!this.endTime) return;
    const now = new Date().getTime();
    const diff = this.endTime - now;

    if (diff <= 0) {
      this.displayTime.set('00:00');
      return;
    }
 
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    this.displayTime.set(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  }

  public updateDraftState() {
    this.hubConnection.on(HubMethods.Server.UpdateDraftState, (data: DraftState) => {
      console.log(`League: ${data.leagueName}, EndTime: ${data.pickEndTime}, IsPaused: ${data.isPaused}`);
      this.leagueName.set(data.leagueName);
      this.endTime = new Date(data.pickEndTime).getTime();
    });
  }

  public resetTimer = (leagueId: number) => {
    this.hubConnection.invoke(HubMethods.Client.ResetTimer,leagueId)
    .then((data: DraftState) => {
      console.log('Reset command successfully sent to server');
      console.log(`Timer Reset - League: ${data.leagueName}, EndTime: ${data.pickEndTime}, IsPaused: ${data.isPaused}`);
    })
    .catch((err: any) => {
      console.error('Error while invoking ResetTimer: ' + err);
    });
  }

}

import { computed, signal, } from '@angular/core';
import { Injectable, } from '@angular/core';
import { HubMethods } from '../../constraints/HubMethods';
import { Hubservice } from './hubservice';

export enum DraftStatus{
  Initial = 0,
  DraftStarted = 1,
  Paused = 2,
  DraftEnded = 3,
  DraftCompleted = 4
}

export interface TeamDraftBoard {
  teamId: number;
  teamName: string;
  pick: number;

}

export interface DraftPlayer {
  playerId: number;
  fullName: string;
  position: string;
}

interface DraftBoardTeams {
  currentRound: number;
  onTheClockTeam: TeamDraftBoard | null;
  draftOrder: TeamDraftBoard[] | null;
}

// Mirrors the server's DraftState. The nullable members are nullable on the server too: once the draft
// is over there is no board and no team on the clock.
interface DraftState {
  leagueName: string | null;
  pickEndTime: string;
  draftStatus: DraftStatus;
  draftBoardTeams: DraftBoardTeams | null;
  draftPlayers: DraftPlayer[] | null;
  draftedPlayersPerTeam: Record<number, DraftPlayer[]> | null;
}

@Injectable({
  providedIn: 'root',
})
export class DraftHub extends Hubservice {
  protected override hubUrl = 'draftHub';
  protected override retryTime = 1000;
 

  leagueName = signal<string>('Loading...');
  displayTime = signal<string>('00:00');
  round = signal<number>(1);
  draftStatus = signal<DraftStatus>(DraftStatus.Initial);
  teamsDraftedPlayers = signal<Record<number, DraftPlayer[]>>({});
  teamOnTheClock = signal<TeamDraftBoard | null>(null)
  draftTeams = signal<TeamDraftBoard[]>([])
  draftPlayers = signal<DraftPlayer[]>([])
  // DraftCompleted counts too — a league whose draft finished in an earlier session reports 4, not 3.
  isDraftOver = computed(() =>
    this.draftStatus() === DraftStatus.DraftEnded || this.draftStatus() === DraftStatus.DraftCompleted);
  private endTime: number | null = null;

  constructor() {
    super();
    setInterval(() => this.calculateTime(), 1000)
  }

  public initialize(leagueId: number) {
    this.startConnection({ leagueId }).then(() => {
      this.updateDraftState();
    });
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

  private handleDraftState(data: DraftState) {
    if(data.leagueName !== null && data.leagueName !== undefined){
      this.leagueName.set(data.leagueName);
    }

    // Set the status first so the "Draft Ended" overlay still shows even if a later line throws.
    this.draftStatus.set(data.draftStatus);

    this.endTime = new Date(data.pickEndTime).getTime();

    const board = data.draftBoardTeams;
    if (board) {
      this.round.set(board.currentRound);
      this.teamOnTheClock.set(board.onTheClockTeam);
      this.draftTeams.set(board.draftOrder ?? []);
    } else {
      // The draft is over: clear the last team off the board instead of leaving it on the clock.
      this.teamOnTheClock.set(null);
      this.draftTeams.set([]);
    }

    this.draftPlayers.set(data.draftPlayers ?? []);
    this.teamsDraftedPlayers.set(data.draftedPlayersPerTeam ?? {});
  }

  public updateDraftState() {
    this.hubConnection.on(HubMethods.Server.UpdateDraftState, (data: DraftState) => {
      this.handleDraftState(data);
    });
  }

  public resetTimer = (leagueId: number) => {
    this.hubConnection.invoke(HubMethods.Client.ResetTimer, leagueId)
      .then((data: DraftState) => {
        console.log('Reset command successfully sent to server');
        console.log(`Timer Reset - League: ${data.leagueName}, EndTime: ${data.pickEndTime}, DraftStatus: ${DraftStatus[data.draftStatus] }`);
        // console.log(`Draft State - Round: ${data}, DraftEnded: ${data.isDraftEnded}`);
      })
      .catch((err: any) => {
        console.error('Error while invoking ResetTimer: ' + err);
      });
  }

  public draftPlayer = ( leagueId: number,playerId: number, pick: number) => {
    this.hubConnection.invoke(HubMethods.Client.DraftPlayer,leagueId, playerId, pick)
      .then(() => {
        // The hub method returns nothing — the resulting state arrives on the UpdateDraftState
        // broadcast. Feeding the undefined result into handleDraftState threw on every pick.
        console.log('Draft player command successfully sent to server');
      })
      .catch((err: any) => {
        console.error('Error while invoking DraftPlayer: ' + err);
      });
  }
}

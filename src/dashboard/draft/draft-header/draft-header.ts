import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { DraftHub } from '../../../services/Hub/draftHub';
import { DraftService,DraftRequest } from '../../../services/draft-service';
import { OutletContext } from '@angular/router';
import { GlobalStore } from '../../../store/globalStore';
import { SharedModule } from '../../../app/app.module';

@Component({
  selector: 'app-draft-header',
  imports: [SharedModule],
  templateUrl: './draft-header.html',
  styleUrl: './draft-header.scss',
})
export class DraftHeader {

  public draftHub = inject(DraftHub);
  private draftService = inject(DraftService);
  private globalStore = inject(GlobalStore);
  public readonly leagueId = this.globalStore.selectedLeagueId() ?? 0;

  @Output() onResetTimer = new EventEmitter<void>();
  @Input() draftStarted: boolean = false;

  startDraft(){
    console.log('Starting draft...')
    const request: DraftRequest = { leagueId: this.leagueId }; 
      this.draftService.startDraft(request).subscribe({
        next: (response) => {
          console.log('Draft started successfully', response);
        },
        error: (error) => {
          console.error('Error starting draft', error);
        }
      })
  }

  endDraft(){
    console.log('Ending draft...')
    const request: DraftRequest = { leagueId: this.leagueId };
      this.draftService.endDraft(request).subscribe({
        next: (response) => {
          console.log('Draft ended successfully', response);
        },
        error: (error) => {
          console.error('Error ending draft', error);
        }
      })
     console.log('Draft state', this.draftHub.draftStatus());
  }

  resetTimer(){
    this.onResetTimer.emit();
  }


}

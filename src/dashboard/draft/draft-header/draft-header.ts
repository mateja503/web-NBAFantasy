import { Component, inject, Input } from '@angular/core';
import { DraftHub } from '../../../services/Hub/draftHub';
import { Button } from '../../../components/button/button';
import { DraftService,DraftRequest } from '../../../services/draft-service';

@Component({
  selector: 'app-draft-header',
  imports: [Button],
  templateUrl: './draft-header.html',
  styleUrl: './draft-header.scss',
})
export class DraftHeader {

  public draftHub = inject(DraftHub);
  private draftService = inject(DraftService);


  startDraft(){
    console.log('Starting draft...')
    const request: DraftRequest = { leagueId: 1 }; // Now typed!
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
    const request: DraftRequest = { leagueId: 1 }; // Now typed!
      this.draftService.endDraft(request).subscribe({
        next: (response) => {
          console.log('Draft ended successfully', response);
        },
        error: (error) => {
          console.error('Error ending draft', error);
        }
      })
  }


}

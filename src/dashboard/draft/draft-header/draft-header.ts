import { Component, inject, Input } from '@angular/core';
import { DraftHub } from '../../../services/Hub/draftHub';
import { Button } from '../../../components/button/button';
import { DraftService } from '../../../services/draft-service';

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
      this.draftService.startDraft({leagueId: 1}).subscribe({
        next: (response) => {
          console.log('Draft started successfully', response);
        },
        error: (error) => {
          console.error('Error starting draft', error);
        }
      })
  }


}

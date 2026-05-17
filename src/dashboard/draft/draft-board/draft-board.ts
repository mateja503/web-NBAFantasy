import { Component, Input } from '@angular/core';
import { TeamDraftBoard } from '../../../services/Hub/draftHub';

@Component({
  selector: 'app-draft-board',
  imports: [],
  templateUrl: './draft-board.html',
  styleUrl: './draft-board.scss',
})
export class DraftBoard {

  @Input() round: number | null = null;
  @Input() onTheClock: TeamDraftBoard | null = null;
  @Input() draftOrder: TeamDraftBoard[] = [];
}

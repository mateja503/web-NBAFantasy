import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-draft-board',
  imports: [],
  templateUrl: './draft-board.html',
  styleUrl: './draft-board.scss',
})
export class DraftBoard {

  @Input() round: number | null = null;
}

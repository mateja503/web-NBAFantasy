import { Component, inject, Input } from '@angular/core';
import { DraftHub } from '../../../services/Hub/draftHub';

@Component({
  selector: 'app-draft-header',
  imports: [],
  templateUrl: './draft-header.html',
  styleUrl: './draft-header.scss',
})
export class DraftHeader {

  public draftHub = inject(DraftHub);



}

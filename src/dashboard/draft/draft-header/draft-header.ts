import { Component, inject, Input } from '@angular/core';
import { DraftHub } from '../../../services/Hub/draftHub';
import { Button } from '../../../components/button/button';

@Component({
  selector: 'app-draft-header',
  imports: [Button],
  templateUrl: './draft-header.html',
  styleUrl: './draft-header.scss',
})
export class DraftHeader {

  public draftHub = inject(DraftHub);



}

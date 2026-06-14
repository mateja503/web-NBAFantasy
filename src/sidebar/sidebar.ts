import { Component } from '@angular/core';
import {MatAccordion} from '@angular/material/expansion';
import { SharedModule } from '../app/app.module';
@Component({
  selector: 'app-sidebar',
  imports: [SharedModule, MatAccordion],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  isLeagueMenuOpen = false;

  toggleLeagueMenu() {
    this.isLeagueMenuOpen = !this.isLeagueMenuOpen;
  }
}

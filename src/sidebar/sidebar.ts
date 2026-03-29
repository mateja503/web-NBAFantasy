import { Component } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon'; 
import { RouterModule } from '@angular/router';
import {MatAccordion} from '@angular/material/expansion';
import { MatExpansionModule } from '@angular/material/expansion';
@Component({
  selector: 'app-sidebar',
  imports: [MatSidenavModule, MatIconModule, RouterModule, MatAccordion,MatExpansionModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  isLeagueMenuOpen = false;

  toggleLeagueMenu() {
    this.isLeagueMenuOpen = !this.isLeagueMenuOpen;
  }
}

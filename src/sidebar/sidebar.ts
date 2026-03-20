import { Component } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon'; 
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-sidebar',
  imports: [MatSidenavModule, MatIconModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {

}

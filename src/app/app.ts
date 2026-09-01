import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SharedModule } from './app.module';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';

/**
 * The application shell: header, sidebar and the routed outlet.
 *
 * It deliberately holds no state. An earlier version injected LeagueService and kept a
 * `leagues` signal, but the fetch that filled it had been commented out — leaving a
 * subscription list, an OnInit and an OnDestroy that could never do anything. Feature data
 * belongs to the feature routes, not the shell.
 */
@Component({
  selector: 'app-root',
  imports: [SharedModule, RouterOutlet, Header, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}

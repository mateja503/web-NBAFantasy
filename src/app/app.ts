import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Layout } from '../layout/layout';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Layout, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('web-NBAFantasy');
}

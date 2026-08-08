import { Component } from '@angular/core';
import { ImagePlaceholder } from '../../components/image-placeholder/image-placeholder';
import { Button } from '../../components/button/button';

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  image: string;
  imageLabel: string;
  tags: string[];
}

interface Shot {
  image: string;
  label: string;
  caption: string;
}

@Component({
  selector: 'app-home',
  imports: [ImagePlaceholder, Button],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly email = 'matejanikolikj503@gmail.com';

  protected readonly features: FeatureCard[] = [
    {
      icon: 'lightning-charge',
      title: 'Live Draft Room',
      description:
        'A real-time snake draft over WebSockets. Every connected manager sees the pick clock, the board and the roster update at the same moment, and the room survives refreshes and reconnects.',
      image: 'images/home/feature-draft.png',
      imageLabel: 'Draft room screenshot',
      tags: ['SignalR', 'Signals', 'Live timer'],
    },
    {
      icon: 'arrow-left-right',
      title: 'Trade Hub',
      description:
        'Build a trade package from both rosters, propose it and track its status. Offered and requested players are validated before anything is sent to the backend.',
      image: 'images/home/feature-trade.png',
      imageLabel: 'Trade hub screenshot',
      tags: ['REST', 'Forms', 'Validation'],
    },
    {
      icon: 'people',
      title: 'Teams & Leagues',
      description:
        'Create a league, invite friends, join with a code and manage your roster. Per-manager team stats are aggregated from every player on the roster.',
      image: 'images/home/feature-leagues.png',
      imageLabel: 'Teams & leagues screenshot',
      tags: ['CRUD', 'Guards', 'Pagination'],
    },
    {
      icon: 'chat-dots',
      title: 'League Chat',
      description:
        'A persistent chat room per league on a second WebSocket hub, with a capped in-memory message buffer so the tab stays fast during a long draft night.',
      image: 'images/home/feature-chat.png',
      imageLabel: 'Chat room screenshot',
      tags: ['SignalR', 'Reconnect', 'Buffering'],
    },
  ];

  protected readonly shots: Shot[] = [
    {
      image: 'images/home/shot-dashboard.png',
      label: 'Dashboard',
      caption: 'My teams & leagues',
    },
    { image: 'images/home/shot-draft-board.png', label: 'Draft board', caption: 'Pick-by-pick board' },
    { image: 'images/home/shot-roster.png', label: 'Roster', caption: 'Team stats breakdown' },
  ];

  protected scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

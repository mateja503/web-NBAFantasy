import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DashboardItem {
  id: string;
  name: string;
  type: 'team' | 'league';
  avatar: string;
  meta: string; // e.g., "12 Members" or "Rank #3"
  status: string; // e.g., "Drafting Tomorrow", "Active"
}

@Component({
  selector: 'app-my-teams-and-leagues',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-teams-and-leagues.html',
  styleUrl: './my-teams-and-leagues.scss',
})
export class MyTeamsAndLeagues {
  // Using Signals for reactive state management
  currentFilter = signal<'all' | 'team' | 'league'>('all');
  selectedId = signal<string | null>(null);

  items = signal<DashboardItem[]>([
    { id: 't1', name: 'Apex Predators', type: 'team', avatar: '🦁', meta: 'Rank #2 • 8-3', status: 'Waivers Open' },
    { id: 't2', name: 'Gotham Knights', type: 'team', avatar: '🦇', meta: 'Rank #5 • 6-5', status: 'Trade Pending' },
    { id: 'l1', name: 'Champions League 2026', type: 'league', avatar: '🏆', meta: '12 Managers', status: 'Drafting Tonight' },
    { id: 'p2', name: 'The Gridiron Dynasty', type: 'league', avatar: '🏈', meta: '10 Managers', status: 'Mid-Season' },
    { id: 'g2', name: 'The Gridiron Dynasty', type: 'league', avatar: '🏈', meta: '10 Managers', status: 'Mid-Season' },
    { id: 'h2', name: 'The Gridiron Dynasty', type: 'league', avatar: '🏈', meta: '10 Managers', status: 'Mid-Season' },
    { id: 'j2', name: 'The Gridiron Dynasty', type: 'league', avatar: '🏈', meta: '10 Managers', status: 'Mid-Season' },
    { id: 'k2', name: 'The Gridiron Dynasty', type: 'league', avatar: '🏈', meta: '10 Managers', status: 'Mid-Season' },
    { id: 'q2', name: 'The Gridiron Dynasty', type: 'league', avatar: '🏈', meta: '10 Managers', status: 'Mid-Season' },
    { id: 'w2', name: 'The Gridiron Dynasty', type: 'league', avatar: '🏈', meta: '10 Managers', status: 'Mid-Season' },
    { id: 'e2', name: 'The Gridiron Dynasty', type: 'league', avatar: '🏈', meta: '10 Managers', status: 'Mid-Season' },
    { id: 'r2', name: 'The Gridiron Dynasty', type: 'league', avatar: '🏈', meta: '10 Managers', status: 'Mid-Season' },
    { id: 's2', name: 'The Gridiron Dynasty', type: 'league', avatar: '🏈', meta: '10 Managers', status: 'Mid-Season' },
    { id: 'y2', name: 'The Gridiron Dynasty', type: 'league', avatar: '🏈', meta: '10 Managers', status: 'Mid-Season' },
    { id: 'u2', name: 'The Gridiron Dynasty', type: 'league', avatar: '🏈', meta: '10 Managers', status: 'Mid-Season' },
    { id: 'i2', name: 'The Gridiron Dynasty', type: 'league', avatar: '🏈', meta: '10 Managers', status: 'Mid-Season' },
    { id: 'o2', name: 'The Gridiron Dynasty', type: 'league', avatar: '🏈', meta: '10 Managers', status: 'Mid-Season' },
    { id: 'a2', name: 'The Gridiron Dynasty', type: 'league', avatar: '🏈', meta: '10 Managers', status: 'Mid-Season' },
  ]);

  // Computed signal to handle real-time filtering smoothly
  filteredItems = computed(() => {
    const filter = this.currentFilter();
    const allItems = this.items();
    if (filter === 'all') return allItems;
    return allItems.filter(item => item.type === filter);
  });

  setFilter(filter: 'all' | 'team' | 'league') {
    this.currentFilter.set(filter);
  }

  selectItem(id: string) {
    this.selectedId.set(id);
    console.log(`Selected item ID: ${id}. Ready for action!`);
  }
}
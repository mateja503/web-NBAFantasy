import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalStore } from '../../store/globalStore';

interface DashboardItem {
  id: number;
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
  selectedId = signal<number | null>(null);

  readonly globalStore = inject(GlobalStore)

  readonly items = computed(() => {
    const teams = this.globalStore.managedTeams();
    const leagues = this.globalStore.commissionerLeagues();
    
    const realTeams = teams.map(t => ({
      id: t.teamId,
      name: t.name,
      type: 'team',
      avatar: '🦁', // Default team avatar
      meta: 'Some info', // You can dynamically change this later
      status: 'Status of the team', // You can dynamically change this later
    }));

    const realLeagues = leagues.map(l => ({
      id: l.leagueId,
      name: l.name,
      type: 'league',
      avatar: '🏆', // Default league avatar
      meta: 'Some info', // You can dynamically change this later
      status: 'Status of the league', // You can dynamically change this later
    }))

    return [ ...realLeagues, ...realTeams,];
   
  });


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

  selectItem(id: number, type: string) {
    this.selectedId.set(id);
    console.log(`Selected item ID: ${id}. Ready for action!`);
    if (type === 'team') {
      this.globalStore.selectTeam(id);
    } else if (type === 'league') {
      this.globalStore.selectLeague(id);
    }
  }
}
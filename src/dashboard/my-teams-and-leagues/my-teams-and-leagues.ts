import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalStore } from '../../store/globalStore';
import { Button } from '../../components/button/button';

interface DashboardItem {
  id: number;
  name: string;
  type: string | 'team' | 'league';
  competesInLeagueId?: number;
  competesInLeagueName?: string;
  commissionersTeamId?: number;
  commissionersTeamName?: string;
  avatar: string;
  meta: string; // e.g., "12 Members" or "Rank #3"
  status: string; // e.g., "Drafting Tomorrow", "Active"
}

@Component({
  selector: 'app-my-teams-and-leagues',
  standalone: true,
  imports: [CommonModule, Button],
  templateUrl: './my-teams-and-leagues.html',
  styleUrl: './my-teams-and-leagues.scss',
})
export class MyTeamsAndLeagues implements OnInit {
  currentFilter = signal<'all' | 'team' | 'league'>('all');
  selectedItem = signal<DashboardItem | null>(null);

  readonly globalStore = inject(GlobalStore);


  readonly items = computed(() => {
    const teams = this.globalStore.managedTeams();
    const leagues = this.globalStore.commissionerLeagues();

    const realTeams = teams.map(t => ({
      id: t.teamId,
      name: t.name,
      competesInLeagueId: t.competesInLeagueId,
      competesInLeagueName: t.competesInLeagueName,
      commissionersTeamId: 0, // Teams don't have a commissioner team ID
      commissionersTeamName: '',
      type: 'team',
      avatar: '🦁', // Default team avatar
      meta: 'Some info', // You can dynamically change this later
      status: 'Status of the team', // You can dynamically change this later
    }));

    const realLeagues = leagues.map(l => ({
      id: l.leagueId,
      name: l.name,
      competesInLeagueId: 0,
      competesInLeagueName: '',
      commissionersTeamId: l.commissionersTeamId,
      commissionersTeamName: l.commissionersTeamName,
      type: 'league',
      avatar: '🏆', // Default league avatar
      meta: 'Some info', // You can dynamically change this later
      status: 'Status of the league', // You can dynamically change this later
    }))
    return [...realLeagues, ...realTeams];

  });

  ngOnInit(): void {
    const selectedTeamId = this.globalStore.selectedTeamId();
    const selectedLeagueId = this.globalStore.selectedLeagueId();

    const preSelectedItem = this.items().find(item => {
      if (item.type === 'team' && item.id === selectedTeamId) return true;
      if (item.type === 'league' && item.id === selectedLeagueId) return true;
      return false;
    });

    if (preSelectedItem) {
      this.selectedItem.set(preSelectedItem);
    }
  }




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

  selectItem(item: DashboardItem) {
    this.selectedItem.set(item);
    console.log(`UI highlighted item ID: ${item.id}`);
  }

  confirmAndSaveToLocalStorage() {
    const id = this.selectedItem()?.id || 0;
    const name = this.selectedItem()?.name || '';
    const type = this.selectedItem()?.type;
    const competesInLeagueId = this.selectedItem()?.competesInLeagueId;
    const competesInLeagueName = this.selectedItem()?.competesInLeagueName;
    const commissionersTeamId = this.selectedItem()?.commissionersTeamId;
    const commissionersTeamName = this.selectedItem()?.commissionersTeamName;


    console.log(`Selected item ID: ${id}. Ready for action!`);
    if (type === 'team') {
      this.globalStore.selectTeamsLeague(competesInLeagueId!, competesInLeagueName!);
      this.globalStore.selectTeam(id, name);
    } else if (type === 'league') {
      this.globalStore.selectCommissionersTeam(commissionersTeamId!, commissionersTeamName!);
      this.globalStore.selectLeague(id, name);
    }

    alert(`Selected ${type}: ${name} (ID: ${id}) has been saved!`);
  }
}
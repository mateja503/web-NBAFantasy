import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../../models/player';

/**
 * The one stat table for a list of players. Both the Players page and a team's roster
 * render the same PlayerDto rows, so the markup lives here once and the pages only decide
 * which rows to feed it and whether the fantasy-team column is relevant.
 *
 * Purely presentational — no fetching, no paging. The parent owns the data.
 */
@Component({
  selector: 'app-player-table-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-table-view.html',
  styleUrl: './player-table-view.scss',
})
export class PlayerTableView {
  readonly players = input.required<Player[]>();

  /** The fantasy-team column only means something where a league is in scope. */
  readonly showTeamColumn = input(false);

  /** Dims the rows and floats a spinner over them, so paging keeps the old rows visible. */
  readonly loading = input(false);

  /** Row numbers continue across pages, so the parent says where this page starts. */
  readonly firstRowNumber = input(1);

  readonly emptyMessage = input('No players to show.');

  // Kept in step with the template's header cells: the empty row has to span the lot.
  private readonly baseColumnCount = 19;
  readonly columnCount = computed(() => this.baseColumnCount + (this.showTeamColumn() ? 1 : 0));
}

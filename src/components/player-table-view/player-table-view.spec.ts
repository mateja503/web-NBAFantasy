import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerTableView } from './player-table-view';
import { Player } from '../../models/player';
import { makePlayer } from '../../testing/fixtures';

describe('PlayerTableView', () => {
  let fixture: ComponentFixture<PlayerTableView>;

  function render(players: Player[], inputs: Record<string, unknown> = {}) {
    fixture = TestBed.createComponent(PlayerTableView);
    fixture.componentRef.setInput('players', players);
    for (const [key, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(key, value);
    }
    fixture.detectChanges();
    return fixture;
  }

  const headerCells = () => Array.from(fixture.nativeElement.querySelectorAll('thead th'));
  const bodyRows = () => Array.from(fixture.nativeElement.querySelectorAll('tbody tr'));
  const cellsOfRow = (i: number) =>
    Array.from((bodyRows()[i] as HTMLElement).querySelectorAll('td')).map((c) =>
      (c as HTMLElement).textContent?.trim(),
    );

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PlayerTableView] }).compileComponents();
  });

  describe('columnCount', () => {
    it('is 18 without the fantasy-team column', () => {
      render([]);

      expect(fixture.componentInstance.columnCount()).toBe(18);
    });

    it('is 19 with it', () => {
      render([], { showTeamColumn: true });

      expect(fixture.componentInstance.columnCount()).toBe(19);
    });

    it('matches the number of header cells actually rendered', () => {
      // The empty row spans columnCount(), so a drift here leaves a ragged table.
      render([]);
      expect(headerCells()).toHaveLength(fixture.componentInstance.columnCount());

      render([], { showTeamColumn: true });
      expect(headerCells()).toHaveLength(fixture.componentInstance.columnCount());
    });
  });

  describe('rows', () => {
    it('renders one row per player', () => {
      render([makePlayer({ playerid: 1 }), makePlayer({ playerid: 2 })]);

      expect(bodyRows()).toHaveLength(2);
    });

    it('renders the name and surname together', () => {
      render([makePlayer({ name: 'LeBron', surname: 'James' })]);

      expect(cellsOfRow(0)[1]).toBe('LeBron James');
    });

    it('numbers rows from firstRowNumber so paging continues the count', () => {
      render([makePlayer({ playerid: 1 }), makePlayer({ playerid: 2 })], { firstRowNumber: 26 });

      expect(cellsOfRow(0)[0]).toBe('26');
      expect(cellsOfRow(1)[0]).toBe('27');
    });

    it('starts at 1 by default', () => {
      render([makePlayer()]);

      expect(cellsOfRow(0)[0]).toBe('1');
    });

    it('shows an em dash for null text columns rather than blank cells', () => {
      render([
        makePlayer({ irlteamname: null, position: null, rosterrole: null, gameready: null }),
      ]);

      const cells = cellsOfRow(0);
      expect(cells[2]).toBe('—');
      expect(cells[3]).toBe('—');
    });

    it('shows 0 rather than an em dash for null stats', () => {
      // A missing stat is genuinely zero for scoring purposes; a dash would misread as "unknown".
      render([makePlayer({ points: null, rebounds: null })]);

      const cells = cellsOfRow(0);
      expect(cells[4]).toBe('0');
      expect(cells[5]).toBe('0');
    });

    it('renders the boolean flags as Yes / No, and null as a dash', () => {
      render([makePlayer({ allowdrop: true, islock: false })]);
      let cells = cellsOfRow(0);
      expect(cells).toContain('Yes');
      expect(cells).toContain('No');

      render([makePlayer({ allowdrop: null, islock: null })]);
      cells = cellsOfRow(0);
      expect(cells.filter((c) => c === '—').length).toBeGreaterThanOrEqual(2);
    });

    it('adds the fantasy-team cell only when the column is shown', () => {
      render([makePlayer({ team: 'Ballers' })]);
      expect(cellsOfRow(0)).not.toContain('Ballers');

      render([makePlayer({ team: 'Ballers' })], { showTeamColumn: true });
      expect(cellsOfRow(0)).toContain('Ballers');
    });

    it('shows a dash when the fantasy-team column is on but the player has no team', () => {
      render([makePlayer({ team: null })], { showTeamColumn: true });

      expect(cellsOfRow(0)[3]).toBe('—');
    });
  });

  describe('empty and loading states', () => {
    it('shows the default empty message with no players', () => {
      render([]);

      expect((fixture.nativeElement as HTMLElement).textContent).toContain('No players to show.');
    });

    it('shows a custom empty message', () => {
      render([], { emptyMessage: 'No free agents left.' });

      expect((fixture.nativeElement as HTMLElement).textContent).toContain('No free agents left.');
    });

    it('suppresses the empty message while loading', () => {
      // Paging keeps the old rows visible; an empty-state flash between pages would be noise.
      render([], { loading: true });

      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
        'No players to show.',
      );
    });

    it('marks the table as loading', () => {
      render([makePlayer()], { loading: true });

      expect(
        (fixture.nativeElement.querySelector('.player-table') as HTMLElement).className,
      ).toContain('is-loading');
    });

    it('keeps existing rows visible while loading', () => {
      render([makePlayer()], { loading: true });

      expect(bodyRows()).toHaveLength(1);
    });
  });
});

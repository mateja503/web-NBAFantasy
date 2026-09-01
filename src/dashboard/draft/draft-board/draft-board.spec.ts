import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DraftBoard } from './draft-board';
import { TeamDraftBoard } from '../../../services/Hub/draftHub';

describe('DraftBoard', () => {
  let fixture: ComponentFixture<DraftBoard>;
  let component: DraftBoard;

  const team = (overrides: Partial<TeamDraftBoard> = {}): TeamDraftBoard => ({
    teamId: 3,
    teamName: 'Ballers',
    pick: 5,
    ...overrides,
  });

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DraftBoard] }).compileComponents();
    fixture = TestBed.createComponent(DraftBoard);
    component = fixture.componentInstance;
  });

  it('creates with an empty board', () => {
    expect(component).toBeTruthy();
    expect(component.round).toBeNull();
    expect(component.onTheClock).toBeNull();
    expect(component.draftOrder).toEqual([]);
  });

  it('renders without inputs — the draft may not have started yet', () => {
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('shows the round number', () => {
    component.round = 3;
    fixture.detectChanges();

    expect(text()).toContain('3');
  });

  it('shows the team on the clock', () => {
    component.onTheClock = team({ teamName: 'Dunkers' });
    fixture.detectChanges();

    expect(text()).toContain('Dunkers');
  });

  it('lists every team in the draft order', () => {
    component.draftOrder = [
      team({ teamId: 3, teamName: 'Ballers' }),
      team({ teamId: 4, teamName: 'Dunkers' }),
      team({ teamId: 5, teamName: 'Shooters' }),
    ];
    fixture.detectChanges();

    const rendered = text();
    expect(rendered).toContain('Ballers');
    expect(rendered).toContain('Dunkers');
    expect(rendered).toContain('Shooters');
  });

  it('renders an empty order without a team on the clock — the draft is over', () => {
    component.round = 12;
    component.draftOrder = [];
    component.onTheClock = null;

    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('re-renders when the order changes', () => {
    // setInput rather than a plain assignment: reassigning an @Input after a render
    // trips NG0100 because the view is not marked dirty.
    fixture.componentRef.setInput('draftOrder', [team({ teamName: 'Ballers' })]);
    fixture.detectChanges();
    expect(text()).toContain('Ballers');

    fixture.componentRef.setInput('draftOrder', [team({ teamId: 9, teamName: 'Rebounders' })]);
    fixture.detectChanges();

    expect(text()).toContain('Rebounders');
    expect(text()).not.toContain('Ballers');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DraftedPlayers } from './drafted-players';
import { DraftPlayer } from '../../../services/Hub/draftHub';

describe('DraftedPlayers', () => {
  let fixture: ComponentFixture<DraftedPlayers>;
  let component: DraftedPlayers;

  const player = (overrides: Partial<DraftPlayer> = {}): DraftPlayer => ({
    playerId: 1000,
    fullName: 'Test Player',
    position: 'G',
    ...overrides,
  });

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DraftedPlayers] }).compileComponents();
    fixture = TestBed.createComponent(DraftedPlayers);
    component = fixture.componentInstance;
  });

  it('creates with no drafted players', () => {
    expect(component).toBeTruthy();
    expect(component.players()).toEqual([]);
  });

  it('mirrors the input into the players signal', () => {
    component.draftedPlayers = [player({ playerId: 1 }), player({ playerId: 2 })];

    expect(component.players()).toHaveLength(2);
  });

  it('replaces the roster wholesale on each update, rather than appending', () => {
    // The hub pushes the full roster for a team on every state broadcast.
    component.draftedPlayers = [player({ playerId: 1, fullName: 'First Pick' })];
    component.draftedPlayers = [player({ playerId: 2, fullName: 'Second Pick' })];

    expect(component.players()).toHaveLength(1);
    expect(component.players()[0]?.fullName).toBe('Second Pick');
  });

  it('accepts an empty roster', () => {
    component.draftedPlayers = [player()];
    component.draftedPlayers = [];

    expect(component.players()).toEqual([]);
  });

  it('renders each drafted player', () => {
    component.draftedPlayers = [
      player({ playerId: 1, fullName: 'LeBron James' }),
      player({ playerId: 2, fullName: 'Stephen Curry' }),
    ];
    fixture.detectChanges();

    expect(text()).toContain('LeBron James');
    expect(text()).toContain('Stephen Curry');
  });

  it('renders without a roster', () => {
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});

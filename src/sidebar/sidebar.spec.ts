import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Sidebar } from './sidebar';
import { provideConfigStub } from '../testing/test-helpers';

describe('Sidebar', () => {
  let fixture: ComponentFixture<Sidebar>;
  let component: Sidebar;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        // The sidebar's nav uses routerLink, which needs an ActivatedRoute.
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        provideNoopAnimations(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('starts with the league menu closed', () => {
    expect(component.isLeagueMenuOpen).toBe(false);
  });

  it('toggles the league menu open and shut', () => {
    component.toggleLeagueMenu();
    expect(component.isLeagueMenuOpen).toBe(true);

    component.toggleLeagueMenu();
    expect(component.isLeagueMenuOpen).toBe(false);
  });

  it('renders navigation links', () => {
    expect(fixture.nativeElement.querySelectorAll('[routerLink], a').length).toBeGreaterThan(0);
  });
});

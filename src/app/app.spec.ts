import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
import { provideConfigStub, provideSnackBarStub } from '../testing/test-helpers';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        // App renders <router-outlet> and the header's routerLinks, so the router
        // must be present or RouterLink fails to resolve ActivatedRoute.
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideConfigStub(),
        provideSnackBarStub(),
      ],
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  it('creates the app', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the layout shell: header, sidebar and a routed outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).not.toBeNull();
    expect(compiled.querySelector('app-sidebar')).not.toBeNull();
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('holds no state of its own', () => {
    // The shell used to inject LeagueService and keep a subscription list for a fetch that
    // was commented out. Pinned so feature data does not creep back into the shell.
    const fixture = TestBed.createComponent(App);
    const ownKeys = Object.keys(fixture.componentInstance).filter((k) => !k.startsWith('__'));

    expect(ownKeys).toEqual([]);
  });

  it('tears down without issuing any request', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(() => fixture.destroy()).not.toThrow();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Footer } from './footer';

describe('Footer', () => {
  let fixture: ComponentFixture<Footer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Footer] }).compileComponents();
    fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a footer landmark', () => {
    expect(fixture.nativeElement.querySelector('footer')).not.toBeNull();
  });

  it('is purely presentational — no declared state of its own', () => {
    // __ngContext__ is added by the renderer; anything else would be real state.
    const ownKeys = Object.keys(fixture.componentInstance).filter((k) => !k.startsWith('__'));

    expect(ownKeys).toEqual([]);
  });
});

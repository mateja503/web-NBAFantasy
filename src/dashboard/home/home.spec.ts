import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';

/** The component's members are `protected`; specs reach them through the instance index. */
type HomeInternals = {
  email: string;
  features: { title: string; image: string; tags: string[] }[];
  shots: { image: string; label: string }[];
  scrollTo(id: string): void;
};

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let internals: HomeInternals;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Home] }).compileComponents();
    fixture = TestBed.createComponent(Home);
    internals = fixture.componentInstance as unknown as HomeInternals;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('content', () => {
    it('lists four feature cards', () => {
      expect(internals.features).toHaveLength(4);
    });

    it('gives every feature card a title, an image and at least one tag', () => {
      for (const feature of internals.features) {
        expect(feature.title.length).toBeGreaterThan(0);
        expect(feature.image).toMatch(/^images\/home\/.+\.png$/);
        expect(feature.tags.length).toBeGreaterThan(0);
      }
    });

    it('lists three screenshots, each with an image and a label', () => {
      expect(internals.shots).toHaveLength(3);
      for (const shot of internals.shots) {
        expect(shot.image).toMatch(/^images\/home\/.+\.png$/);
        expect(shot.label.length).toBeGreaterThan(0);
      }
    });

    it('uses no duplicate image paths, so every slot is distinct', () => {
      const paths = [...internals.features, ...internals.shots].map((item) => item.image);

      expect(new Set(paths).size).toBe(paths.length);
    });

    it('exposes a contact address', () => {
      expect(internals.email).toContain('@');
    });
  });

  describe('scrollTo', () => {
    it('smooth-scrolls the requested element into view', () => {
      // jsdom does not implement scrollIntoView, so it is stubbed on the prototype.
      const scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      const target = document.createElement('div');
      target.id = 'home-spec-anchor';
      document.body.appendChild(target);

      internals.scrollTo('home-spec-anchor');

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
      target.remove();
    });

    it('does nothing when the id is not on the page', () => {
      // Optional chaining guards this; without it a stale anchor would throw on click.
      expect(() => internals.scrollTo('does-not-exist')).not.toThrow();
    });
  });

  describe('rendering', () => {
    it('renders an image slot for every feature and screenshot', () => {
      const slots = fixture.nativeElement.querySelectorAll('app-image-placeholder');

      expect(slots.length).toBeGreaterThanOrEqual(
        internals.features.length + internals.shots.length,
      );
    });

    it('renders each feature title', () => {
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      for (const feature of internals.features) {
        expect(text).toContain(feature.title);
      }
    });
  });
});

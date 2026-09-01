import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImagePlaceholder } from './image-placeholder';

describe('ImagePlaceholder', () => {
  let fixture: ComponentFixture<ImagePlaceholder>;

  /** Renders with `src` set (it is required) plus any extra inputs. */
  function render(inputs: Record<string, unknown> = {}) {
    fixture = TestBed.createComponent(ImagePlaceholder);
    fixture.componentRef.setInput('src', 'images/home/feature-draft.png');
    for (const [key, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(key, value);
    }
    fixture.detectChanges();
    return fixture;
  }

  const img = () => fixture.nativeElement.querySelector('img') as HTMLImageElement | null;
  const fallback = () => fixture.nativeElement.querySelector('.image-slot__fallback');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ImagePlaceholder] }).compileComponents();
  });

  it('renders the image first, not the fallback', () => {
    render();

    expect(img()).not.toBeNull();
    expect(img()?.getAttribute('src')).toBe('images/home/feature-draft.png');
    expect(fallback()).toBeNull();
  });

  it('passes alt text through', () => {
    render({ alt: 'The draft room' });

    expect(img()?.getAttribute('alt')).toBe('The draft room');
  });

  it('defaults alt to an empty string rather than omitting it', () => {
    render();

    expect(img()?.getAttribute('alt')).toBe('');
  });

  it('applies the aspect ratio', () => {
    render({ ratio: '4 / 3' });

    const slot = fixture.nativeElement.querySelector('.image-slot') as HTMLElement;
    expect(slot.style.aspectRatio.replace(/\s/g, '')).toBe('4/3');
  });

  it('defaults to a 16 / 9 slot', () => {
    render();

    const slot = fixture.nativeElement.querySelector('.image-slot') as HTMLElement;
    expect(slot.style.aspectRatio.replace(/\s/g, '')).toBe('16/9');
  });

  it('squares the corners when flush', () => {
    render({ flush: true });

    expect(
      (fixture.nativeElement.querySelector('.image-slot') as HTMLElement).className,
    ).toContain('image-slot--flush');
  });

  describe('when the image fails to load', () => {
    beforeEach(() => {
      render({ label: 'Draft room screenshot', hint: '1200x675', icon: 'trophy' });
      img()?.dispatchEvent(new Event('error'));
      fixture.detectChanges();
    });

    it('swaps the image for the fallback', () => {
      expect(img()).toBeNull();
      expect(fallback()).not.toBeNull();
    });

    it('prints the exact path the file is expected at', () => {
      // The point of the fallback: it tells you where to drop the missing file.
      expect(fixture.nativeElement.querySelector('.image-slot__path')?.textContent).toBe(
        'public/images/home/feature-draft.png',
      );
    });

    it('shows the label and hint', () => {
      expect(fixture.nativeElement.querySelector('.image-slot__label')?.textContent).toContain(
        'Draft room screenshot',
      );
      expect(fixture.nativeElement.querySelector('.image-slot__hint')?.textContent).toContain(
        '1200x675',
      );
    });

    it('uses the requested bootstrap icon', () => {
      expect(fixture.nativeElement.querySelector('.image-slot__icon')?.className).toContain(
        'bi-trophy',
      );
    });
  });

  it('omits the hint line when no hint was given', () => {
    render();
    img()?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.image-slot__hint')).toBeNull();
  });

  it('falls back to the default label and icon', () => {
    render();
    img()?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.image-slot__label')?.textContent).toContain(
      'Image',
    );
    expect(fixture.nativeElement.querySelector('.image-slot__icon')?.className).toContain(
      'bi-image',
    );
  });
});

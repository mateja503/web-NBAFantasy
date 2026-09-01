import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Button } from './button';

describe('Button', () => {
  let fixture: ComponentFixture<Button>;
  let component: Button;

  /** The rendered native <button>. */
  function nativeButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Button] }).compileComponents();
    fixture = TestBed.createComponent(Button);
    component = fixture.componentInstance;
  });

  it('creates with safe defaults', () => {
    expect(component).toBeTruthy();
    expect(component.variant).toBe('primary');
    expect(component.shape).toBe('rounded');
    expect(component.size).toBe('md');
    // Defaults to `button` so a button inside a form never submits by accident.
    expect(component.type).toBe('button');
    expect(component.disabled).toBe(false);
  });

  describe('classes', () => {
    it('composes variant, shape and size', () => {
      component.variant = 'ghost';
      component.shape = 'pill';
      component.size = 'lg';

      expect(component.classes).toBe('button button--ghost button--pill button--lg');
    });

    it('adds the mono modifier only when asked', () => {
      expect(component.classes).not.toContain('button--mono');

      component.mono = true;

      expect(component.classes).toContain('button--mono');
    });

    it('adds is-active only when active', () => {
      expect(component.classes).not.toContain('is-active');

      component.active = true;

      expect(component.classes).toContain('is-active');
    });

    it('lands on the rendered element', () => {
      component.variant = 'accent';
      fixture.detectChanges();

      expect(nativeButton().className).toContain('button--accent');
    });
  });

  describe('renderIcon', () => {
    it('is false when showIcon is off, whatever the icon', () => {
      component.icon = 'arrow-clockwise';

      expect(component.renderIcon).toBe(false);
    });

    it('is false when showIcon is on but no icon name was given', () => {
      // A true flag with a blank name would render an empty <i> and a stray gap.
      component.showIcon = true;

      expect(component.renderIcon).toBe(false);
    });

    it.each(['', '   '])('is false for the blank icon name %p', (icon) => {
      component.showIcon = true;
      component.icon = icon;

      expect(component.renderIcon).toBe(false);
    });

    it('is true when both are supplied', () => {
      component.showIcon = true;
      component.icon = 'arrow-clockwise';

      expect(component.renderIcon).toBe(true);
    });
  });

  describe('iconClass', () => {
    it('adds the bi- prefix when the caller omits it', () => {
      component.icon = 'arrow-clockwise';

      expect(component.iconClass).toBe('button__icon bi bi-arrow-clockwise');
    });

    it('does not double the prefix when the caller includes it', () => {
      component.icon = 'bi-arrow-clockwise';

      expect(component.iconClass).toBe('button__icon bi bi-arrow-clockwise');
    });

    it('trims surrounding whitespace', () => {
      component.icon = '  star  ';

      expect(component.iconClass).toBe('button__icon bi bi-star');
    });

    it('degrades to a bare bi- when no icon is set', () => {
      expect(component.iconClass).toBe('button__icon bi bi-');
    });
  });

  describe('hasLabel', () => {
    it('is true for the default label', () => {
      expect(component.hasLabel).toBe(true);
    });

    it.each(['', '   '])('is false for %p', (label) => {
      component.label = label;

      expect(component.hasLabel).toBe(false);
    });

    it('renders the label text when present', () => {
      component.label = 'Draft';
      fixture.detectChanges();

      expect(nativeButton().textContent?.trim()).toBe('Draft');
    });

    it('renders no label span when the label is blank', () => {
      component.label = '';
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.button__label')).toBeNull();
    });
  });

  describe('ariaPressed', () => {
    it('is null on a plain action, so it is not announced as a toggle', () => {
      expect(component.ariaPressed).toBeNull();
    });

    it('reports the active state on a real toggle', () => {
      component.pressable = true;

      expect(component.ariaPressed).toBe(false);

      component.active = true;
      expect(component.ariaPressed).toBe(true);
    });

    it('omits the attribute entirely for a plain action', () => {
      fixture.detectChanges();

      expect(nativeButton().hasAttribute('aria-pressed')).toBe(false);
    });

    it('writes the attribute for a toggle', () => {
      component.pressable = true;
      component.active = true;
      fixture.detectChanges();

      expect(nativeButton().getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('onClick', () => {
    it('emits btnClick when enabled', () => {
      const emitted = vi.fn();
      component.btnClick.subscribe(emitted);

      component.onClick(new MouseEvent('click'));

      expect(emitted).toHaveBeenCalledTimes(1);
    });

    it('swallows the event and emits nothing when disabled', () => {
      const emitted = vi.fn();
      component.btnClick.subscribe(emitted);
      component.disabled = true;
      const event = new MouseEvent('click', { cancelable: true });
      const stopPropagation = vi.spyOn(event, 'stopPropagation');

      component.onClick(event);

      expect(emitted).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
      expect(stopPropagation).toHaveBeenCalled();
    });

    it('emits on a real DOM click', () => {
      const emitted = vi.fn();
      component.btnClick.subscribe(emitted);
      fixture.detectChanges();

      nativeButton().click();

      expect(emitted).toHaveBeenCalledTimes(1);
    });

    it('is disabled in the DOM when disabled', () => {
      component.disabled = true;
      fixture.detectChanges();

      expect(nativeButton().disabled).toBe(true);
    });
  });

  describe('aria-label', () => {
    it('is omitted when not supplied', () => {
      fixture.detectChanges();

      expect(nativeButton().hasAttribute('aria-label')).toBe(false);
    });

    it('is written through when supplied — needed for icon-only buttons', () => {
      component.ariaLabel = 'Refresh the board';
      fixture.detectChanges();

      expect(nativeButton().getAttribute('aria-label')).toBe('Refresh the board');
    });
  });
});

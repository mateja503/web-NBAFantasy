import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Custominput } from './custominput';

describe('Custominput', () => {
  let fixture: ComponentFixture<Custominput>;
  let component: Custominput;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Custominput],
      // Material form fields animate; the noop driver keeps the specs synchronous.
      providers: [provideNoopAnimations()],
    }).compileComponents();
    fixture = TestBed.createComponent(Custominput);
    component = fixture.componentInstance;
  });

  it('creates with text defaults', () => {
    expect(component).toBeTruthy();
    expect(component.type).toBe('text');
    expect(component.label).toBe('');
    expect(component.required).toBe(false);
    expect(component.options).toEqual([]);
  });

  describe('matFormFieldApperance', () => {
    it('maps fill to fill', () => {
      component.appearance = 'fill';

      expect(component.matFormFieldApperance).toBe('fill');
    });

    it('maps anything else to outline', () => {
      // Material only accepts 'fill' | 'outline', so an unknown string must not reach it.
      component.appearance = 'outline';
      expect(component.matFormFieldApperance).toBe('outline');

      component.appearance = 'legacy';
      expect(component.matFormFieldApperance).toBe('outline');

      component.appearance = '';
      expect(component.matFormFieldApperance).toBe('outline');
    });

    it('defaults to fill', () => {
      expect(component.matFormFieldApperance).toBe('fill');
    });
  });

  describe('onModelChanging', () => {
    it('updates the local value and emits it', () => {
      const emitted = vi.fn();
      component.valueChange.subscribe(emitted);

      component.onModelChanging('typed text');

      expect(component.value).toBe('typed text');
      expect(emitted).toHaveBeenCalledWith('typed text');
    });

    it('emits an empty string when the field is cleared', () => {
      // The parent needs to see the clear, so an empty value must still be emitted.
      const emitted = vi.fn();
      component.value = 'something';
      component.valueChange.subscribe(emitted);

      component.onModelChanging('');

      expect(component.value).toBe('');
      expect(emitted).toHaveBeenCalledWith('');
    });

    it('emits null through unchanged', () => {
      const emitted = vi.fn();
      component.valueChange.subscribe(emitted);

      component.onModelChanging(null);

      expect(component.value).toBeNull();
      expect(emitted).toHaveBeenCalledWith(null);
    });

    it('emits once per change', () => {
      const emitted = vi.fn();
      component.valueChange.subscribe(emitted);

      component.onModelChanging('a');
      component.onModelChanging('b');

      expect(emitted).toHaveBeenCalledTimes(2);
      expect(emitted).toHaveBeenLastCalledWith('b');
    });
  });

  describe('rendering by type', () => {
    it('renders a text input inside a form field', () => {
      component.type = 'text';
      component.label = 'UserName';
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('input')).not.toBeNull();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('UserName');
    });

    it('renders a number input for type number', () => {
      component.type = 'number';
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('input')?.getAttribute('type')).toBe('number');
    });

    it('renders a select with its options', () => {
      component.type = 'select';
      component.options = [
        { label: 'Points', value: 1 },
        { label: 'Categories', value: 2 },
      ];
      fixture.detectChanges();

      const options = fixture.nativeElement.querySelectorAll('select option');
      // One placeholder option plus the two supplied.
      expect(options).toHaveLength(3);
    });

    it('renders radio buttons for type radio', () => {
      component.type = 'radio';
      component.options = [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ];
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('mat-radio-button')).toHaveLength(2);
      // The radio branch sits outside the form field.
      expect(fixture.nativeElement.querySelector('mat-form-field')).toBeNull();
    });

    it('renders nothing for a type the template does not handle', () => {
      // checkbox/email/password/textarea are in the input union but have no branch —
      // pinned so the gap is visible rather than silently rendering an empty box.
      component.type = 'checkbox';
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('input')).toBeNull();
      expect(fixture.nativeElement.querySelector('mat-radio-group')).toBeNull();
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DynamicDialog } from './dynamicDialog';
import { DynamicDialogConfig } from './dynamicDialogConfig';

describe('DynamicDialog', () => {
  let fixture: ComponentFixture<DynamicDialog>;
  let component: DynamicDialog;
  let close: ReturnType<typeof vi.fn>;
  let consoleLog: ReturnType<typeof vi.spyOn>;

  const loginConfig: DynamicDialogConfig = {
    title: 'Login',
    fields: [
      { key: 'username', label: 'UserName', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'text', required: true },
    ],
    submitLabel: 'Login',
    cancelLabel: 'Cancel',
  };

  /** Builds the dialog around a given config — the component reads it from MAT_DIALOG_DATA. */
  async function build(data: DynamicDialogConfig) {
    close = vi.fn();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [DynamicDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: { close } },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DynamicDialog);
    component = fixture.componentInstance;
    return component;
  }

  beforeEach(async () => {
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await build(loginConfig);
  });

  afterEach(() => consoleLog.mockRestore());

  describe('construction', () => {
    it('seeds a key in formResult for every configured field', () => {
      expect(Object.keys(component.formResult)).toEqual(['username', 'password']);
    });

    it('seeds fields with no value as an empty string, never undefined', () => {
      // The template binds these with ngModel; undefined would render the input as
      // uncontrolled and submit `undefined` rather than an empty answer.
      expect(component.formResult['username']).toBe('');
      expect(component.formResult['password']).toBe('');
    });

    it('uses a configured default value where one is given', async () => {
      await build({
        title: 'Join',
        fields: [{ key: 'teamName', label: 'Team', type: 'text', value: 'Ballers' }],
      });

      expect(component.formResult['teamName']).toBe('Ballers');
    });

    it('coerces a falsy configured value to an empty string', async () => {
      // `field.value || ''` means 0 and false do not survive — pinned because a numeric
      // field defaulting to 0 would silently start blank.
      await build({
        title: 'Settings',
        fields: [{ key: 'weeks', label: 'Weeks', type: 'number', value: 0 }],
      });

      expect(component.formResult['weeks']).toBe('');
    });

    it('handles a config with no fields', async () => {
      await build({ title: 'Empty', fields: [] });

      expect(component.formResult).toEqual({});
    });
  });

  describe('onCancel', () => {
    it('closes with null so the caller can tell cancel from an empty submit', () => {
      component.onCancel();

      expect(close).toHaveBeenCalledWith(null);
    });
  });

  describe('onSubmit', () => {
    it('closes with the collected form values', () => {
      component.formResult['username'] = 'tester';
      component.formResult['password'] = 'secret';

      component.onSubmit();

      expect(close).toHaveBeenCalledWith({ username: 'tester', password: 'secret' });
    });

    it('closes with the untouched seed when nothing was typed', () => {
      component.onSubmit();

      expect(close).toHaveBeenCalledWith({ username: '', password: '' });
    });
  });

  describe('rendering', () => {
    it('shows the configured title and one input per field', () => {
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Login');
      expect(fixture.nativeElement.querySelectorAll('app-custominput')).toHaveLength(2);
    });
  });
});

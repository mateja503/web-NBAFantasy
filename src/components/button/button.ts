import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Visual role of the button. Colour only — geometry lives in `ButtonShape`/`ButtonSize`
 * so a "cyan pill" and a "cyan square" don't need two variants.
 */
export type ButtonVariant =
  | 'primary' // legacy dark-navy action button (default, fixed 100x40 like before)
  | 'brand' // bright blue, blue glow — landing-page calls to action
  | 'accent' // solid cyan on dark text — the one "confirm" button in a panel
  | 'ghost' // dark surface + subtle border, cyan on hover/active — toolbars, pills, pagers
  | 'outline' // transparent with a cyan hairline — secondary next to `brand`
  | 'success' // transparent with a green hairline — "Draft" in the draft room
  | 'toggle' // borderless segmented control — the All/Teams/Leagues filter group
  | 'row'; // full-width, left-aligned selectable list row

export type ButtonShape = 'square' | 'rounded' | 'pill';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonIconPosition = 'left' | 'right';

/**
 * The single button used across the app.
 *
 * Why no Angular Material here any more: `mat-elevated-button` ships its own padding,
 * min-width, border-radius and ripple overlay. Every non-default variant (pill, list row,
 * segmented toggle) had to fight those with `!important`. A plain `<button>` styled from
 * the design tokens is predictable and keeps the variant matrix readable.
 *
 * Anything the component can't model — a count badge, the position badge + name inside a
 * trade row — is projected via `<ng-content>`. Projected nodes keep the *parent's* style
 * encapsulation, so the parent's own classes still apply to them.
 */
@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  @Input() label: string = 'Click Me';
  @Input() variant: ButtonVariant = 'primary';
  @Input() shape: ButtonShape = 'rounded';
  @Input() size: ButtonSize = 'md';

  /** Native type. Defaults to `button` so a button inside a form never submits by accident. */
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  @Input() disabled: boolean = false;

  /** Selected/pressed state. Each variant renders it differently. */
  @Input() active: boolean = false;

  /** Set on real toggles so the button reports `aria-pressed`; plain actions must not. */
  @Input() pressable: boolean = false;

  /** Monospace + uppercase + bold, for the short position/filter pills. */
  @Input() mono: boolean = false;

  /** Parent opt-in for the icon, as requested — nothing renders unless this is true. */
  @Input() showIcon: boolean = false;

  /** Bootstrap-icon name, with or without the `bi-` prefix (e.g. `arrow-clockwise`). */
  @Input() icon?: string;

  @Input() iconPosition: ButtonIconPosition = 'left';

  /** Inline overrides. Left undefined so the variant's own CSS wins by default. */
  @Input() width?: string;
  @Input() height?: string;
  @Input() color?: string;

  /** Needed when the button is icon-only, or when the label alone isn't descriptive. */
  @Input() ariaLabel?: string;

  @Output() btnClick = new EventEmitter<void>();

  /**
   * Draw the icon only when the parent asked for it *and* gave a usable name — a `true`
   * flag with a null/blank icon would otherwise render an empty `<i>` and a stray gap.
   */
  get renderIcon(): boolean {
    return this.showIcon === true && (this.icon?.trim().length ?? 0) > 0;
  }

  /** Accepts both `arrow-clockwise` and `bi-arrow-clockwise` so call sites can't get it wrong. */
  get iconClass(): string {
    const name = this.icon?.trim() ?? '';
    return `button__icon bi ${name.startsWith('bi-') ? name : `bi-${name}`}`;
  }

  get hasLabel(): boolean {
    return (this.label?.trim().length ?? 0) > 0;
  }

  /**
   * Built as one string rather than several `[class.x]` bindings because the variant/shape/size
   * class names are dynamic, and that would otherwise need `NgClass` pulled in.
   */
  get classes(): string {
    const parts = ['button', `button--${this.variant}`, `button--${this.shape}`, `button--${this.size}`];

    if (this.mono) {
      parts.push('button--mono');
    }
    if (this.active) {
      parts.push('is-active');
    }

    return parts.join(' ');
  }

  /** `null` (not `false`) on plain actions, so they don't announce themselves as toggles. */
  get ariaPressed(): boolean | null {
    return this.pressable ? this.active === true : null;
  }

  onClick(event: Event): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.btnClick.emit();
  }
}

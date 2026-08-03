import { Component, input, signal } from '@angular/core';

/**
 * Drop-in image slot with a self-documenting fallback.
 *
 * While the file at `src` does not exist yet, the component renders a dashed
 * placeholder that prints the exact path the image is expected at. As soon as
 * the file is added under `public/`, the real image renders instead — no
 * template edits required.
 */
@Component({
  selector: 'app-image-placeholder',
  templateUrl: './image-placeholder.html',
  styleUrl: './image-placeholder.scss',
})
export class ImagePlaceholder {
  /** Path relative to the served root, e.g. `images/home/draft-room.png`. */
  readonly src = input.required<string>();
  readonly alt = input<string>('');
  /** Short caption shown inside the placeholder box. */
  readonly label = input<string>('Image');
  /** Recommended dimensions, shown as a hint. */
  readonly hint = input<string>('');
  /** CSS aspect-ratio value, e.g. `16 / 9`. */
  readonly ratio = input<string>('16 / 9');
  /** Bootstrap icon name (without the `bi-` prefix). */
  readonly icon = input<string>('image');
  /** Square off the corners — for slots that sit flush against a card edge. */
  readonly flush = input<boolean>(false);

  protected readonly failed = signal(false);

  protected onError(): void {
    this.failed.set(true);
  }
}

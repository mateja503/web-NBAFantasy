import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-button',
  imports: [MatButtonModule],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  @Input() label: string = 'Click Me';
  @Input() disabled: boolean = false;
  @Input() width: string = '100px';
  @Input() height: string = '40px';
  @Input() color?: string = '#1e4472e4';

  @Output() btnClick = new EventEmitter<void>();

  onClick(event: Event): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
      this.btnClick.emit();
  }

}

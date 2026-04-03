import { Component, inject, Input, model } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule, MatLabel } from '@angular/material/input';
import { Button } from '../button/button';

interface DialogData {
  animal: string;
  name: string;
}
@Component({
  selector: 'app-dialog',
  imports: [MatDialogModule, MatLabel, MatFormFieldModule,FormsModule, Button,MatInputModule ],
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
})
export class Dialog {

  @Input() width: string = '300px';

  readonly dialogRef = inject(MatDialogRef<Dialog>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  readonly animal = model(this.data.animal);

  onNoClick(): void {
    this.dialogRef.close();
  }

  onYesClick(): void {
    console.log('Yes clicked');
    
  }
}

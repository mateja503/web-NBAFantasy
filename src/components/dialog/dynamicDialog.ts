import { Component, inject, Input, model } from '@angular/core';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule, MatLabel } from '@angular/material/input';
import { Button } from '../button/button';
import { DynamicDialogConfig } from './dynamicDialogConfig';
import { Custominput } from '../custominput/custominput';


@Component({
  selector: 'app-dynamicDialog',
  imports: [MatDialogModule, MatFormFieldModule,FormsModule, Button,MatInputModule, Custominput ],
  templateUrl: './dynamicDialog.html',
  styleUrl: './dynamicDialog.scss',
})
export class DynamicDialog {

  readonly dialogRef = inject(MatDialogRef<DynamicDialog>);
  readonly data = inject<DynamicDialogConfig>(MAT_DIALOG_DATA);
  // readonly animal = model(this.data.animal);

  // Store form results in a key-value map
  public formResult: Record<string, any> = {};

  constructor(){
    this.data.fields.forEach(field => {
      this.formResult[field.key] = field.value || ''; // Initialize with empty string or default value
    });
  }

  onCancel(): void {
    this.dialogRef.close(null); // Close the dialog without returning data
  }

  onSubmit(): void {
    console.log('Yes clicked');
    this.dialogRef.close(this.formResult); // Close the dialog and return form data
  }
}

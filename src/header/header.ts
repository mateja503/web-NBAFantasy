import { Component, inject } from '@angular/core';
import { Button } from '../components/button/button';
import { MatDialog } from '@angular/material/dialog';
import { DynamicDialog } from '../components/dialog/dynamicDialog';
import { AuthService, UserResponse } from '../services/auth-service';
import { GlobalStore } from '../store/globalStore';

interface DialogResponse {
  username: string;
  password: string;
  email?:string
}

@Component({
  selector: 'app-header',
  imports: [Button],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})

export class Header {

  readonly globalStore = inject(GlobalStore);
  readonly dialog = inject(MatDialog)
  private readonly authService = inject(AuthService);

  openLoginDialog() {
    const dialogRef = this.dialog.open(DynamicDialog, {
      width: '550px',
      data: {
        title: 'Login',
        fields: [
          { key: 'username', label: 'UserName', placeholder: 'Enter your username', type: 'text', width: '350px',  required: true},
          { key: 'password', label: 'Password', placeholder: 'Enter your password', type: 'text', width: '350px', required: true}
        ],
        submitLabel: 'Login',
        submitButtonWidth: '150px',
        cancelLabel: 'Cancel',
        cancelButtonWidth: '100px',
        cancelButtonColor: 'gray',
      },
    })

    dialogRef.afterClosed().subscribe((result?: DialogResponse) => {
        console.log('This is the dialog results from login page', result);
        this.authService.login({ username: result?.username, password: result?.password }).subscribe({
          next: (response:UserResponse) => {
            console.log('Login successful:', response);
            this.globalStore.loginSuccess(response);
          },
          error: (error) => {
            console.error('Login failed:', error);
          }
        });
    });
  }

  openRegisterDialog() {
    const dialogRef = this.dialog.open(DynamicDialog, {
      width: '550px',
      data: {
        title: 'Sign Up',
        fields: [
          { key: 'username', label: 'UserName', placeholder: 'Enter your username', type: 'text', width: '350px',  required: true},
          { key: 'email', label: 'Email', placeholder: 'Enter your email', type: 'text', width: '350px', required: true},
          { key: 'password', label: 'Password', placeholder: 'Enter your password', type: 'text', width: '350px', required: true},
        ],
        submitLabel: 'Sign Up',
        submitButtonWidth: '150px',
        cancelLabel: 'Cancel',
        cancelButtonWidth: '100px',
        cancelButtonColor: 'gray',
      },
    })

    dialogRef.afterClosed().subscribe((result?: DialogResponse) => {
        console.log('This is the dialog results from sign up page', result);
    });
  }


}

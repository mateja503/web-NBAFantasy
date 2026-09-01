import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService, UserResponse } from '../services/auth-service';
import { GlobalStore } from '../store/globalStore';
import { SharedModule } from '../app/app.module';
import { DynamicDialog } from '../components/dialog/dynamicDialog';

interface DialogResponse {
  username: string;
  password: string;
  email?:string
}

@Component({
  selector: 'app-header',
  imports: [SharedModule],
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
        // Dialog was cancelled / dismissed — nothing to submit.
        if (!result?.username || !result?.password) {
          return;
        }
        this.authService.login({ username: result.username, password: result.password }).subscribe({
          next: (response: UserResponse) => {
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
        // Dialog was cancelled / dismissed, or a required field came back blank.
        if (!result?.username || !result?.email || !result?.password) {
          return;
        }

        this.authService
          .register({ username: result.username, email: result.email, password: result.password })
          .subscribe({
            // The register endpoint issues a token, so a successful sign-up signs the user in
            // rather than bouncing them to the login dialog to type it all again.
            next: (response: UserResponse) => {
              this.globalStore.loginSuccess(response);
            },
            error: (error) => {
              console.error('Sign up failed:', error);
            },
          });
    });
  }


}

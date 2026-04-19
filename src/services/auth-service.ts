import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
//   private readonly TOKEN_KEY = 'auth_token';
  
  // Track auth state
  private currentUserSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.currentUserSubject.asObservable();

  login(credentials: any): Observable<any> {
    return this.http.post<any>('/api/login', credentials).pipe(
      tap(response => {
        // localStorage.setItem(this.TOKEN_KEY, response.token);
        this.currentUserSubject.next(true);
      })
    );
  }

  logout(): void {
    // localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(false);
  }

//   getToken(): string | null {
//     return localStorage.getItem(this.TOKEN_KEY);
//   }

//   private hasToken(): boolean {
//     return !!localStorage.getItem(this.TOKEN_KEY);
//   }
}
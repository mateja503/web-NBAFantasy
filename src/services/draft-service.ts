import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DraftService {

  private http = inject(HttpClient);
   private draftUrl = 'https://localhost:7041/v1/draft'

  startDraft(data: any): Observable<any>{
       return this.http.post(`${this.draftUrl}/start-draft`, data)
  }

}

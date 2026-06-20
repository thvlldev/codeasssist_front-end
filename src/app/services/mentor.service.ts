import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Mentor } from '../model/mentor.model';

@Injectable({ providedIn: 'root' })
export class MentorService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  listarTodos(): Observable<Mentor[]> {
    return this.http.get<Mentor[]>(`${this.API_BASE}/mentores`);
  }

  buscarPorUsuarioId(usuarioId: number): Observable<Mentor | undefined> {
    return this.listarTodos().pipe(
      map(mentores => mentores.find(m => m.usuarioId === usuarioId))
    );
  }

  criar(mentor: Partial<Mentor>): Observable<Mentor> {
    return this.http.post<Mentor>(`${this.API_BASE}/mentores`, mentor);
  }
}
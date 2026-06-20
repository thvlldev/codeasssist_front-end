import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Avaliacao } from '../model/avaliacao.model';

@Injectable({ providedIn: 'root' })
export class AvaliacaoService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  listarTodas(): Observable<Avaliacao[]> {
    return this.http.get<Avaliacao[]>(`${this.API_BASE}/avaliacoes`);
  }

  listarPorMentor(mentorUsuarioId: number): Observable<Avaliacao[]> {
    return this.listarTodas().pipe(
      map(avaliacoes => avaliacoes.filter(a => a.mentorUsuarioId === mentorUsuarioId))
    );
  }

  criar(avaliacao: Partial<Avaliacao>): Observable<Avaliacao> {
    return this.http.post<Avaliacao>(`${this.API_BASE}/avaliacoes`, avaliacao);
  }
}
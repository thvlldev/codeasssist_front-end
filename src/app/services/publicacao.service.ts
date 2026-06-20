import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Publicacao } from '../model/publicacao.model';

@Injectable({ providedIn: 'root' })
export class PublicacaoService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  listarTodas(): Observable<Publicacao[]> {
    return this.http.get<Publicacao[]>(`${this.API_BASE}/publicacoes`);
  }

  buscarPorId(id: number): Observable<Publicacao> {
    return this.http.get<Publicacao>(`${this.API_BASE}/publicacoes/${id}`);
  }

  listarPorUsuario(usuarioId: number): Observable<Publicacao[]> {
    return this.listarTodas().pipe(
      map(publicacoes => publicacoes.filter(p => p.usuarioId === usuarioId))
    );
  }

  criar(publicacao: Partial<Publicacao>): Observable<Publicacao> {
    return this.http.post<Publicacao>(`${this.API_BASE}/publicacoes`, publicacao);
  }
}
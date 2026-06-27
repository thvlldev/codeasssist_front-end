import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { UsuarioTecnologia } from '../model/usuario_tecnologia.model';

@Injectable({ providedIn: 'root' })
export class UsuarioTecnologiaService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  listarTodas(): Observable<UsuarioTecnologia[]> {
    return this.http.get<UsuarioTecnologia[]>(`${this.API_BASE}/usuarios-tecnologias`);
  }

  listarPorUsuario(usuarioId: number): Observable<UsuarioTecnologia[]> {
    return this.listarTodas().pipe(
      map(relacoes => relacoes.filter(r => r.usuarioId === usuarioId))
    );
  }

  criar(relacao: UsuarioTecnologia): Observable<UsuarioTecnologia> {
    return this.http.post<UsuarioTecnologia>(`${this.API_BASE}/usuarios-tecnologias`, relacao);
  }

  atualizar(usuarioId: number, tecnologiaId: number, dados: Partial<UsuarioTecnologia>): Observable<UsuarioTecnologia> {
    return this.http.put<UsuarioTecnologia>(
      `${this.API_BASE}/usuarios-tecnologias/${usuarioId}/${tecnologiaId}`,
      dados
    );
  }
}
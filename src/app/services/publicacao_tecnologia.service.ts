import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { PublicacaoTecnologia } from '../model/publicacao_tecnologia.model';

@Injectable({ providedIn: 'root' })
export class PublicacaoTecnologiaService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  listarTodas(): Observable<PublicacaoTecnologia[]> {
    return this.http.get<PublicacaoTecnologia[]>(`${this.API_BASE}/publicacoes-tecnologias`);
  }

  listarPorPublicacao(publicacaoId: number): Observable<PublicacaoTecnologia[]> {
    return this.listarTodas().pipe(
      map(relacoes => relacoes.filter(r => r.publicacaoId === publicacaoId))
    );
  }

  criar(relacao: PublicacaoTecnologia): Observable<PublicacaoTecnologia> {
    return this.http.post<PublicacaoTecnologia>(`${this.API_BASE}/publicacoes-tecnologias`, relacao);
  }
}
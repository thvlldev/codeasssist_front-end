import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespostaPublicacao } from '../model/resposta_publicacao.model';

@Injectable({ providedIn: 'root' })
export class RespostaPublicacaoService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  listarTodas(): Observable<RespostaPublicacao[]> {
    return this.http.get<RespostaPublicacao[]>(`${this.API_BASE}/respostas-publicacoes`);
  }

  listarPorPublicacao(publicacaoId: number): Observable<RespostaPublicacao[]> {
    return this.listarTodas().pipe(
      map(respostas => respostas.filter(r => r.publicacaoId === publicacaoId))
    );
  }

  criar(resposta: Partial<RespostaPublicacao>): Observable<RespostaPublicacao> {
    return this.http.post<RespostaPublicacao>(`${this.API_BASE}/respostas-publicacoes`, resposta);
  }
}
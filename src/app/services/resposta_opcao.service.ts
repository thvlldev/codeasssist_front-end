import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespostaOpcao } from '../model/resposta_opcao.model';

@Injectable({ providedIn: 'root' })
export class RespostaOpcaoService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  listarTodas(): Observable<RespostaOpcao[]> {
    return this.http.get<RespostaOpcao[]>(`${this.API_BASE}/respostas-opcao`);
  }

  listarPorUsuario(clienteUsuarioId: number): Observable<RespostaOpcao[]> {
    return this.listarTodas().pipe(
      map(respostas => respostas.filter(r => r.clienteUsuarioId === clienteUsuarioId))
    );
  }

  criar(resposta: Partial<RespostaOpcao>): Observable<RespostaOpcao> {
    return this.http.post<RespostaOpcao>(`${this.API_BASE}/respostas-opcao`, resposta);
  }
}
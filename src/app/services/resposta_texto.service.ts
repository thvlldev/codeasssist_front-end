import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespostaTexto } from '../model/resposta_texto.model';

@Injectable({ providedIn: 'root' })
export class RespostaTextoService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  listarTodas(): Observable<RespostaTexto[]> {
    return this.http.get<RespostaTexto[]>(`${this.API_BASE}/respostas-texto`);
  }

  listarPorUsuario(clienteUsuarioId: number): Observable<RespostaTexto[]> {
    return this.listarTodas().pipe(
      map(respostas => respostas.filter(r => r.clienteUsuarioId === clienteUsuarioId))
    );
  }

  criar(resposta: Partial<RespostaTexto>): Observable<RespostaTexto> {
    return this.http.post<RespostaTexto>(`${this.API_BASE}/respostas-texto`, resposta);
  }
}
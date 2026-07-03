import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { OpcaoPergunta } from '../model/opcao_pergunta.model';

@Injectable({ providedIn: 'root' })
export class OpcaoPerguntaService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  listarTodas(): Observable<OpcaoPergunta[]> {
    return this.http.get<OpcaoPergunta[]>(`${this.API_BASE}/opcoes-pergunta`);
  }

  listarPorPergunta(perguntaCadastroId: number): Observable<OpcaoPergunta[]> {
    return this.listarTodas().pipe(
      map(opcoes => opcoes.filter(o => o.perguntaCadastroId === perguntaCadastroId)) //O filter percorre a lista e retorna somente valores que atendam a uma condição
    );
  }
}

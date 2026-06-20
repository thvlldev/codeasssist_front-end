import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PerguntaCadastro } from '../model/pergunta_cadastro.model';

@Injectable({ providedIn: 'root' })
export class PerguntaCadastroService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  listarTodas(): Observable<PerguntaCadastro[]> {
    return this.http.get<PerguntaCadastro[]>(`${this.API_BASE}/perguntas-cadastro`);
  }
}
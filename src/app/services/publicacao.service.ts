import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tecnologia } from '../model/publicacao.model';

@Injectable({
  providedIn: 'root'
})
export class PublicacaoService {
  private http = inject(HttpClient);

  // 1. Rota geral de publicações no PLURAL (usada para criar e listar tudo)
  private readonly API_PUBLICACOES_PLURAL = 'http://academico3.rj.senac.br/20261prjint3manha-mentoria/api/publicacoes';

  // 2. Rota específica do endpoint de filtro mapeada pelo professor no SINGULAR
  private readonly API_PUBLICACAO_SINGULAR = 'http://academico3.rj.senac.br/20261prjint3manha-mentoria/api/publicacao';

  // 3. Rota de tecnologias
  private readonly API_TECNOLOGIAS = 'http://academico3.rj.senac.br/20261prjint3manha-mentoria/api/tecnologias';

  // Cria uma nova solicitação de mentoria (usa Plural)
  criar(publicacao: any): Observable<any> {
    return this.http.post<any>(this.API_PUBLICACOES_PLURAL, publicacao);
  }

  // Traz a lista de tecnologias cadastradas
  listarTecnologias(): Observable<Tecnologia[]> {
    return this.http.get<Tecnologia[]>(this.API_TECNOLOGIAS);
  }

  // Traz todas as publicações gerais do sistema para o Mural público (usa Plural)
  listarTodas(): Observable<any[]> {
    return this.http.get<any[]>(this.API_PUBLICACOES_PLURAL);
  }

  // CORRIGIDO: Bate exatamente no mapeamento do Java em SINGULAR -> /api/publicacao/usuario/{id}
  listarPorUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_PUBLICACAO_SINGULAR}/usuario/${usuarioId}`);
  }
}

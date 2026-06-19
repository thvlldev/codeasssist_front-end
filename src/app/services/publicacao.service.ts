import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Publicacao, NovaPublicacaoPayload, Tecnologia } from '../model/publicacao.model';

@Injectable({
  providedIn: 'root'
})
export class PublicacaoService {

  private readonly API_PUBLICACOES = 'http://academico3.rj.senac.br/20261prjint3manha-mentoria/api/publicacoes';
  private readonly API_TECNOLOGIAS = 'http://academico3.rj.senac.br/20261prjint3manha-mentoria/api/tecnologias';

  constructor(private http: HttpClient) {}

  // Busca todas as publicações salvas (tabela publicacao) para o Feed
  listarTodas(): Observable<Publicacao[]> {
    return this.http.get<Publicacao[]>(this.API_PUBLICACOES);
  }

  // Envia os dados para salvar uma nova publicação e seus vínculos na tabela NxM publicacao_tecnologia
  criar(publicacao: NovaPublicacaoPayload): Observable<Publicacao> {
    return this.http.post<Publicacao>(this.API_PUBLICACOES, publicacao);
  }

  // Busca as tecnologias cadastradas (tabela tecnologia) para preencher os botões do formulário
  listarTecnologias(): Observable<Tecnologia[]> {
    return this.http.get<Tecnologia[]>(this.API_TECNOLOGIAS);
  }
}

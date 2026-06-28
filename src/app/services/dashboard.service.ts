import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Publicacao } from '../model/publicacao.model';
import { RespostaPublicacao } from '../model/resposta_publicacao.model';
import { Usuario } from '../model/usuario.model';
import { Mentor } from '../model/mentor.model';
import { Tecnologia } from '../model/tecnologia.model';
import { UsuarioTecnologia } from '../model/usuario_tecnologia.model';
import { DashboardCliente, DashboardMentor } from '../model/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  buscarDashboardCliente(usuarioId: number): Observable<DashboardCliente> {
    return forkJoin([
      this.http.get<Usuario>(`${this.API_BASE}/usuarios/${usuarioId}`),
      this.http.get<Publicacao[]>(`${this.API_BASE}/publicacoes`),
      this.http.get<RespostaPublicacao[]>(`${this.API_BASE}/respostas-publicacoes`),
      this.http.get<Tecnologia[]>(`${this.API_BASE}/tecnologias`),
      this.http.get<UsuarioTecnologia[]>(`${this.API_BASE}/usuarios-tecnologias`)
    ]).pipe(
      map(([usuario, todasPublicacoes, todasRespostas, todasTecnologias, usuarioTecnologias]) => {

        const minhas = todasPublicacoes.filter(p => p.usuarioId === usuarioId && p.status !== 0);
        const minhasIds = minhas.map(p => p.id);
        const respostasDasMinhas = todasRespostas.filter(r => minhasIds.includes(r.publicacaoId) && r.status !== 0);

        const publicacoesRecentes = minhas
          .map(p => ({
            ...p,
            totalRespostas: respostasDasMinhas.filter(r => r.publicacaoId === p.id).length
          }))
          .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
          .slice(0, 5);

        const idsDoUsuario = usuarioTecnologias
          .filter(ut => ut.usuarioId === usuarioId && ut.status !== 0)
          .map(ut => ut.tecnologiaId);
        const tecnologias = todasTecnologias.filter(t => idsDoUsuario.includes(t.id) && t.status !== 0);

        const publicacoesFinalizadas = minhas.filter(p => p.status === 3);
        const valorTotalInvestido = publicacoesFinalizadas.reduce((soma, p) => soma + (p.orcamentoMax ?? 0), 0);

        return {
          tipo: 'cliente' as const,
          usuario,
          metricas: {
            totalPublicacoes: minhas.length,
            totalRespostasRecebidas: respostasDasMinhas.length,
            publicacoesAbertas: minhas.filter(p => p.status === 1).length,
            valorTotalInvestido
          },
          publicacoesRecentes,
          tecnologias
        };
      })
    );
  }

  buscarDashboardMentor(usuarioId: number): Observable<DashboardMentor> {
    return forkJoin([
      this.http.get<Usuario>(`${this.API_BASE}/usuarios/${usuarioId}`),
      this.http.get<Mentor[]>(`${this.API_BASE}/mentores`),
      this.http.get<Publicacao[]>(`${this.API_BASE}/publicacoes`),   // SEM filtro — lista completa
      this.http.get<RespostaPublicacao[]>(`${this.API_BASE}/respostas-publicacoes`),
      this.http.get<Tecnologia[]>(`${this.API_BASE}/tecnologias`),
      this.http.get<UsuarioTecnologia[]>(`${this.API_BASE}/usuarios-tecnologias`)
    ]).pipe(
      map(([usuario, mentores, todasPublicacoes, todasRespostas, todasTecnologias, usuarioTecnologias]) => {

        const dadosMentor = mentores.find(m => m.usuarioId === usuarioId);
        const precoHora = dadosMentor?.precoHora ?? 0;
        const mediaAvaliacao = dadosMentor?.mediaAvaliacao ?? 0;

        // Respostas do mentor (não soft delete)
        const minhasRespostas = todasRespostas.filter(r => r.usuarioId === usuarioId && r.status !== 0);

        // Cruzamento com publicacoes SEM filtrar por status — assim acha sempre o título
        const candidaturas = minhasRespostas
          .map(r => {
            const pub = todasPublicacoes.find(p => p.id === r.publicacaoId);
            return {
              respostaId: r.id,
              conteudo: r.conteudo,
              publicacaoId: r.publicacaoId,
              publicacaoTitulo: pub?.titulo ?? `Publicação #${r.publicacaoId}`,
              publicacaoStatus: pub?.status ?? 0,
              orcamentoMin: pub?.orcamentoMin ?? 0,
              orcamentoMax: pub?.orcamentoMax ?? 0,
              statusResposta: r.status
            };
          })
          .sort((a, b) => b.respostaId - a.respostaId)
          .slice(0, 5);

        // Sessão em andamento: minha resposta aceita (status 2) onde publicação está em andamento (status 2)
        const sessaoAtiva = candidaturas.find(c => c.statusResposta === 2 && c.publicacaoStatus === 2);
        const sessaoAndamento = sessaoAtiva ? {
          publicacaoId: sessaoAtiva.publicacaoId,
          publicacaoTitulo: sessaoAtiva.publicacaoTitulo,
          clienteNome: 'Cliente'
        } : null;

        // Ganhos = respostas aceitas × precoHora (1 hora por sessão)
        const respostasAceitas = minhasRespostas.filter(r => r.status === 2);
        const ganhosMes = respostasAceitas.length * precoHora;

        // Sessões concluídas = publicações finalizadas (status 3) onde fui aceito
        const idsAceitos = respostasAceitas.map(r => r.publicacaoId);
        const sessoesConcluidas = todasPublicacoes.filter(
          p => idsAceitos.includes(p.id) && p.status === 3
        ).length;

        // Tecnologias do mentor
        const idsDoMentor = usuarioTecnologias
          .filter(ut => ut.usuarioId === usuarioId && ut.status !== 0)
          .map(ut => ut.tecnologiaId);
        const tecnologias = todasTecnologias.filter(t => idsDoMentor.includes(t.id) && t.status !== 0);

        return {
          tipo: 'mentor' as const,
          usuario,
          metricas: { ganhosMes, sessoesConcluidas, candidaturasEnviadas: minhasRespostas.length, mediaAvaliacao },
          sessaoAndamento,
          candidaturas,
          tecnologias,
          precoHora
        };
      })
    );
  }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Publicacao } from '../model/publicacao.model';
import { RespostaPublicacao } from '../model/resposta_publicacao.model';
import { Usuario } from '../model/usuario.model';
import { DashboardData } from '../model/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  buscarDashboard(usuarioId: number): Observable<DashboardData> {

    const usuario$ = this.http.get<Usuario>(`${this.API_BASE}/usuarios/${usuarioId}`);
    const publicacoes$ = this.http.get<Publicacao[]>(`${this.API_BASE}/publicacoes`);
    const respostas$ = this.http.get<RespostaPublicacao[]>(`${this.API_BASE}/respostas-publicacoes`);

    return forkJoin([usuario$, publicacoes$, respostas$]).pipe(
      map(([usuario, todasPublicacoes, todasRespostas]) => {

        const minhas = todasPublicacoes.filter(p => p.usuarioId === usuarioId);
        const minhasIds = minhas.map(p => p.id);
        const respostasDasMinhas = todasRespostas.filter(r => minhasIds.includes(r.publicacaoId));

        const publicacoesComRespostas = minhas
          .map(p => ({
            ...p,
            totalRespostas: todasRespostas.filter(r => r.publicacaoId === p.id).length
          }))
          .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
          .slice(0, 5);

        return {
          usuario,
          metricas: {
            totalPublicacoes: minhas.length,
            totalRespostasRecebidas: respostasDasMinhas.length,
            publicacoesAbertas: minhas.filter(p => p.status === 1).length,
            valorTotalInvestido: minhas.reduce((soma, p) => soma + (p.orcamentoMax ?? 0), 0)
          },
          publicacoesRecentes: publicacoesComRespostas
        };
      })
    );
  }
}
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


  buscarDashboardCliente(usuarioId: number): Observable<DashboardCliente> {//dashboard.ts linha 62 ,recebe o usuarioId do cliente logado e devolve um Observable<DashboardCliente>
    return forkJoin([//faz 5 gets ao mesmo tempo e espera todas terminarem e só depois passa os resultados pro map
      this.http.get<Usuario>(`${this.API_BASE}/usuarios/${usuarioId}`),
      this.http.get<Publicacao[]>(`${this.API_BASE}/publicacoes`),
      this.http.get<RespostaPublicacao[]>(`${this.API_BASE}/respostas-publicacoes`),
      this.http.get<Tecnologia[]>(`${this.API_BASE}/tecnologias`),
      this.http.get<UsuarioTecnologia[]>(`${this.API_BASE}/usuarios-tecnologias`)
    ]).pipe(
      map(([usuario, todasPublicacoes, todasRespostas, todasTecnologias, usuarioTecnologias]) => {
        //Desestrutura o array que o forkJoin devolveu e cada variável pega o resultado da requisição na mesma posição.
        const minhas = todasPublicacoes.filter(p => p.usuarioId === usuarioId && p.status !== 0);//Procura as publicações do usuario que não sofreram soft delete.
        const minhasIds = minhas.map(p => p.id);//extrai o id dessas publicacoes
        const respostasDasMinhas = todasRespostas.filter(r => minhasIds.includes(r.publicacaoId) && r.status !== 0);//Procura as respostas das publicacoes do usuario que não sofreram soft delete.

        const publicacoesRecentes = minhas
          .map(p => ({
            ...p,
            totalRespostas: respostasDasMinhas.filter(r => r.publicacaoId === p.id).length// conta quantas respostas aquela publicaçao tem 
          }))
          .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())//ordena da mais recente para a mais antiga. Converte as strings de data em número com getTime() e subtrai para ordenar decrescente
          .slice(0, 5);//só pega as 5 primeiras respostas

        const idsDoUsuario = usuarioTecnologias
          .filter(ut => ut.usuarioId === usuarioId && ut.status !== 0)// filtra a tabela de junção para pegar só os vínculos do usuário logado
          .map(ut => ut.tecnologiaId);//extrai os IDs das tecnologias
        const tecnologias = todasTecnologias.filter(t => idsDoUsuario.includes(t.id) && t.status !== 0);//usa esses IDs para buscar os objetos completos na lista de tecnologias.

        const publicacoesFinalizadas = minhas.filter(p => p.status === 3);//Filtra só publicações finalizadas e soma o orcamentoMax de cada uma, não daria tempo pra gente mudar pra pegar o preçoHora do mentor que respondeu
        const valorTotalInvestido = publicacoesFinalizadas.reduce((soma, p) => soma + (p.orcamentoMax ?? 0), 0);//começa com soma = 0 e vai acumulando. O ?? 0 garante que null vira 0.

        return {//Monta e devolve o objeto final.
          tipo: 'cliente' as const,
          usuario,
          metricas: {
            totalPublicacoes: minhas.length, //quantidade de publicacoes que não sofreram soft delete
            totalRespostasRecebidas: respostasDasMinhas.length,//quantidade de respostas de publicacoes que nao sofreram soft delete
            publicacoesAbertas: minhas.filter(p => p.status === 1).length,//filtra só as publicacoes com status em aberto que no nosso projeto é o 1
            valorTotalInvestido
          },
          publicacoesRecentes,
          tecnologias
        };
      })
    );
  }

  buscarDashboardMentor(usuarioId: number): Observable<DashboardMentor> {//dashboard.ts linha 63
    return forkJoin([//faz 6 gets ao mesmo tempo e espera todas terminarem e só depois passa os resultados pro map
      this.http.get<Usuario>(`${this.API_BASE}/usuarios/${usuarioId}`),
      this.http.get<Mentor[]>(`${this.API_BASE}/mentores`),
      this.http.get<Publicacao[]>(`${this.API_BASE}/publicacoes`),// busca todas as publicacoes SEM filtro de usuario pq o mentor precisa do título das publicações que ele respondeu, que são de outros usuários.
      this.http.get<RespostaPublicacao[]>(`${this.API_BASE}/respostas-publicacoes`),
      this.http.get<Tecnologia[]>(`${this.API_BASE}/tecnologias`),
      this.http.get<UsuarioTecnologia[]>(`${this.API_BASE}/usuarios-tecnologias`)
    ]).pipe(
      map(([usuario, mentores, todasPublicacoes, todasRespostas, todasTecnologias, usuarioTecnologias]) => {
        //Desestrutura o array que o forkJoin devolveu e cada variável pega o resultado da requisição na mesma posição.

        const dadosMentor = mentores.find(m => m.usuarioId === usuarioId);//Encontra o registro do mentor na lista e extrai seus dados.
        const precoHora = dadosMentor?.precoHora ?? 0; //O ?? 0 garante que null vira 0.
        const mediaAvaliacao = dadosMentor?.mediaAvaliacao ?? 0;//O ?? 0 garante que null vira 0.

        // Respostas do mentor (não soft delete)
        const minhasRespostas = todasRespostas.filter(r => r.usuarioId === usuarioId && r.status !== 0);//Pega só as respostas onde o autor é o mentor logado

        // Cruzamento com publicacoes SEM filtrar por status — assim acha sempre o título
        const candidaturas = minhasRespostas//Para cada resposta que o mentor enviou, cruza com a lista de publicações para pegar o título, status e orçamento da publicação original
          .map(r => {
            const pub = todasPublicacoes.find(p => p.id === r.publicacaoId);
            return {
              respostaId: r.id,
              conteudo: r.conteudo,
              publicacaoId: r.publicacaoId,
              publicacaoTitulo: pub?.titulo ?? `Publicação #${r.publicacaoId}`,// garante que mesmo se a publicação não for encontrada, exibe um fallback
              publicacaoStatus: pub?.status ?? 0,
              orcamentoMin: pub?.orcamentoMin ?? 0,
              orcamentoMax: pub?.orcamentoMax ?? 0,
              statusResposta: r.status
            };
          })
          .sort((a, b) => b.respostaId - a.respostaId)//Ordena pela resposta mais recente 
          .slice(0, 5);//e pega só as 5 últimas.

        // Sessão em andamento: minha resposta aceita (status 2) onde publicação está em andamento (status 2)
        const sessaoAtiva = candidaturas.find(c => c.statusResposta === 2 && c.publicacaoStatus === 2);//Procura nas candidaturas se existe alguma onde a resposta foi aceita e a publicação está em andamento
        const sessaoAndamento = sessaoAtiva ? {// se achar monta o objeto de sessão; se não achar, retorna null e no template o bloco de "sessão em andamento" não aparece.
          publicacaoId: sessaoAtiva.publicacaoId,
          publicacaoTitulo: sessaoAtiva.publicacaoTitulo,
          clienteNome: 'Cliente'
        } : null;

        // Ganhos = respostas aceitas × precoHora (1 hora por sessão)
        const respostasAceitas = minhasRespostas.filter(r => r.status === 2);//Filtra as respostas aceitas.
        const ganhosMes = respostasAceitas.length * precoHora;//Ganhos = quantidade de aceitas × preço/hora (simulando 1 hora por sessão)

        // Sessões concluídas = publicações finalizadas (status 3) onde fui aceito
        const idsAceitos = respostasAceitas.map(r => r.publicacaoId);
        const sessoesConcluidas = todasPublicacoes.filter(//Sessões concluídas = publicações que já foram finalizadas (status === 3) dentre as que o mentor foi aceito.
          p => idsAceitos.includes(p.id) && p.status === 3
        ).length;

        // Tecnologias do mentor
        const idsDoMentor = usuarioTecnologias
          .filter(ut => ut.usuarioId === usuarioId && ut.status !== 0)// filtra a tabela de junção para pegar só os vínculos do usuário logado
          .map(ut => ut.tecnologiaId);//extrai os IDs das tecnologias
        const tecnologias = todasTecnologias.filter(t => idsDoMentor.includes(t.id) && t.status !== 0);//usa esses IDs para buscar os objetos completos na lista de tecnologias.

        return {//Monta e devolve o objeto final DashboardMentor com tudo calculado.
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
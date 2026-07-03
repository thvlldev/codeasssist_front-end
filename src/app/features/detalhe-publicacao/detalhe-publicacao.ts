// Importa recursos principais do Angular:
// Component cria o componente, OnInit permite usar ngOnInit,
// inject injeta serviços, signal cria estados reativos,
// ChangeDetectorRef força atualização manual da tela quando necessário.
import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';

// Importa recursos comuns do Angular, como diretivas estruturais no template.
import { CommonModule } from '@angular/common';

// Permite trabalhar com formulários simples no template.
import { FormsModule } from '@angular/forms';

// ActivatedRoute permite pegar parâmetros da rota.
// Router permite navegar para outras páginas.
// RouterModule permite usar recursos de rota no HTML.
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// forkJoin executa várias requisições ao mesmo tempo e espera todas terminarem.
// map transforma o valor emitido por um Observable.
import { forkJoin, map } from 'rxjs';

// Serviços responsáveis por acessar os endpoints relacionados às publicações.
import { PublicacaoService } from '../../services/publicacao.service';

// Serviço responsável por acessar respostas/propostas enviadas para publicações.
import { RespostaPublicacaoService } from '../../services/resposta_publicacao.service';

// Serviço responsável pela relação entre publicação e tecnologia.
import { PublicacaoTecnologiaService } from '../../services/publicacao_tecnologia.service';

// Serviço responsável por listar tecnologias.
import { TecnologiaService } from '../../services/tecnologia.service';

// Serviço responsável por criar/listar avaliações.
import { AvaliacaoService } from '../../services/avaliacao.service';

// Serviço responsável por buscar e atualizar dados do mentor.
import { MentorService } from '../../services/mentor.service';

// Serviço responsável por dados de autenticação: usuário logado, papel ativo etc.
import { AuthService } from '../../services/auth.service';

// HttpClient usado aqui diretamente para buscar dados de usuários pelo ID.
import { HttpClient } from '@angular/common/http';

// Importa a URL base da API configurada no environment.
import { environment } from '../../../environments/environment';

// Modelo da publicação.
import { Publicacao } from '../../model/publicacao.model';

// Modelo da resposta/proposta enviada para uma publicação.
import { RespostaPublicacao } from '../../model/resposta_publicacao.model';

// Modelo da tecnologia.
import { Tecnologia } from '../../model/tecnologia.model';

// Interface criada para enriquecer uma RespostaPublicacao.
// Ela herda tudo de RespostaPublicacao e adiciona dados extras do mentor,
// como nome, email, usuarioId e se já foi avaliado.
interface RespostaComMentor extends RespostaPublicacao {
  // Nome do mentor que enviou a proposta.
  nomeMentor?: string;

  // Email do mentor que enviou a proposta.
  emailMentor?: string;

  // ID do usuário mentor, usado principalmente para avaliação.
  mentorUsuarioId?: number;

  // Indica se o cliente já avaliou esse mentor nessa publicação.
  jaAvaliou?: boolean;
}

// Configuração do componente Angular.
@Component({
  selector: 'app-detalhe-publicacao',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './detalhe-publicacao.html',
  styleUrls: ['./detalhe-publicacao.css']
})
export class DetalhePublicacaoComponent implements OnInit {
  // Injeta o ActivatedRoute para acessar parâmetros da URL, como o id da publicação.
  private route = inject(ActivatedRoute);

  // Injeta o Router para navegar para outras rotas, como o chat.
  private router = inject(Router);

  // Injeta o HttpClient para fazer requisições HTTP diretas.
  private http = inject(HttpClient);

  // Injeta o service de publicações.
  private publicacaoService = inject(PublicacaoService);

  // Injeta o service de respostas/propostas da publicação.
  private respostaPublicacaoService = inject(RespostaPublicacaoService);

  // Injeta o service que relaciona publicação com tecnologias.
  private publicacaoTecnologiaService = inject(PublicacaoTecnologiaService);

  // Injeta o service de tecnologias.
  private tecnologiaService = inject(TecnologiaService);

  // Injeta o service de avaliações.
  private avaliacaoService = inject(AvaliacaoService);

  // Injeta o service de mentores.
  private mentorService = inject(MentorService);

  // Injeta o AuthService para pegar usuário logado e papel ativo.
  private authService = inject(AuthService);

  // Injeta o ChangeDetectorRef para forçar atualização visual da tela.
  private cdr = inject(ChangeDetectorRef);

  // Guarda a URL base da API para montar endpoints manualmente quando necessário.
  private readonly API_BASE = environment.apiServer;

  // ID da publicação obtido pela rota.
  publicacaoId!: number;

  // Objeto completo da publicação carregada.
  publicacao!: Publicacao;

  // Lista de tecnologias relacionadas à publicação.
  tecnologias: Tecnologia[] = [];

  // Indica se o usuário logado está acessando como mentor.
  ehMentor = false;

  // ID do usuário logado, obtido pelo AuthService.
  usuarioLogadoId!: number;

  // Controla estado de carregamento da tela.
  carregando = true;

  // Controla se alguma ação está em processamento para evitar cliques duplicados.
  processando = false;

  // Mentor

  // Guarda o texto digitado pelo mentor ao enviar uma nova proposta.
  novaPropostaConteudo = '';

  // Indica se o mentor logado já respondeu a essa publicação.
  jaRespondeu = false;

  // Guarda a proposta enviada pelo mentor logado, caso exista.
  propostaEnviadaPorMim?: RespostaPublicacao;

  // Cliente

  // Lista de propostas recebidas pelo cliente, já enriquecidas com dados do mentor.
  propostasRecebidas: RespostaComMentor[] = [];

  // Modal avaliação

  // Signal que controla se o modal de avaliação está aberto ou fechado.
  modalAvaliacaoAberto = signal(false);

  // Signal que guarda qual proposta está sendo avaliada no momento.
  propostaSendoAvaliada = signal<RespostaComMentor | null>(null);

  // Signal que guarda a nota selecionada pelo cliente.
  notaSelecionada = signal(0);

  // Signal que guarda a nota temporária ao passar o mouse nas estrelas.
  notaHover = signal(0);

  // Signal que guarda o comentário digitado na avaliação.
  comentarioAvaliacao = signal('');

  // Signal que indica se a avaliação está sendo salva.
  salvandoAvaliacao = signal(false);

  // Signal que guarda mensagem de erro da avaliação, se houver.
  erroAvaliacao = signal('');

  // Método executado automaticamente quando o componente é inicializado.
  ngOnInit(): void {
    // Pega o ID do usuário logado.
    // Se não existir usuário logado, usa 0 como fallback.
    this.usuarioLogadoId = this.authService.getUsuarioId() ?? 0;

    // Verifica se o papel ativo é mentor.
    // Aqui o código compara diretamente com 1, que representa Mentor no enum.
    this.ehMentor = this.authService.getPapelAtivo() === 1;

    // Inscreve-se nos parâmetros da rota para pegar o ID da publicação.
    this.route.params.subscribe(params => {
      // Converte o parâmetro id da rota para número usando o sinal +.
      this.publicacaoId = +params['id'];

      // Se existe um ID válido, carrega todos os dados necessários da tela.
      if (this.publicacaoId) this.carregarDadosCompletos();
    });
  }

  // ── Labels de status ──────────────────────────────────────────────────

  // Transforma o status numérico da publicação em texto legível para a tela.
  getLabelStatusPublicacao(status: number): string {
    switch (status) {
      case 1: return 'Em aberto';
      case 2: return 'Em andamento';
      case 3: return 'Finalizada';
      default: return 'Desconhecido';
    }
  }

  // Retorna classes CSS de acordo com o status da publicação.
  // Isso permite mudar a cor visual do status no HTML.
  getClasseStatusPublicacao(status: number): string {
    switch (status) {
      case 1: return 'bg-success-subtle text-success';
      case 2: return 'bg-warning-subtle text-warning';
      case 3: return 'bg-secondary-subtle text-secondary';
      default: return 'bg-light text-muted';
    }
  }

  // ── Permissões baseadas em status ─────────────────────────────────────

  // Define se o mentor pode enviar proposta para essa publicação.
  get podeEnviarProposta(): boolean {
    // Só pode enviar proposta se:
    // 1. o usuário for mentor;
    // 2. a publicação estiver em aberto, status 1;
    // 3. o mentor ainda não tiver respondido.
    return this.ehMentor && this.publicacao?.status === 1 && !this.jaRespondeu;
  }

  // Define se o usuário pode abrir o chat.
  get podeAbrirChat(): boolean {
    // Cliente: publicacao em andamento (2) ou finalizada (3)
    // Mentor: sua resposta foi aceita (status 2) e publicacao em andamento (2) ou finalizada (3)

    // Se a publicação ainda não foi carregada, não permite abrir o chat.
    if (!this.publicacao) return false;

    // Caso o usuário logado seja mentor, só pode abrir o chat se:
    // 1. a publicação estiver em andamento ou finalizada;
    // 2. a proposta enviada por esse mentor tiver sido aceita.
    if (this.ehMentor) {
      return (this.publicacao.status === 2 || this.publicacao.status === 3)
        && this.propostaEnviadaPorMim?.status === 2;
    }

    // Se for cliente, pode abrir o chat quando a publicação estiver em andamento ou finalizada.
    return this.publicacao.status === 2 || this.publicacao.status === 3;
  }

  // Define se o cliente pode avaliar o mentor.
  get podeAvaliar(): boolean {
    // Só quando publicacao finalizada (3)

    // Apenas cliente pode avaliar, e somente quando a publicação estiver finalizada.
    return !this.ehMentor && this.publicacao?.status === 3;
  }

  // Indica se o chat/publicação já foi finalizado.
  get chatFinalizado(): boolean {
    return this.publicacao?.status === 3;
  }

  // ── Carregamento ──────────────────────────────────────────────────────

  // Carrega todos os dados necessários para a tela de detalhe da publicação.
  carregarDadosCompletos(): void {
    // Liga o estado de carregamento.
    this.carregando = true;

    // Força a tela a atualizar para refletir o carregamento.
    this.cdr.detectChanges();

    // Executa várias requisições em paralelo.
    forkJoin([
      // Busca a publicação pelo ID da rota.
      this.publicacaoService.buscarPorId(this.publicacaoId),

      // Busca todas as relações entre publicações e tecnologias.
      this.publicacaoTecnologiaService.listarTodas(),

      // Busca todas as tecnologias cadastradas.
      this.tecnologiaService.listarTodas(),

      // Busca todas as respostas/propostas dessa publicação.
      this.respostaPublicacaoService.listarPorPublicacao(this.publicacaoId)
    ]).subscribe({
      // Quando todas as requisições terminam com sucesso:
      next: ([pub, relacoes, todasTechs, respostas]) => {
        // Salva a publicação carregada.
        this.publicacao = pub;

        // Filtra as relações que pertencem à publicação atual
        // e transforma essas relações em uma lista de IDs de tecnologias.
        const idsRelacionados = relacoes
          .filter(r => r.publicacaoId === pub.id)
          .map(r => r.tecnologiaId);

        // Filtra todas as tecnologias, mantendo apenas aquelas cujo ID está relacionado à publicação.
        this.tecnologias = todasTechs.filter(t => idsRelacionados.includes(t.id));

        // Filtra soft deletes

        // Remove respostas com status 0, que são consideradas inativas/removidas logicamente.
        const respostasAtivas = respostas.filter(r => r.status !== 0);

        // Se o usuário logado é mentor, a tela precisa saber se ele já enviou proposta.
        if (this.ehMentor) {
          // Procura, entre as respostas ativas, uma resposta enviada pelo próprio mentor logado.
          this.propostaEnviadaPorMim = respostasAtivas.find(r => r.usuarioId === this.usuarioLogadoId);

          // Converte a existência da proposta em booleano.
          // Se encontrou proposta, jaRespondeu vira true.
          this.jaRespondeu = !!this.propostaEnviadaPorMim;

          // Finaliza o carregamento.
          this.carregando = false;

          // Atualiza a tela.
          this.cdr.detectChanges();

          // Para o método aqui, pois mentor não precisa carregar propostas com dados de outros mentores.
          return;
        }

        // Se for cliente e não houver respostas ativas, a lista de propostas fica vazia.
        if (respostasAtivas.length === 0) {
          this.propostasRecebidas = [];

          // Finaliza carregamento.
          this.carregando = false;

          // Atualiza a tela.
          this.cdr.detectChanges();

          // Para o método aqui, pois não há propostas para enriquecer com dados dos mentores.
          return;
        }

        // Se for cliente e existirem propostas,
        // carrega dados dos usuários mentores e também todas as avaliações.
        forkJoin([
          // Primeiro forkJoin interno:
          // para cada resposta ativa, busca o usuário que enviou aquela resposta.
          forkJoin(respostasAtivas.map(resp =>
            // Busca o usuário pelo ID do usuário que enviou a proposta.
            this.http.get<any>(`${this.API_BASE}/usuarios/${resp.usuarioId}`).pipe(
              // Transforma a resposta original em uma resposta enriquecida
              // com nome, email e ID do mentor.
              map(user => ({ ...resp, nomeMentor: user.nome, emailMentor: user.email, mentorUsuarioId: user.id }))
            )
          )),

          // Busca todas as avaliações para verificar se o cliente já avaliou cada mentor.
          this.avaliacaoService.listarTodas()
        ]).subscribe({
          // Quando buscar dados dos mentores e avaliações:
          next: ([respostasComMentor, todasAvaliacoes]) => {
            // Monta a lista de propostas recebidas, adicionando o campo jaAvaliou.
            this.propostasRecebidas = respostasComMentor.map(r => ({
              ...r,

              // Verifica se existe alguma avaliação dessa combinação:
              // mentor, cliente e publicação.
              jaAvaliou: todasAvaliacoes.some(
                a => a.mentorUsuarioId === r.mentorUsuarioId
                  && a.clienteUsuarioId === this.usuarioLogadoId
                  && a.publicacaoId === this.publicacaoId
              )
            }));

            // Finaliza carregamento.
            this.carregando = false;

            // Atualiza a tela.
            this.cdr.detectChanges();
          },

          // Se der erro ao buscar dados dos mentores ou avaliações:
          error: () => {
            // Usa um fallback: mantém as respostas, mas com nome genérico.
            this.propostasRecebidas = respostasAtivas.map(r => ({ ...r, nomeMentor: 'Mentor Parceiro' }));

            // Finaliza carregamento.
            this.carregando = false;

            // Atualiza a tela.
            this.cdr.detectChanges();
          }
        });
      },

      // Se der erro no carregamento principal da publicação:
      error: () => {
        // Finaliza carregamento mesmo em erro.
        this.carregando = false;

        // Atualiza a tela.
        this.cdr.detectChanges();
      }
    });
  }

  // ── Ações do mentor ───────────────────────────────────────────────────

  // Envia uma proposta do mentor para a publicação atual.
  enviarProposta(): void {
    // Se o texto estiver vazio ou só com espaços, não envia.
    if (!this.novaPropostaConteudo.trim()) return;

    // Cria uma nova resposta/proposta vinculada à publicação.
    this.respostaPublicacaoService.criar({
      // Conteúdo digitado pelo mentor.
      conteudo: this.novaPropostaConteudo,

      // ID do mentor logado.
      usuarioId: this.usuarioLogadoId,

      // ID da publicação atual.
      publicacaoId: this.publicacaoId,

      // Status 1 indica proposta pendente.
      status: 1
    }).subscribe({
      // Se criar com sucesso:
      next: () => {
        // Limpa o campo de texto da proposta.
        this.novaPropostaConteudo = '';

        // Recarrega os dados da tela para atualizar proposta enviada e status.
        this.carregarDadosCompletos();
      },

      // Se der erro, atualmente não faz nada visível.
      error: () => {}
    });
  }

  // ── Ações do cliente ──────────────────────────────────────────────────

  // Cliente aceita uma proposta recebida.
  aceitarProposta(proposta: RespostaComMentor): void {
    // Impede executar a ação duas vezes ao mesmo tempo.
    if (this.processando) return;

    // Marca que uma operação está em andamento.
    this.processando = true;

    // Atualiza a tela para refletir o estado de processamento.
    this.cdr.detectChanges();

    // 1. Aceita a resposta escolhida (status 2)

    // Atualiza a proposta escolhida para status 2, ou seja, aceita.
    this.respostaPublicacaoService.atualizar(proposta.id, { ...proposta, status: 2 }).subscribe({
      // Depois que a proposta escolhida foi aceita:
      next: () => {
        // 2. Rejeita todas as outras respostas pendentes (status 3)

        // Filtra todas as outras propostas que não são a escolhida
        // e que ainda estão pendentes.
        const outrasRespostas = this.propostasRecebidas.filter(
          r => r.id !== proposta.id && r.status === 1
        );

        // Para cada outra proposta pendente, cria uma operação para atualizar status para 3.
        // Status 3 aqui representa recusada.
        const rejeicoes = outrasRespostas.map(r =>
          this.respostaPublicacaoService.atualizar(r.id, { ...r, status: 3 })
        );

        // Função interna que atualiza o status da publicação depois das rejeições.
        const atualizarPublicacao = () => {
          // 3. Muda status da publicacao para em andamento (2)

          // Atualiza a publicação para status 2, ou seja, em andamento.
          this.publicacaoService.atualizar(this.publicacaoId, {
            ...this.publicacao, status: 2
          }).subscribe({
            // Se a publicação for atualizada com sucesso:
            next: () => {
              // Libera o processamento.
              this.processando = false;

              // 4. Navega pro chat

              // Redireciona para o chat usando o ID da proposta aceita.
              this.router.navigate(['/app/chat', proposta.id]);
            },

            // Se der erro ao atualizar a publicação:
            error: () => {
              // Libera o processamento.
              this.processando = false;

              // Atualiza a tela.
              this.cdr.detectChanges();
            }
          });
        };

        // Se existem propostas para rejeitar:
        if (rejeicoes.length > 0) {
          // Executa todas as rejeições em paralelo.
          forkJoin(rejeicoes).subscribe({
            // Se rejeitar todas com sucesso, atualiza a publicação.
            next: () => atualizarPublicacao(),

            // Mesmo que alguma rejeição falhe, continua atualizando a publicação.
            error: () => atualizarPublicacao() // continua mesmo se rejeição falhar
          });
        } else {
          // Se não há outras propostas pendentes, atualiza a publicação direto.
          atualizarPublicacao();
        }
      },

      // Se der erro ao aceitar a proposta:
      error: () => {
        // Libera o processamento.
        this.processando = false;

        // Atualiza a tela.
        this.cdr.detectChanges();
      }
    });
  }

  // Finaliza o chat/publicação.
  finalizarChat(proposta: RespostaComMentor): void {
    // Impede ação duplicada.
    if (this.processando) return;

    // Marca que há uma operação em andamento.
    this.processando = true;

    // Atualiza a tela.
    this.cdr.detectChanges();

    // Muda publicacao para finalizada (3)

    // Atualiza a publicação para status 3, ou seja, finalizada.
    this.publicacaoService.atualizar(this.publicacaoId, {
      ...this.publicacao, status: 3
    }).subscribe({
      // Se finalizar com sucesso:
      next: () => {
        // Libera processamento.
        this.processando = false;

        // Recarrega os dados para refletir status finalizado.
        this.carregarDadosCompletos();
      },

      // Se der erro:
      error: () => {
        // Libera processamento.
        this.processando = false;

        // Atualiza a tela.
        this.cdr.detectChanges();
      }
    });
  }

  // ── Modal avaliação ───────────────────────────────────────────────────

  // Abre o modal de avaliação para uma proposta específica.
  abrirModalAvaliacao(proposta: RespostaComMentor): void {
    // Define qual proposta será avaliada.
    this.propostaSendoAvaliada.set(proposta);

    // Reseta a nota selecionada.
    this.notaSelecionada.set(0);

    // Reseta o efeito de hover nas estrelas.
    this.notaHover.set(0);

    // Limpa o comentário anterior.
    this.comentarioAvaliacao.set('');

    // Limpa qualquer erro anterior.
    this.erroAvaliacao.set('');

    // Abre o modal.
    this.modalAvaliacaoAberto.set(true);
  }

  // Fecha o modal de avaliação.
  fecharModalAvaliacao(): void {
    // Define o signal como false para esconder o modal.
    this.modalAvaliacaoAberto.set(false);
  }

  // Define a nota escolhida pelo usuário.
  selecionarNota(nota: number): void { this.notaSelecionada.set(nota); }

  // Define temporariamente a nota exibida ao passar o mouse por cima das estrelas.
  hoverNota(nota: number): void { this.notaHover.set(nota); }

  // Limpa o hover quando o mouse sai das estrelas.
  limparHover(): void { this.notaHover.set(0); }

  // Verifica se uma estrela deve aparecer ativa.
  estrelaAtiva(index: number): boolean {
    // Se houver nota em hover, usa ela como referência.
    // Caso contrário, usa a nota selecionada.
    const ref = this.notaHover() > 0 ? this.notaHover() : this.notaSelecionada();

    // A estrela fica ativa se o índice dela for menor ou igual à referência.
    return index <= ref;
  }

  // Retorna a lista de estrelas disponíveis para avaliação.
  estrelas(): number[] { return [1, 2, 3, 4, 5]; }

  // Salva a avaliação feita pelo cliente.
  salvarAvaliacao(): void {
    // Valida se o usuário selecionou alguma nota.
    if (this.notaSelecionada() === 0) {
      // Define mensagem de erro caso nenhuma nota tenha sido escolhida.
      this.erroAvaliacao.set('Selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    // Valida se o usuário escreveu um comentário.
    if (!this.comentarioAvaliacao().trim()) {
      // Define mensagem de erro caso o comentário esteja vazio.
      this.erroAvaliacao.set('Escreva um comentário sobre a mentoria.');
      return;
    }

    // Pega a proposta que está sendo avaliada.
    // O ! indica que o código assume que não será null nesse momento.
    const proposta = this.propostaSendoAvaliada()!;

    // Liga o estado de salvamento da avaliação.
    this.salvandoAvaliacao.set(true);

    // Limpa erro anterior.
    this.erroAvaliacao.set('');

    // Cria uma nova avaliação.
    this.avaliacaoService.criar({
      // ID do cliente que está avaliando.
      clienteUsuarioId: this.usuarioLogadoId,

      // ID do mentor avaliado.
      mentorUsuarioId: proposta.mentorUsuarioId!,

      // Nota escolhida.
      valor: this.notaSelecionada(),

      // Comentário digitado.
      comentario: this.comentarioAvaliacao(),

      // Publicação relacionada à avaliação.
      publicacaoId: this.publicacaoId,

      // Status ativo da avaliação.
      status: 1
    }).subscribe({
      // Depois que a avaliação é criada:
      next: () => {
        // Busca todas as avaliações desse mentor para recalcular a média.
        this.avaliacaoService.listarPorMentor(proposta.mentorUsuarioId!).subscribe({
          // Quando recebe as avaliações do mentor:
          next: (avaliacoes) => {
            // Soma todas as notas recebidas.
            const total = avaliacoes.reduce((soma, a) => soma + a.valor, 0);

            // Calcula a média, arredondando para uma casa decimal.
            const media = parseFloat((total / avaliacoes.length).toFixed(1));

            // Busca o registro de mentor pelo usuarioId.
            this.mentorService.buscarPorUsuarioId(proposta.mentorUsuarioId!).subscribe({
              // Quando encontra o mentor:
              next: (mentor) => {
                // Só atualiza se o mentor existir.
                if (mentor) {
                  // Atualiza a média de avaliação do mentor.
                  this.mentorService.atualizar(proposta.mentorUsuarioId!, {
                    ...mentor, mediaAvaliacao: media
                  }).subscribe({
                    // Se a média foi atualizada com sucesso:
                    next: () => {
                      // Desliga salvamento.
                      this.salvandoAvaliacao.set(false);

                      // Fecha o modal.
                      this.modalAvaliacaoAberto.set(false);

                      // Recarrega dados para atualizar a tela.
                      this.carregarDadosCompletos();
                    },

                    // Se salvar a avaliação funcionou, mas atualizar média falhou:
                    error: () => {
                      // Desliga salvamento.
                      this.salvandoAvaliacao.set(false);

                      // Mostra mensagem explicando que a avaliação foi salva,
                      // mas a média do mentor não foi atualizada.
                      this.erroAvaliacao.set('Avaliação salva, mas erro ao atualizar média do mentor.');
                    }
                  });
                }
              },

              // Se der erro ao buscar o mentor:
              error: () => {
                // Desliga salvamento.
                this.salvandoAvaliacao.set(false);

                // Fecha o modal mesmo assim.
                this.modalAvaliacaoAberto.set(false);
              }
            });
          },

          // Se der erro ao listar avaliações do mentor:
          error: () => {
            // Desliga salvamento.
            this.salvandoAvaliacao.set(false);

            // Fecha o modal.
            this.modalAvaliacaoAberto.set(false);
          }
        });
      },

      // Se der erro ao criar a avaliação:
      error: () => {
        // Desliga salvamento.
        this.salvandoAvaliacao.set(false);

        // Mostra mensagem de erro.
        this.erroAvaliacao.set('Erro ao salvar avaliação. Tente novamente.');
      }
    });
  }
}

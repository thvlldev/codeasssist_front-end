// Importa recursos principais do Angular.
// Component declara a classe como componente.
// OnInit permite executar lógica quando o componente inicializa.
// inject permite injetar services diretamente.
// signal cria estados reativos.
import { Component, OnInit, inject, signal } from '@angular/core';

// Importa recursos comuns do Angular usados no template.
import { CommonModule } from '@angular/common';

// Permite trabalhar com formulários simples no template.
import { FormsModule } from '@angular/forms';

// forkJoin executa várias requisições ao mesmo tempo.
// map transforma valores emitidos por Observables.
import { forkJoin, map } from 'rxjs';

// Permite fazer requisições HTTP diretas.
import { HttpClient } from '@angular/common/http';

// Service responsável por informações do usuário logado e autenticação.
import { AuthService } from '../../services/auth.service';

// Service responsável por operações com usuários.
import { UsuarioService } from '../../services/usuario.service';

// Service responsável por operações com clientes.
import { ClienteService } from '../../services/cliente.service';

// Service responsável por operações com mentores.
import { MentorService } from '../../services/mentor.service';

// Service responsável por listar tecnologias.
import { TecnologiaService } from '../../services/tecnologia.service';

// Service responsável pela relação entre usuário e tecnologia.
import { UsuarioTecnologiaService } from '../../services/usuario_tecnologia.service';

// Service responsável por avaliações.
import { AvaliacaoService } from '../../services/avaliacao.service';

// Service responsável pelas opções de perguntas do onboarding/cadastro.
import { OpcaoPerguntaService } from '../../services/opcao_pergunta.service';

// Service responsável por publicações.
import { PublicacaoService } from '../../services/publicacao.service';

// Importa a URL base da API.
import { environment } from '../../../environments/environment';

// Modelo de usuário.
import { Usuario } from '../../model/usuario.model';

// Modelo de cliente.
import { Cliente } from '../../model/cliente.model';

// Modelo de mentor.
import { Mentor } from '../../model/mentor.model';

// Modelo de tecnologia.
import { Tecnologia } from '../../model/tecnologia.model';

// Modelo da relação entre usuário e tecnologia.
import { UsuarioTecnologia } from '../../model/usuario_tecnologia.model';

// Modelo de avaliação.
import { Avaliacao } from '../../model/avaliacao.model';

// Modelo das opções de pergunta.
import { OpcaoPergunta } from '../../model/opcao_pergunta.model';

// Modelo de publicação.
import { Publicacao } from '../../model/publicacao.model';

// Interface que estende Avaliacao.
// Ela mantém os dados da avaliação e adiciona o nome do cliente,
// para que a tela consiga mostrar quem fez a avaliação.
interface AvaliacaoComCliente extends Avaliacao {
  nomeCliente?: string;
}

// Configuração do componente Angular.
@Component({
  // Nome do seletor usado para representar este componente no HTML.
  selector: 'app-perfil',

  // Indica que o componente é standalone, ou seja, não depende de NgModule.
  standalone: true,

  // Define os módulos que o template deste componente pode usar.
  imports: [CommonModule, FormsModule],

  // Arquivo HTML do componente.
  templateUrl: './perfil.html',

  // Arquivo CSS do componente.
  styleUrls: ['./perfil.css']
})
export class PerfilComponent implements OnInit {
  // Injeta o AuthService para pegar o usuário logado e dados da sessão.
  private authService = inject(AuthService);

  // Injeta o UsuarioService para buscar e atualizar dados do usuário.
  private usuarioService = inject(UsuarioService);

  // Injeta o ClienteService para buscar e atualizar perfil de cliente.
  private clienteService = inject(ClienteService);

  // Injeta o MentorService para buscar e atualizar perfil de mentor.
  private mentorService = inject(MentorService);

  // Injeta o TecnologiaService para listar todas as tecnologias.
  private tecnologiaService = inject(TecnologiaService);

  // Injeta o UsuarioTecnologiaService para listar/criar/atualizar tecnologias do usuário.
  private usuarioTecnologiaService = inject(UsuarioTecnologiaService);

  // Injeta o AvaliacaoService para buscar avaliações do mentor.
  private avaliacaoService = inject(AvaliacaoService);

  // Injeta o OpcaoPerguntaService para buscar opções usadas no perfil do cliente.
  private opcaoPerguntaService = inject(OpcaoPerguntaService);

  // Injeta o PublicacaoService para buscar publicações do cliente.
  private publicacaoService = inject(PublicacaoService);

  // Injeta o HttpClient para fazer requisições manuais, como buscar usuário por ID.
  private http = inject(HttpClient);

  // Guarda a URL base da API definida no environment.
  private readonly API_BASE = environment.apiServer;

  // Signal que guarda os dados principais do usuário logado.
  usuarioLogado        = signal<Usuario | null>(null);

  // Signal que guarda os dados de cliente, caso o usuário seja cliente.
  dadosCliente         = signal<Cliente | undefined>(undefined);

  // Signal que guarda os dados de mentor, caso o usuário seja mentor.
  dadosMentor          = signal<Mentor | undefined>(undefined);

  // Signal que guarda as tecnologias associadas ao usuário.
  tecnologiasDoUsuario = signal<Tecnologia[]>([]);

  // Signal que guarda as avaliações recebidas pelo mentor, já com nome do cliente.
  avaliacoesMentor     = signal<AvaliacaoComCliente[]>([]);

  // Signal que guarda as publicações feitas pelo cliente.
  publicacoesCliente   = signal<Publicacao[]>([]);

  // Signal que controla se a tela está carregando.
  loading              = signal(true);

  // Signal que guarda mensagem de erro geral do perfil.
  erroMsg              = signal('');

  // Modal tecnologias (mentor) — mesmo padrão do dashboard

  // Controla se o modal de tecnologias está aberto.
  modalAberto             = signal(false);

  // Controla se o modal de tecnologias está carregando dados.
  modalLoading            = signal(false);

  // Guarda mensagem de erro do modal de tecnologias.
  modalErro               = signal('');

  // Guarda todas as tecnologias disponíveis para seleção.
  todasTecnologias        = signal<Tecnologia[]>([]);

  // Guarda os IDs das tecnologias selecionadas no modal.
  tecnologiasSelecionadas = signal<number[]>([]);

  // Controla se as tecnologias estão sendo salvas.
  salvandoTecnologias     = signal(false);

  // Modal editar perfil (cliente)

  // Controla se o modal de edição do cliente está aberto.
  modalEdicaoAberto    = signal(false);

  // Controla se a edição do cliente está sendo salva.
  salvandoEdicao       = signal(false);

  // Guarda mensagem de erro da edição do cliente.
  erroEdicao           = signal('');

  // Guarda opções de stack vindas das opções de pergunta.
  opcoesStack          = signal<OpcaoPergunta[]>([]);

  // Guarda temporariamente os dados editáveis do perfil de cliente.
  edicao = signal({
    nome: '',
    descricao: '',
    stack: ''
  });

  // Modal editar perfil (mentor)

  // Controla se o modal de edição do mentor está aberto.
  modalEdicaoMentorAberto = signal(false);

  // Controla se a edição do mentor está sendo salva.
  salvandoEdicaoMentor    = signal(false);

  // Guarda mensagem de erro da edição do mentor.
  erroEdicaoMentor        = signal('');

  // Guarda temporariamente os dados editáveis do perfil de mentor.
  edicaoMentor = signal({
    nome: '',
    descricao: '',
    precoHora: 0
  });

  // Método executado automaticamente quando o componente é inicializado.
  ngOnInit(): void {
    // Ao abrir a tela de perfil, carrega os dados do perfil.
    this.carregarDadosPerfil();
  }

  // Carrega todos os dados necessários para montar a tela de perfil.
  carregarDadosPerfil(): void {
    // Pega o ID do usuário logado a partir do AuthService.
    const id = this.authService.getUsuarioId();

    // Se não existir usuário logado, exibe erro e para o carregamento.
    if (!id) {
      this.erroMsg.set('Usuário não autenticado.');
      this.loading.set(false);
      return;
    }

    // Liga o estado de loading.
    this.loading.set(true);

    // Busca os dados principais do usuário pelo ID.
    this.usuarioService.buscarPorId(id).subscribe({
      // Quando encontrar o usuário:
      next: (usuario) => {
        // Salva o usuário no signal usuarioLogado.
        this.usuarioLogado.set(usuario);

        // Se tipoUsuario for 0, o usuário é tratado como cliente.
        if (usuario.tipoUsuario === 0) {
          // Busca em paralelo:
          // 1. o perfil de cliente;
          // 2. as publicações feitas por esse usuário.
          forkJoin({
            perfil: this.clienteService.buscarPorUsuarioId(id),
            publicacoes: this.publicacaoService.listarPorUsuario(id)
          }).subscribe({
            // Quando as duas requisições terminarem:
            next: (res) => {
              // Salva os dados de cliente.
              this.dadosCliente.set(res.perfil);

              // Salva as publicações do cliente, removendo as de status 0.
              this.publicacoesCliente.set(res.publicacoes.filter(p => p.status !== 0));

              // Desliga o loading.
              this.loading.set(false);
            },

            // Se der erro, apenas desliga o loading.
            error: () => this.loading.set(false)
          });

        // Se tipoUsuario for 1, o usuário é tratado como mentor.
        } else if (usuario.tipoUsuario === 1) {
          // Busca em paralelo:
          // 1. perfil de mentor;
          // 2. tecnologias vinculadas ao usuário;
          // 3. avaliações recebidas pelo mentor.
          forkJoin({
            perfil: this.mentorService.buscarPorUsuarioId(id),
            techs: this.usuarioTecnologiaService.listarPorUsuario(id),
            feedbacks: this.avaliacaoService.listarPorMentor(id)
          }).subscribe({
            // Quando as três requisições terminarem:
            next: (res) => {
              // Salva os dados do mentor.
              this.dadosMentor.set(res.perfil);

              // Converte as relações usuário-tecnologia em nomes/dados de tecnologias.
              this.filtrarNomesTecnologias(res.techs);

              // Se o mentor não tiver avaliações, zera a lista e finaliza carregamento.
              if (!res.feedbacks || res.feedbacks.length === 0) {
                this.avaliacoesMentor.set([]);
                this.loading.set(false);
                return;
              }

              // Para cada avaliação recebida, cria uma requisição para buscar o cliente avaliador.
              const reqs$ = res.feedbacks.map(av =>
                // Busca o usuário cliente pelo clienteUsuarioId da avaliação.
                this.http.get<any>(`${this.API_BASE}/usuarios/${av.clienteUsuarioId}`).pipe(
                  // Adiciona o nome do cliente dentro do objeto de avaliação.
                  map(user => ({ ...av, nomeCliente: user.nome }))
                )
              );

              // Executa todas as requisições de busca dos clientes em paralelo.
              forkJoin(reqs$).subscribe({
                // Quando todas as avaliações forem enriquecidas com nome do cliente:
                next: (completos) => {
                  // Salva as avaliações completas.
                  this.avaliacoesMentor.set(completos);

                  // Desliga loading.
                  this.loading.set(false);
                },

                // Se der erro ao buscar os nomes dos clientes:
                error: () => {
                  // Usa nome genérico como fallback.
                  this.avaliacoesMentor.set(
                    res.feedbacks.map(f => ({ ...f, nomeCliente: 'Usuário do Sistema' }))
                  );

                  // Desliga loading.
                  this.loading.set(false);
                }
              });
            },

            // Se der erro ao buscar dados do mentor:
            error: () => this.loading.set(false)
          });

        } else {
          // Se tipoUsuario não for cliente nem mentor, apenas encerra o loading.
          this.loading.set(false);
        }
      },

      // Se der erro ao buscar o usuário principal:
      error: () => {
        // Exibe mensagem de erro.
        this.erroMsg.set('Erro ao carregar os dados do perfil.');

        // Desliga loading.
        this.loading.set(false);
      }
    });
  }

  // Recebe relações UsuarioTecnologia e transforma isso em lista real de tecnologias.
  private filtrarNomesTecnologias(relacoes: UsuarioTecnologia[]): void {
    // Se não houver relações, zera as tecnologias do usuário.
    if (!relacoes || relacoes.length === 0) {
      this.tecnologiasDoUsuario.set([]);
      return;
    }

    // Busca todas as tecnologias cadastradas.
    this.tecnologiaService.listarTodas().subscribe({
      next: (todasTechs) => {
        // Filtra relações ativas e extrai apenas os IDs das tecnologias vinculadas.
        const idsVinculados = relacoes.filter(r => r.status === 1).map(r => r.tecnologiaId);

        // Mantém apenas as tecnologias cujo ID aparece nos vínculos ativos.
        this.tecnologiasDoUsuario.set(todasTechs.filter(t => idsVinculados.includes(t.id)));
      }
    });
  }

  // ── Stats cliente ──────────────────────────────────────────────────────

  // Retorna o total de publicações do cliente.
  get totalPublicacoes(): number {
    return this.publicacoesCliente().length;
  }

  // Retorna quantas publicações do cliente estão abertas.
  get publicacoesAbertas(): number {
    return this.publicacoesCliente().filter(p => p.status === 1).length;
  }

  // Retorna quantas publicações do cliente estão finalizadas.
  get publicacoesFinalizadas(): number {
    return this.publicacoesCliente().filter(p => p.status === 3).length;
  }

  // Converte o status numérico da publicação em texto.
  getLabelStatusPublicacao(status: number): string {
    switch (status) {
      case 1: return 'Aberta';
      case 2: return 'Em Andamento';
      case 3: return 'Finalizada';
      default: return 'Desconhecida';
    }
  }

  // Retorna classes CSS de acordo com o status da publicação.
  getClasseStatusPublicacao(status: number): string {
    switch (status) {
      case 1: return 'bg-success-subtle text-success';
      case 2: return 'bg-warning-subtle text-warning';
      case 3: return 'bg-secondary-subtle text-secondary';
      default: return 'bg-light text-muted';
    }
  }

  // ── Modal editar perfil (cliente) ──────────────────────────────────────

  // Abre o modal de edição do perfil do cliente.
  abrirModalEdicao(): void {
    // Lê o usuário atual do signal.
    const usuario = this.usuarioLogado();

    // Lê os dados de cliente do signal.
    const cliente = this.dadosCliente();

    // Se não houver usuário carregado, não abre edição.
    if (!usuario) return;

    // Preenche o formulário de edição com os dados atuais.
    this.edicao.set({
      nome: usuario.nome,
      descricao: cliente?.descricao ?? '',
      stack: cliente?.stack ?? ''
    });

    // Limpa erro anterior.
    this.erroEdicao.set('');

    // Busca opções da pergunta 1, que neste caso são opções de stack.
    this.opcaoPerguntaService.listarPorPergunta(1).subscribe({
      // Salva apenas opções ativas.
      next: (opcoes) => this.opcoesStack.set(opcoes.filter(o => o.status !== 0)),

      // Se der erro, deixa a lista vazia.
      error: () => this.opcoesStack.set([])
    });

    // Abre o modal de edição.
    this.modalEdicaoAberto.set(true);
  }

  // Fecha o modal de edição do cliente.
  fecharModalEdicao(): void {
    this.modalEdicaoAberto.set(false);
  }

  // Atualiza a stack escolhida no formulário de edição.
  selecionarStack(descricao: string): void {
    this.edicao.set({ ...this.edicao(), stack: descricao });
  }

  // Atualiza o nome no formulário de edição a partir do input.
  atualizarNomeEdicao(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.edicao.set({ ...this.edicao(), nome: valor });
  }

  // Atualiza a descrição no formulário de edição a partir do textarea.
  atualizarDescricaoEdicao(event: Event): void {
    const valor = (event.target as HTMLTextAreaElement).value;
    this.edicao.set({ ...this.edicao(), descricao: valor });
  }

  // Salva as alterações do perfil de cliente.
  salvarEdicao(): void {
    // Pega o ID do usuário logado.
    const usuarioId = this.authService.getUsuarioId();

    // Lê o usuário atual.
    const usuario = this.usuarioLogado();

    // Lê os dados de cliente atuais.
    const cliente = this.dadosCliente();

    // Se não houver ID ou usuário, interrompe.
    if (!usuarioId || !usuario) return;

    // Liga o estado de salvamento.
    this.salvandoEdicao.set(true);

    // Limpa erro anterior.
    this.erroEdicao.set('');

    // Cria uma cópia atualizada do usuário, alterando o nome.
    const usuarioAtualizado = { ...usuario, nome: this.edicao().nome };

    // Cria o objeto atualizado do cliente.
    const clienteAtualizado = {
      usuarioId,
      stack: this.edicao().stack,
      descricao: this.edicao().descricao,
      onboardingConcluido: cliente?.onboardingConcluido ?? 1,
      status: cliente?.status ?? 1
    };

    // Atualiza em paralelo:
    // 1. dados principais do usuário;
    // 2. dados específicos do cliente.
    forkJoin([
      this.usuarioService.atualizar(usuarioId, usuarioAtualizado),
      this.clienteService.atualizar(usuarioId, clienteAtualizado)
    ]).subscribe({
      // Se salvar com sucesso:
      next: () => {
        // Desliga salvamento.
        this.salvandoEdicao.set(false);

        // Fecha modal.
        this.modalEdicaoAberto.set(false);

        // Recarrega dados atualizados do perfil.
        this.carregarDadosPerfil();
      },

      // Se der erro:
      error: () => {
        // Desliga salvamento.
        this.salvandoEdicao.set(false);

        // Exibe erro.
        this.erroEdicao.set('Erro ao salvar as alterações. Tente novamente.');
      }
    });
  }

  // ── Modal tecnologias (mentor) ─────────────────────────────────────────

  // Abre o modal de tecnologias do mentor.
  abrirModalTecnologias(): void {
    // Pega o ID do usuário logado.
    const usuarioId = this.authService.getUsuarioId();

    // Se não houver usuário, interrompe.
    if (!usuarioId) return;

    // Limpa erro anterior.
    this.modalErro.set('');

    // Liga loading do modal.
    this.modalLoading.set(true);

    // Limpa lista de tecnologias antes de carregar.
    this.todasTecnologias.set([]);

    // Limpa selecionadas antes de carregar.
    this.tecnologiasSelecionadas.set([]);

    // Abre o modal.
    this.modalAberto.set(true);

    // Busca em paralelo:
    // 1. todas as tecnologias;
    // 2. tecnologias vinculadas ao usuário.
    forkJoin([
      this.tecnologiaService.listarTodas(),
      this.usuarioTecnologiaService.listarPorUsuario(usuarioId)
    ]).subscribe({
      // Quando as duas listas chegarem:
      next: ([todas, doUsuario]) => {
        // Salva apenas tecnologias ativas.
        this.todasTecnologias.set(todas.filter(t => t.status !== 0));

        // Salva os IDs das tecnologias que já estão ativas para esse usuário.
        this.tecnologiasSelecionadas.set(
          doUsuario.filter(ut => ut.status !== 0).map(ut => ut.tecnologiaId)
        );

        // Desliga loading do modal.
        this.modalLoading.set(false);
      },

      // Se der erro ao carregar tecnologias:
      error: () => {
        // Exibe erro.
        this.modalErro.set('Erro ao carregar lista de tecnologias. Tente novamente.');

        // Desliga loading.
        this.modalLoading.set(false);
      }
    });
  }

  // Fecha o modal de tecnologias.
  fecharModalTecnologias(): void {
    this.modalAberto.set(false);
  }

  // Marca ou desmarca uma tecnologia no modal.
  toggleTecnologia(id: number): void {
    // Lê a lista atual de tecnologias selecionadas.
    const selecionadas = this.tecnologiasSelecionadas();

    // Procura o ID da tecnologia dentro da lista.
    const idx = selecionadas.indexOf(id);

    // Se encontrou, significa que já estava selecionada.
    if (idx >= 0) {
      // Remove a tecnologia selecionada.
      this.tecnologiasSelecionadas.set(selecionadas.filter(t => t !== id));
    } else {
      // Se não estava selecionada, adiciona ao array.
      this.tecnologiasSelecionadas.set([...selecionadas, id]);
    }
  }

  // Verifica se uma tecnologia está selecionada.
  tecnologiaEstaAtiva(id: number): boolean {
    return this.tecnologiasSelecionadas().includes(id);
  }

  // Salva as tecnologias escolhidas pelo mentor.
  salvarTecnologias(): void {
    // Pega o ID do usuário logado.
    const usuarioId = this.authService.getUsuarioId();

    // Se não houver usuário, interrompe.
    if (!usuarioId) return;

    // Liga estado de salvamento.
    this.salvandoTecnologias.set(true);

    // Limpa erro anterior.
    this.modalErro.set('');

    // Busca os vínculos atuais entre usuário e tecnologias.
    this.usuarioTecnologiaService.listarPorUsuario(usuarioId).subscribe({
      // Quando receber os vínculos existentes:
      next: (existentes) => {
        // Considera apenas vínculos ativos.
        const ativas = existentes.filter(ut => ut.status !== 0);

        // Extrai os IDs das tecnologias já existentes.
        const idsExistentes = ativas.map(ut => ut.tecnologiaId);

        // Lê os IDs atualmente selecionados no modal.
        const selecionadas = this.tecnologiasSelecionadas();

        // Descobre quais tecnologias estão selecionadas agora,
        // mas ainda não existiam antes.
        const adicionar = selecionadas.filter(id => !idsExistentes.includes(id));

        // Descobre quais tecnologias existiam antes,
        // mas agora foram desmarcadas.
        const remover = ativas.filter(ut => !selecionadas.includes(ut.tecnologiaId));

        // Monta a lista de operações HTTP:
        // criar novas tecnologias selecionadas
        // e atualizar para status 0 as tecnologias removidas.
        const ops = [
          ...adicionar.map(techId =>
            this.usuarioTecnologiaService.criar({ usuarioId, tecnologiaId: techId, status: 1 })
          ),
          ...remover.map(ut =>
            this.usuarioTecnologiaService.atualizar(usuarioId, ut.tecnologiaId, 0)
          )
        ];

        // Se não houver nada para adicionar ou remover:
        if (ops.length === 0) {
          // Desliga salvamento.
          this.salvandoTecnologias.set(false);

          // Fecha modal.
          this.modalAberto.set(false);

          // Encerra o método.
          return;
        }

        // Executa todas as operações em paralelo.
        forkJoin(ops).subscribe({
          // Se tudo salvar com sucesso:
          next: () => {
            // Desliga salvamento.
            this.salvandoTecnologias.set(false);

            // Fecha modal.
            this.modalAberto.set(false);

            // Recarrega perfil para atualizar tecnologias exibidas.
            this.carregarDadosPerfil();
          },

          // Se der erro ao salvar:
          error: () => {
            // Desliga salvamento.
            this.salvandoTecnologias.set(false);

            // Exibe mensagem de erro.
            this.modalErro.set('Erro ao salvar tecnologias. Tente novamente.');
          }
        });
      },

      // Se der erro ao listar tecnologias do usuário:
      error: () => {
        // Desliga salvamento.
        this.salvandoTecnologias.set(false);

        // Exibe mensagem de erro.
        this.modalErro.set('Erro ao salvar tecnologias. Tente novamente.');
      }
    });
  }

  // ── Modal editar perfil (mentor) ────────────────────────────────────────

  // Abre o modal de edição do perfil do mentor.
  abrirModalEdicaoMentor(): void {
    // Lê o usuário logado.
    const usuario = this.usuarioLogado();

    // Lê os dados do mentor.
    const mentor = this.dadosMentor();

    // Se não houver usuário, interrompe.
    if (!usuario) return;

    // Preenche o formulário de edição com os dados atuais.
    this.edicaoMentor.set({
      nome: usuario.nome,
      descricao: mentor?.descricao ?? '',
      precoHora: mentor?.precoHora ?? 0
    });

    // Limpa erro anterior.
    this.erroEdicaoMentor.set('');

    // Abre modal de edição do mentor.
    this.modalEdicaoMentorAberto.set(true);
  }

  // Fecha o modal de edição do mentor.
  fecharModalEdicaoMentor(): void {
    this.modalEdicaoMentorAberto.set(false);
  }

  // Atualiza o nome no formulário de edição do mentor.
  atualizarNomeEdicaoMentor(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.edicaoMentor.set({ ...this.edicaoMentor(), nome: valor });
  }

  // Atualiza a descrição no formulário de edição do mentor.
  atualizarDescricaoEdicaoMentor(event: Event): void {
    const valor = (event.target as HTMLTextAreaElement).value;
    this.edicaoMentor.set({ ...this.edicaoMentor(), descricao: valor });
  }

  // Atualiza o preço por hora no formulário de edição do mentor.
  atualizarPrecoHoraEdicaoMentor(event: Event): void {
    const valor = Number((event.target as HTMLInputElement).value) || 0;
    this.edicaoMentor.set({ ...this.edicaoMentor(), precoHora: valor });
  }

  // Salva alterações do perfil de mentor.
  salvarEdicaoMentor(): void {
    // Pega ID do usuário logado.
    const usuarioId = this.authService.getUsuarioId();

    // Lê usuário atual.
    const usuario = this.usuarioLogado();

    // Lê mentor atual.
    const mentor = this.dadosMentor();

    // Se faltar usuário ou ID, interrompe.
    if (!usuarioId || !usuario) return;

    // Liga estado de salvamento.
    this.salvandoEdicaoMentor.set(true);

    // Limpa erro anterior.
    this.erroEdicaoMentor.set('');

    // Atualiza os dados principais do usuário, especificamente o nome.
    const usuarioAtualizado = { ...usuario, nome: this.edicaoMentor().nome };

    // Monta objeto atualizado do mentor.
    const mentorAtualizado = {
      usuarioId,
      descricao: this.edicaoMentor().descricao,
      precoHora: this.edicaoMentor().precoHora,
      onboardingConcluido: mentor?.onboardingConcluido ?? 1,
      status: mentor?.status ?? 1
    };

    // Atualiza em paralelo:
    // 1. dados principais do usuário;
    // 2. dados específicos do mentor.
    forkJoin([
      this.usuarioService.atualizar(usuarioId, usuarioAtualizado),
      this.mentorService.atualizar(usuarioId, mentorAtualizado)
    ]).subscribe({
      // Se salvar com sucesso:
      next: () => {
        // Desliga salvamento.
        this.salvandoEdicaoMentor.set(false);

        // Fecha modal.
        this.modalEdicaoMentorAberto.set(false);

        // Recarrega perfil atualizado.
        this.carregarDadosPerfil();
      },

      // Se der erro:
      error: () => {
        // Desliga salvamento.
        this.salvandoEdicaoMentor.set(false);

        // Exibe mensagem de erro.
        this.erroEdicaoMentor.set('Erro ao salvar as alterações. Tente novamente.');
      }
    });
  }

  // ── Utilitários ───────────────────────────────────────────────────────

  // Gera as iniciais de um nome para exibir no avatar.
  getIniciais(nome?: string): string {
    // Se não houver nome, retorna US como padrão.
    if (!nome) return 'US';

    // Divide o nome em partes usando espaço.
    const partes = nome.split(' ');

    // Se houver mais de uma palavra, pega a primeira letra das duas primeiras.
    // Caso contrário, pega a primeira letra do único nome.
    return partes.length > 1
      ? (partes[0][0] + partes[1][0]).toUpperCase()
      : partes[0][0].toUpperCase();
  }

  // Formata uma data do padrão yyyy-mm-dd para dd/mm/yyyy.
  formatarData(dataStr?: string): string {
    // Se não houver data, retorna string vazia.
    if (!dataStr) return '';

    // Divide a data pelo hífen.
    const partes = dataStr.split('-');

    // Se a data tiver três partes, reorganiza para dia/mês/ano.
    // Caso contrário, retorna a string original.
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataStr;
  }

  // Gera um array para representar estrelas preenchidas com base na nota.
  gerarEstrelas(nota: number): number[] {
    // Arredonda a nota para baixo e cria um array com essa quantidade de posições.
    return Array(Math.floor(nota || 0)).fill(0);
  }
}

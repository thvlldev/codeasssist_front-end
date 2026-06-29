import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { ClienteService } from '../../services/cliente.service';
import { MentorService } from '../../services/mentor.service';
import { TecnologiaService } from '../../services/tecnologia.service';
import { UsuarioTecnologiaService } from '../../services/usuario_tecnologia.service';
import { AvaliacaoService } from '../../services/avaliacao.service';
import { OpcaoPerguntaService } from '../../services/opcao_pergunta.service';
import { PublicacaoService } from '../../services/publicacao.service';

import { environment } from '../../../environments/environment';
import { Usuario } from '../../model/usuario.model';
import { Cliente } from '../../model/cliente.model';
import { Mentor } from '../../model/mentor.model';
import { Tecnologia } from '../../model/tecnologia.model';
import { UsuarioTecnologia } from '../../model/usuario_tecnologia.model';
import { Avaliacao } from '../../model/avaliacao.model';
import { OpcaoPergunta } from '../../model/opcao_pergunta.model';
import { Publicacao } from '../../model/publicacao.model';

interface AvaliacaoComCliente extends Avaliacao {
  nomeCliente?: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css']
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private clienteService = inject(ClienteService);
  private mentorService = inject(MentorService);
  private tecnologiaService = inject(TecnologiaService);
  private usuarioTecnologiaService = inject(UsuarioTecnologiaService);
  private avaliacaoService = inject(AvaliacaoService);
  private opcaoPerguntaService = inject(OpcaoPerguntaService);
  private publicacaoService = inject(PublicacaoService);
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  usuarioLogado        = signal<Usuario | null>(null);
  dadosCliente         = signal<Cliente | undefined>(undefined);
  dadosMentor          = signal<Mentor | undefined>(undefined);
  tecnologiasDoUsuario = signal<Tecnologia[]>([]);
  avaliacoesMentor     = signal<AvaliacaoComCliente[]>([]);
  publicacoesCliente   = signal<Publicacao[]>([]);
  loading              = signal(true);
  erroMsg              = signal('');

  // Modal tecnologias (mentor) — mesmo padrão do dashboard
  modalAberto             = signal(false);
  modalLoading            = signal(false);
  modalErro               = signal('');
  todasTecnologias        = signal<Tecnologia[]>([]);
  tecnologiasSelecionadas = signal<number[]>([]);
  salvandoTecnologias     = signal(false);

  // Modal editar perfil (cliente)
  modalEdicaoAberto    = signal(false);
  salvandoEdicao       = signal(false);
  erroEdicao           = signal('');
  opcoesStack          = signal<OpcaoPergunta[]>([]);
  edicao = signal({
    nome: '',
    descricao: '',
    stack: ''
  });

  // Modal editar perfil (mentor)
  modalEdicaoMentorAberto = signal(false);
  salvandoEdicaoMentor    = signal(false);
  erroEdicaoMentor        = signal('');
  edicaoMentor = signal({
    nome: '',
    descricao: '',
    precoHora: 0
  });

  ngOnInit(): void {
    this.carregarDadosPerfil();
  }

  carregarDadosPerfil(): void {
    const id = this.authService.getUsuarioId();
    if (!id) {
      this.erroMsg.set('Usuário não autenticado.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    this.usuarioService.buscarPorId(id).subscribe({
      next: (usuario) => {
        this.usuarioLogado.set(usuario);

        if (usuario.tipoUsuario === 0) {
          forkJoin({
            perfil: this.clienteService.buscarPorUsuarioId(id),
            publicacoes: this.publicacaoService.listarPorUsuario(id)
          }).subscribe({
            next: (res) => {
              this.dadosCliente.set(res.perfil);
              this.publicacoesCliente.set(res.publicacoes.filter(p => p.status !== 0));
              this.loading.set(false);
            },
            error: () => this.loading.set(false)
          });

        } else if (usuario.tipoUsuario === 1) {
          forkJoin({
            perfil: this.mentorService.buscarPorUsuarioId(id),
            techs: this.usuarioTecnologiaService.listarPorUsuario(id),
            feedbacks: this.avaliacaoService.listarPorMentor(id)
          }).subscribe({
            next: (res) => {
              this.dadosMentor.set(res.perfil);
              this.filtrarNomesTecnologias(res.techs);

              if (!res.feedbacks || res.feedbacks.length === 0) {
                this.avaliacoesMentor.set([]);
                this.loading.set(false);
                return;
              }

              const reqs$ = res.feedbacks.map(av =>
                this.http.get<any>(`${this.API_BASE}/usuarios/${av.clienteUsuarioId}`).pipe(
                  map(user => ({ ...av, nomeCliente: user.nome }))
                )
              );

              forkJoin(reqs$).subscribe({
                next: (completos) => {
                  this.avaliacoesMentor.set(completos);
                  this.loading.set(false);
                },
                error: () => {
                  this.avaliacoesMentor.set(
                    res.feedbacks.map(f => ({ ...f, nomeCliente: 'Usuário do Sistema' }))
                  );
                  this.loading.set(false);
                }
              });
            },
            error: () => this.loading.set(false)
          });

        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.erroMsg.set('Erro ao carregar os dados do perfil.');
        this.loading.set(false);
      }
    });
  }

  private filtrarNomesTecnologias(relacoes: UsuarioTecnologia[]): void {
    if (!relacoes || relacoes.length === 0) {
      this.tecnologiasDoUsuario.set([]);
      return;
    }
    this.tecnologiaService.listarTodas().subscribe({
      next: (todasTechs) => {
        const idsVinculados = relacoes.filter(r => r.status === 1).map(r => r.tecnologiaId);
        this.tecnologiasDoUsuario.set(todasTechs.filter(t => idsVinculados.includes(t.id)));
      }
    });
  }

  // ── Stats cliente ──────────────────────────────────────────────────────

  get totalPublicacoes(): number {
    return this.publicacoesCliente().length;
  }

  get publicacoesAbertas(): number {
    return this.publicacoesCliente().filter(p => p.status === 1).length;
  }

  get publicacoesFinalizadas(): number {
    return this.publicacoesCliente().filter(p => p.status === 3).length;
  }

  getLabelStatusPublicacao(status: number): string {
    switch (status) {
      case 1: return 'Aberta';
      case 2: return 'Em Andamento';
      case 3: return 'Finalizada';
      default: return 'Desconhecida';
    }
  }

  getClasseStatusPublicacao(status: number): string {
    switch (status) {
      case 1: return 'bg-success-subtle text-success';
      case 2: return 'bg-warning-subtle text-warning';
      case 3: return 'bg-secondary-subtle text-secondary';
      default: return 'bg-light text-muted';
    }
  }

  // ── Modal editar perfil (cliente) ──────────────────────────────────────

  abrirModalEdicao(): void {
    const usuario = this.usuarioLogado();
    const cliente = this.dadosCliente();
    if (!usuario) return;

    this.edicao.set({
      nome: usuario.nome,
      descricao: cliente?.descricao ?? '',
      stack: cliente?.stack ?? ''
    });
    this.erroEdicao.set('');

    this.opcaoPerguntaService.listarPorPergunta(1).subscribe({
      next: (opcoes) => this.opcoesStack.set(opcoes.filter(o => o.status !== 0)),
      error: () => this.opcoesStack.set([])
    });

    this.modalEdicaoAberto.set(true);
  }

  fecharModalEdicao(): void {
    this.modalEdicaoAberto.set(false);
  }

  selecionarStack(descricao: string): void {
    this.edicao.set({ ...this.edicao(), stack: descricao });
  }

  atualizarNomeEdicao(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.edicao.set({ ...this.edicao(), nome: valor });
  }

  atualizarDescricaoEdicao(event: Event): void {
    const valor = (event.target as HTMLTextAreaElement).value;
    this.edicao.set({ ...this.edicao(), descricao: valor });
  }

  salvarEdicao(): void {
    const usuarioId = this.authService.getUsuarioId();
    const usuario = this.usuarioLogado();
    const cliente = this.dadosCliente();
    if (!usuarioId || !usuario) return;

    this.salvandoEdicao.set(true);
    this.erroEdicao.set('');

    const usuarioAtualizado = { ...usuario, nome: this.edicao().nome };
    const clienteAtualizado = {
      usuarioId,
      stack: this.edicao().stack,
      descricao: this.edicao().descricao,
      onboardingConcluido: cliente?.onboardingConcluido ?? 1,
      status: cliente?.status ?? 1
    };

    forkJoin([
      this.usuarioService.atualizar(usuarioId, usuarioAtualizado),
      this.clienteService.atualizar(usuarioId, clienteAtualizado)
    ]).subscribe({
      next: () => {
        this.salvandoEdicao.set(false);
        this.modalEdicaoAberto.set(false);
        this.carregarDadosPerfil();
      },
      error: () => {
        this.salvandoEdicao.set(false);
        this.erroEdicao.set('Erro ao salvar as alterações. Tente novamente.');
      }
    });
  }

  // ── Modal tecnologias (mentor) ─────────────────────────────────────────

  abrirModalTecnologias(): void {
    const usuarioId = this.authService.getUsuarioId();
    if (!usuarioId) return;

    this.modalErro.set('');
    this.modalLoading.set(true);
    this.todasTecnologias.set([]);
    this.tecnologiasSelecionadas.set([]);
    this.modalAberto.set(true);

    forkJoin([
      this.tecnologiaService.listarTodas(),
      this.usuarioTecnologiaService.listarPorUsuario(usuarioId)
    ]).subscribe({
      next: ([todas, doUsuario]) => {
        this.todasTecnologias.set(todas.filter(t => t.status !== 0));
        this.tecnologiasSelecionadas.set(
          doUsuario.filter(ut => ut.status !== 0).map(ut => ut.tecnologiaId)
        );
        this.modalLoading.set(false);
      },
      error: () => {
        this.modalErro.set('Erro ao carregar lista de tecnologias. Tente novamente.');
        this.modalLoading.set(false);
      }
    });
  }

  fecharModalTecnologias(): void {
    this.modalAberto.set(false);
  }

  toggleTecnologia(id: number): void {
    const selecionadas = this.tecnologiasSelecionadas();
    const idx = selecionadas.indexOf(id);
    if (idx >= 0) {
      this.tecnologiasSelecionadas.set(selecionadas.filter(t => t !== id));
    } else {
      this.tecnologiasSelecionadas.set([...selecionadas, id]);
    }
  }

  tecnologiaEstaAtiva(id: number): boolean {
    return this.tecnologiasSelecionadas().includes(id);
  }

  salvarTecnologias(): void {
    const usuarioId = this.authService.getUsuarioId();
    if (!usuarioId) return;

    this.salvandoTecnologias.set(true);
    this.modalErro.set('');

    this.usuarioTecnologiaService.listarPorUsuario(usuarioId).subscribe({
      next: (existentes) => {
        const ativas = existentes.filter(ut => ut.status !== 0);
        const idsExistentes = ativas.map(ut => ut.tecnologiaId);
        const selecionadas = this.tecnologiasSelecionadas();

        const adicionar = selecionadas.filter(id => !idsExistentes.includes(id));
        const remover = ativas.filter(ut => !selecionadas.includes(ut.tecnologiaId));

        const ops = [
          ...adicionar.map(techId =>
            this.usuarioTecnologiaService.criar({ usuarioId, tecnologiaId: techId, status: 1 })
          ),
          ...remover.map(ut =>
            this.usuarioTecnologiaService.atualizar(usuarioId, ut.tecnologiaId, 0)
          )
        ];

        if (ops.length === 0) {
          this.salvandoTecnologias.set(false);
          this.modalAberto.set(false);
          return;
        }

        forkJoin(ops).subscribe({
          next: () => {
            this.salvandoTecnologias.set(false);
            this.modalAberto.set(false);
            this.carregarDadosPerfil();
          },
          error: () => {
            this.salvandoTecnologias.set(false);
            this.modalErro.set('Erro ao salvar tecnologias. Tente novamente.');
          }
        });
      },
      error: () => {
        this.salvandoTecnologias.set(false);
        this.modalErro.set('Erro ao salvar tecnologias. Tente novamente.');
      }
    });
  }

  // ── Modal editar perfil (mentor) ────────────────────────────────────────

  abrirModalEdicaoMentor(): void {
    const usuario = this.usuarioLogado();
    const mentor = this.dadosMentor();
    if (!usuario) return;

    this.edicaoMentor.set({
      nome: usuario.nome,
      descricao: mentor?.descricao ?? '',
      precoHora: mentor?.precoHora ?? 0
    });
    this.erroEdicaoMentor.set('');
    this.modalEdicaoMentorAberto.set(true);
  }

  fecharModalEdicaoMentor(): void {
    this.modalEdicaoMentorAberto.set(false);
  }

  atualizarNomeEdicaoMentor(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.edicaoMentor.set({ ...this.edicaoMentor(), nome: valor });
  }

  atualizarDescricaoEdicaoMentor(event: Event): void {
    const valor = (event.target as HTMLTextAreaElement).value;
    this.edicaoMentor.set({ ...this.edicaoMentor(), descricao: valor });
  }

  atualizarPrecoHoraEdicaoMentor(event: Event): void {
    const valor = Number((event.target as HTMLInputElement).value) || 0;
    this.edicaoMentor.set({ ...this.edicaoMentor(), precoHora: valor });
  }

  salvarEdicaoMentor(): void {
    const usuarioId = this.authService.getUsuarioId();
    const usuario = this.usuarioLogado();
    const mentor = this.dadosMentor();
    if (!usuarioId || !usuario) return;

    this.salvandoEdicaoMentor.set(true);
    this.erroEdicaoMentor.set('');

    const usuarioAtualizado = { ...usuario, nome: this.edicaoMentor().nome };
    const mentorAtualizado = {
      usuarioId,
      descricao: this.edicaoMentor().descricao,
      precoHora: this.edicaoMentor().precoHora,
      onboardingConcluido: mentor?.onboardingConcluido ?? 1,
      status: mentor?.status ?? 1
    };

    forkJoin([
      this.usuarioService.atualizar(usuarioId, usuarioAtualizado),
      this.mentorService.atualizar(usuarioId, mentorAtualizado)
    ]).subscribe({
      next: () => {
        this.salvandoEdicaoMentor.set(false);
        this.modalEdicaoMentorAberto.set(false);
        this.carregarDadosPerfil();
      },
      error: () => {
        this.salvandoEdicaoMentor.set(false);
        this.erroEdicaoMentor.set('Erro ao salvar as alterações. Tente novamente.');
      }
    });
  }

  // ── Utilitários ───────────────────────────────────────────────────────

  getIniciais(nome?: string): string {
    if (!nome) return 'US';
    const partes = nome.split(' ');
    return partes.length > 1
      ? (partes[0][0] + partes[1][0]).toUpperCase()
      : partes[0][0].toUpperCase();
  }

  formatarData(dataStr?: string): string {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataStr;
  }

  gerarEstrelas(nota: number): number[] {
    return Array(Math.floor(nota || 0)).fill(0);
  }
}
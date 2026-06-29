import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, map } from 'rxjs';

import { PublicacaoService } from '../../services/publicacao.service';
import { RespostaPublicacaoService } from '../../services/resposta_publicacao.service';
import { PublicacaoTecnologiaService } from '../../services/publicacao_tecnologia.service';
import { TecnologiaService } from '../../services/tecnologia.service';
import { AvaliacaoService } from '../../services/avaliacao.service';
import { MentorService } from '../../services/mentor.service';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import { Publicacao } from '../../model/publicacao.model';
import { RespostaPublicacao } from '../../model/resposta_publicacao.model';
import { Tecnologia } from '../../model/tecnologia.model';

interface RespostaComMentor extends RespostaPublicacao {
  nomeMentor?: string;
  emailMentor?: string;
  mentorUsuarioId?: number;
  jaAvaliou?: boolean;
}

@Component({
  selector: 'app-detalhe-publicacao',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './detalhe-publicacao.html',
  styleUrls: ['./detalhe-publicacao.css']
})
export class DetalhePublicacaoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private publicacaoService = inject(PublicacaoService);
  private respostaPublicacaoService = inject(RespostaPublicacaoService);
  private publicacaoTecnologiaService = inject(PublicacaoTecnologiaService);
  private tecnologiaService = inject(TecnologiaService);
  private avaliacaoService = inject(AvaliacaoService);
  private mentorService = inject(MentorService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private readonly API_BASE = environment.apiServer;

  publicacaoId!: number;
  publicacao!: Publicacao;
  tecnologias: Tecnologia[] = [];

  ehMentor = false;
  usuarioLogadoId!: number;
  carregando = true;
  processando = false;

  // Mentor
  novaPropostaConteudo = '';
  jaRespondeu = false;
  propostaEnviadaPorMim?: RespostaPublicacao;

  // Cliente
  propostasRecebidas: RespostaComMentor[] = [];

  // Modal avaliação
  modalAvaliacaoAberto = signal(false);
  propostaSendoAvaliada = signal<RespostaComMentor | null>(null);
  notaSelecionada = signal(0);
  notaHover = signal(0);
  comentarioAvaliacao = signal('');
  salvandoAvaliacao = signal(false);
  erroAvaliacao = signal('');

  ngOnInit(): void {
    this.usuarioLogadoId = this.authService.getUsuarioId() ?? 0;
    this.ehMentor = this.authService.getPapelAtivo() === 1;

    this.route.params.subscribe(params => {
      this.publicacaoId = +params['id'];
      if (this.publicacaoId) this.carregarDadosCompletos();
    });
  }

  // ── Labels de status ──────────────────────────────────────────────────

  getLabelStatusPublicacao(status: number): string {
    switch (status) {
      case 1: return 'Em aberto';
      case 2: return 'Em andamento';
      case 3: return 'Finalizada';
      default: return 'Desconhecido';
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

  // ── Permissões baseadas em status ─────────────────────────────────────

  get podeEnviarProposta(): boolean {
    return this.ehMentor && this.publicacao?.status === 1 && !this.jaRespondeu;
  }

  get podeAbrirChat(): boolean {
    // Cliente: publicacao em andamento (2) ou finalizada (3)
    // Mentor: sua resposta foi aceita (status 2) e publicacao em andamento (2) ou finalizada (3)
    if (!this.publicacao) return false;
    if (this.ehMentor) {
      return (this.publicacao.status === 2 || this.publicacao.status === 3)
        && this.propostaEnviadaPorMim?.status === 2;
    }
    return this.publicacao.status === 2 || this.publicacao.status === 3;
  }

  get podeAvaliar(): boolean {
    // Só quando publicacao finalizada (3)
    return !this.ehMentor && this.publicacao?.status === 3;
  }

  get chatFinalizado(): boolean {
    return this.publicacao?.status === 3;
  }

  // ── Carregamento ──────────────────────────────────────────────────────

  carregarDadosCompletos(): void {
    this.carregando = true;
    this.cdr.detectChanges();

    forkJoin([
      this.publicacaoService.buscarPorId(this.publicacaoId),
      this.publicacaoTecnologiaService.listarTodas(),
      this.tecnologiaService.listarTodas(),
      this.respostaPublicacaoService.listarPorPublicacao(this.publicacaoId)
    ]).subscribe({
      next: ([pub, relacoes, todasTechs, respostas]) => {
        this.publicacao = pub;

        const idsRelacionados = relacoes
          .filter(r => r.publicacaoId === pub.id)
          .map(r => r.tecnologiaId);
        this.tecnologias = todasTechs.filter(t => idsRelacionados.includes(t.id));

        // Filtra soft deletes
        const respostasAtivas = respostas.filter(r => r.status !== 0);

        if (this.ehMentor) {
          this.propostaEnviadaPorMim = respostasAtivas.find(r => r.usuarioId === this.usuarioLogadoId);
          this.jaRespondeu = !!this.propostaEnviadaPorMim;
          this.carregando = false;
          this.cdr.detectChanges();
          return;
        }

        if (respostasAtivas.length === 0) {
          this.propostasRecebidas = [];
          this.carregando = false;
          this.cdr.detectChanges();
          return;
        }

        forkJoin([
          forkJoin(respostasAtivas.map(resp =>
            this.http.get<any>(`${this.API_BASE}/usuarios/${resp.usuarioId}`).pipe(
              map(user => ({ ...resp, nomeMentor: user.nome, emailMentor: user.email, mentorUsuarioId: user.id }))
            )
          )),
          this.avaliacaoService.listarTodas()
        ]).subscribe({
          next: ([respostasComMentor, todasAvaliacoes]) => {
            this.propostasRecebidas = respostasComMentor.map(r => ({
              ...r,
              jaAvaliou: todasAvaliacoes.some(
                a => a.mentorUsuarioId === r.mentorUsuarioId
                  && a.clienteUsuarioId === this.usuarioLogadoId
                  && a.publicacaoId === this.publicacaoId
              )
            }));
            this.carregando = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.propostasRecebidas = respostasAtivas.map(r => ({ ...r, nomeMentor: 'Mentor Parceiro' }));
            this.carregando = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Ações do mentor ───────────────────────────────────────────────────

  enviarProposta(): void {
    if (!this.novaPropostaConteudo.trim()) return;

    this.respostaPublicacaoService.criar({
      conteudo: this.novaPropostaConteudo,
      usuarioId: this.usuarioLogadoId,
      publicacaoId: this.publicacaoId,
      status: 1
    }).subscribe({
      next: () => {
        this.novaPropostaConteudo = '';
        this.carregarDadosCompletos();
      },
      error: () => {}
    });
  }

  // ── Ações do cliente ──────────────────────────────────────────────────

  aceitarProposta(proposta: RespostaComMentor): void {
    if (this.processando) return;
    this.processando = true;
    this.cdr.detectChanges();

    // 1. Aceita a resposta escolhida (status 2)
    this.respostaPublicacaoService.atualizar(proposta.id, { ...proposta, status: 2 }).subscribe({
      next: () => {
        // 2. Rejeita todas as outras respostas pendentes (status 3)
        const outrasRespostas = this.propostasRecebidas.filter(
          r => r.id !== proposta.id && r.status === 1
        );

        const rejeicoes = outrasRespostas.map(r =>
          this.respostaPublicacaoService.atualizar(r.id, { ...r, status: 3 })
        );

        const atualizarPublicacao = () => {
          // 3. Muda status da publicacao para em andamento (2)
          this.publicacaoService.atualizar(this.publicacaoId, {
            ...this.publicacao, status: 2
          }).subscribe({
            next: () => {
              this.processando = false;
              // 4. Navega pro chat
              this.router.navigate(['/app/chat', proposta.id]);
            },
            error: () => {
              this.processando = false;
              this.cdr.detectChanges();
            }
          });
        };

        if (rejeicoes.length > 0) {
          forkJoin(rejeicoes).subscribe({
            next: () => atualizarPublicacao(),
            error: () => atualizarPublicacao() // continua mesmo se rejeição falhar
          });
        } else {
          atualizarPublicacao();
        }
      },
      error: () => {
        this.processando = false;
        this.cdr.detectChanges();
      }
    });
  }

  finalizarChat(proposta: RespostaComMentor): void {
    if (this.processando) return;
    this.processando = true;
    this.cdr.detectChanges();

    // Muda publicacao para finalizada (3)
    this.publicacaoService.atualizar(this.publicacaoId, {
      ...this.publicacao, status: 3
    }).subscribe({
      next: () => {
        this.processando = false;
        this.carregarDadosCompletos();
      },
      error: () => {
        this.processando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Modal avaliação ───────────────────────────────────────────────────

  abrirModalAvaliacao(proposta: RespostaComMentor): void {
    this.propostaSendoAvaliada.set(proposta);
    this.notaSelecionada.set(0);
    this.notaHover.set(0);
    this.comentarioAvaliacao.set('');
    this.erroAvaliacao.set('');
    this.modalAvaliacaoAberto.set(true);
  }

  fecharModalAvaliacao(): void {
    this.modalAvaliacaoAberto.set(false);
  }

  selecionarNota(nota: number): void { this.notaSelecionada.set(nota); }
  hoverNota(nota: number): void { this.notaHover.set(nota); }
  limparHover(): void { this.notaHover.set(0); }

  estrelaAtiva(index: number): boolean {
    const ref = this.notaHover() > 0 ? this.notaHover() : this.notaSelecionada();
    return index <= ref;
  }

  estrelas(): number[] { return [1, 2, 3, 4, 5]; }

  salvarAvaliacao(): void {
    if (this.notaSelecionada() === 0) {
      this.erroAvaliacao.set('Selecione uma nota de 1 a 5 estrelas.');
      return;
    }
    if (!this.comentarioAvaliacao().trim()) {
      this.erroAvaliacao.set('Escreva um comentário sobre a mentoria.');
      return;
    }

    const proposta = this.propostaSendoAvaliada()!;
    this.salvandoAvaliacao.set(true);
    this.erroAvaliacao.set('');

    this.avaliacaoService.criar({
      clienteUsuarioId: this.usuarioLogadoId,
      mentorUsuarioId: proposta.mentorUsuarioId!,
      valor: this.notaSelecionada(),
      comentario: this.comentarioAvaliacao(),
      publicacaoId: this.publicacaoId,
      status: 1
    }).subscribe({
      next: () => {
        this.avaliacaoService.listarPorMentor(proposta.mentorUsuarioId!).subscribe({
          next: (avaliacoes) => {
            const total = avaliacoes.reduce((soma, a) => soma + a.valor, 0);
            const media = parseFloat((total / avaliacoes.length).toFixed(1));

            this.mentorService.buscarPorUsuarioId(proposta.mentorUsuarioId!).subscribe({
              next: (mentor) => {
                if (mentor) {
                  this.mentorService.atualizar(proposta.mentorUsuarioId!, {
                    ...mentor, mediaAvaliacao: media
                  }).subscribe({
                    next: () => {
                      this.salvandoAvaliacao.set(false);
                      this.modalAvaliacaoAberto.set(false);
                      this.carregarDadosCompletos();
                    },
                    error: () => {
                      this.salvandoAvaliacao.set(false);
                      this.erroAvaliacao.set('Avaliação salva, mas erro ao atualizar média do mentor.');
                    }
                  });
                }
              },
              error: () => {
                this.salvandoAvaliacao.set(false);
                this.modalAvaliacaoAberto.set(false);
              }
            });
          },
          error: () => {
            this.salvandoAvaliacao.set(false);
            this.modalAvaliacaoAberto.set(false);
          }
        });
      },
      error: () => {
        this.salvandoAvaliacao.set(false);
        this.erroAvaliacao.set('Erro ao salvar avaliação. Tente novamente.');
      }
    });
  }
}
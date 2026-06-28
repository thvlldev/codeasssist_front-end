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

  ehMentor: boolean = false;
  usuarioLogadoId!: number;
  carregando: boolean = true;

  novaPropostaConteudo: string = '';
  jaRespondeu: boolean = false;
  propostaEnviadaPorMim?: RespostaPublicacao;

  propostasRecebidas: RespostaComMentor[] = [];

  modalAvaliacaoAberto = signal(false);
  propostaSendoAvaliada = signal<RespostaComMentor | null>(null);
  notaSelecionada = signal(0);
  notaHover = signal(0);
  comentarioAvaliacao = signal('');
  salvandoAvaliacao = signal(false);
  erroAvaliacao = signal('');

  ngOnInit(): void {
    this.usuarioLogadoId = this.authService.getUsuarioId() ?? 0;
    const papel = this.authService.getPapelAtivo();
    this.ehMentor = papel === 1;

    this.route.params.subscribe(params => {
      this.publicacaoId = +params['id'];
      if (this.publicacaoId) {
        this.carregarDadosCompletos();
      }
    });
  }

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

        if (this.ehMentor) {
          this.propostaEnviadaPorMim = respostas.find(r => r.usuarioId === this.usuarioLogadoId);
          this.jaRespondeu = !!this.propostaEnviadaPorMim;
          this.carregando = false;
          this.cdr.detectChanges();
          return;
        }

        if (respostas.length === 0) {
          this.propostasRecebidas = [];
          this.carregando = false;
          this.cdr.detectChanges();
          return;
        }

        forkJoin([
          forkJoin(respostas.map(resp =>
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
            this.propostasRecebidas = respostas.map(r => ({ ...r, nomeMentor: 'Mentor Parceiro' }));
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

  enviarProposta(): void {
    if (!this.novaPropostaConteudo.trim()) {
      alert('Por favor, descreva a sua proposta antes de enviar.');
      return;
    }

    const payloadProposta: any = {
      conteudo: this.novaPropostaConteudo,
      usuarioId: Number(this.usuarioLogadoId),
      publicacaoId: Number(this.publicacaoId),
      status: 1
    };

    this.respostaPublicacaoService.criar(payloadProposta).subscribe({
      next: () => {
        alert('Sua proposta de mentoria foi enviada com sucesso!');
        this.novaPropostaConteudo = '';
        this.carregarDadosCompletos();
      },
      error: () => {
        alert('Não foi possível enviar a proposta.');
      }
    });
  }

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

  selecionarNota(nota: number): void {
    this.notaSelecionada.set(nota);
  }

  hoverNota(nota: number): void {
    this.notaHover.set(nota);
  }

  limparHover(): void {
    this.notaHover.set(0);
  }

  estrelaAtiva(index: number): boolean {
    const referencia = this.notaHover() > 0 ? this.notaHover() : this.notaSelecionada();
    return index <= referencia;
  }

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

    const novaAvaliacao = {
      clienteUsuarioId: this.usuarioLogadoId,
      mentorUsuarioId: proposta.mentorUsuarioId!,
      valor: this.notaSelecionada(),
      comentario: this.comentarioAvaliacao(),
      publicacaoId: this.publicacaoId,
      status: 1
    };

    this.avaliacaoService.criar(novaAvaliacao).subscribe({
      next: () => {
        this.avaliacaoService.listarPorMentor(proposta.mentorUsuarioId!).subscribe({
          next: (avaliacoes) => {
            const total = avaliacoes.reduce((soma, a) => soma + a.valor, 0);
            const media = parseFloat((total / avaliacoes.length).toFixed(1));

            this.mentorService.buscarPorUsuarioId(proposta.mentorUsuarioId!).subscribe({
              next: (mentor) => {
                if (mentor) {
                  this.mentorService.atualizar(proposta.mentorUsuarioId!, {
                    ...mentor,
                    mediaAvaliacao: media
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

  estrelas(): number[] {
    return [1, 2, 3, 4, 5];
  }
}
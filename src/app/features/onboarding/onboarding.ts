import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of, switchMap, catchError } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { MentorService } from '../../services/mentor.service';
import { RespostaOpcaoService } from '../../services/resposta_opcao.service';
import { RespostaTextoService } from '../../services/resposta_texto.service';
import { TecnologiaService } from '../../services/tecnologia.service';
import { UsuarioTecnologiaService } from '../../services/usuario_tecnologia.service';
import { PerguntaCadastroService } from '../../services/pergunta_cadastro.service';
import { OpcaoPerguntaService } from '../../services/opcao_pergunta.service';

import { Tecnologia } from '../../model/tecnologia.model';
import { OpcaoPergunta } from '../../model/opcao_pergunta.model';
import { PerguntaCadastro } from '../../model/pergunta_cadastro.model';
import { TipoUsuario } from '../../shared/enums/TipoUsuario';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './onboarding.html',
  styleUrls: ['./onboarding.css']
})
export class OnboardingComponent implements OnInit {
  private authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private mentorService = inject(MentorService);
  private respostaOpcaoService = inject(RespostaOpcaoService);
  private respostaTextoService = inject(RespostaTextoService);
  private tecnologiaService = inject(TecnologiaService);
  private usuarioTecnologiaService = inject(UsuarioTecnologiaService);
  private perguntaCadastroService = inject(PerguntaCadastroService);
  private opcaoPerguntaService = inject(OpcaoPerguntaService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  readonly TipoUsuario = TipoUsuario;

  papelAtivo: TipoUsuario = TipoUsuario.Cliente;
  passoAtual: number = 0;
  carregando: boolean = false;

  passo = Object.assign(
    () => this.passoAtual,
    { set: (valor: number) => { this.passoAtual = valor; this.cdr.detectChanges(); } }
  );

  // Perguntas e opções do banco
  perguntas: PerguntaCadastro[] = [];
  opcoesPergunta1: OpcaoPergunta[] = []; // stacks cliente
  opcoesPergunta5: OpcaoPergunta[] = []; // tecnologias mentor
  todasTecnologias: Tecnologia[] = [];

  // Estado cliente
  respostas = {
    opcaoSelecionadaId: null as number | null,   // pergunta 1
    opcaoSelecionadaDescricao: '' as string,      // para atualizar stack
    uso: '',                                       // pergunta 2
    objetivo: ''                                   // pergunta 3
  };

  // Estado mentor
  mentorDados = {
    descricao: '',
    precoHora: null as number | null
  };
  tecnologiasDisponiveis: Tecnologia[] = [];
  tecnologiasSelecionadas: number[] = [];          // ids de tecnologias (pergunta 5)
  opcoesTecnologiaSelecionadas: number[] = [];     // ids das opcoes selecionadas para respostas-opcao

  get ehMentor(): boolean {
    return this.papelAtivo === TipoUsuario.Mentor;
  }

  ngOnInit(): void {
    this.papelAtivo = this.authService.getPapelAtivo() ?? TipoUsuario.Cliente;
    this.carregarDadosIniciais();
  }

  private carregarDadosIniciais(): void {
    forkJoin([
      this.perguntaCadastroService.listarTodas(),
      this.opcaoPerguntaService.listarTodas(),
      this.tecnologiaService.listarTodas()
    ]).subscribe({
      next: ([perguntas, opcoes, tecnologias]) => {
        this.perguntas = perguntas.filter(p => p.status !== 0);
        this.opcoesPergunta1 = opcoes.filter(o => o.perguntaCadastroId === 1 && o.status !== 0);
        this.opcoesPergunta5 = opcoes.filter(o => o.perguntaCadastroId === 5 && o.status !== 0);
        this.todasTecnologias = tecnologias.filter(t => t.status !== 0);
        this.tecnologiasDisponiveis = this.todasTecnologias;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar dados do onboarding:', err)
    });
  }

  getPergunta(id: number): string {
    return this.perguntas.find(p => p.id === id)?.enunciado ?? '';
  }

  // ===================== FLUXO CLIENTE =====================

  selecionarOpcaoPergunta1(opcao: OpcaoPergunta): void {
    this.respostas.opcaoSelecionadaId = opcao.id;
    this.respostas.opcaoSelecionadaDescricao = opcao.descricao;
    this.passo.set(2);
  }

  finalizar(): void {
    this.finalizarOnboardingCliente();
  }

  private finalizarOnboardingCliente(): void {
    const usuarioId = this.authService.getUsuarioId();
    if (!usuarioId) return;

    this.carregando = true;
    this.cdr.detectChanges();

    // Salva respostas em texto (perguntas 2 e 3)
    const respostasTexto$ = forkJoin([
      this.respostaTextoService.criar({
        clienteUsuarioId: usuarioId,
        perguntaCadastroId: 2,
        conteudo: this.respostas.uso,
        status: 1
      }),
      this.respostaTextoService.criar({
        clienteUsuarioId: usuarioId,
        perguntaCadastroId: 3,
        conteudo: this.respostas.objetivo,
        status: 1
      })
    ]).pipe(catchError(err => { console.warn('Erro ao salvar respostas-texto:', err); return of(null); }));

    // Salva resposta da opcao (pergunta 1)
    const respostaOpcao$ = this.respostas.opcaoSelecionadaId
      ? this.respostaOpcaoService.criar({
          clienteUsuarioId: usuarioId,
          opcaoPerguntaId: this.respostas.opcaoSelecionadaId,
          status: 1
        }).pipe(catchError(err => { console.warn('Erro ao salvar respostas-opcao:', err); return of(null); }))
      : of(null);

    forkJoin([respostasTexto$, respostaOpcao$]).pipe(
      switchMap(() => this.clienteService.buscarPorUsuarioId(usuarioId)),
      switchMap(clienteExistente => {
        const dadosAtualizados = {
          usuarioId,
          stack: this.respostas.opcaoSelecionadaDescricao || 'Não informado',
          descricao: this.respostas.uso || '',
          status: clienteExistente?.status ?? 1,
          onboardingConcluido: 1
        };
        return this.clienteService.atualizar(usuarioId, dadosAtualizados);
      })
    ).subscribe({
      next: () => {
        this.carregando = false;
        this.cdr.detectChanges();
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        console.error('Erro ao finalizar onboarding cliente:', err);
        this.carregando = false;
        this.cdr.detectChanges();
        this.router.navigate(['/app/dashboard']);
      }
    });
  }

  // ===================== FLUXO MENTOR =====================

  alternarTecnologia(tecnologiaId: number): void {
    const idxTech = this.tecnologiasSelecionadas.indexOf(tecnologiaId);
    if (idxTech >= 0) {
      this.tecnologiasSelecionadas.splice(idxTech, 1);
    } else {
      this.tecnologiasSelecionadas.push(tecnologiaId);
    }

    // Encontra a opcao correspondente pela descricao == nome da tecnologia
    const tech = this.todasTecnologias.find(t => t.id === tecnologiaId);
    if (tech) {
      const opcao = this.opcoesPergunta5.find(o => o.descricao === tech.nome);
      if (opcao) {
        const idxOpcao = this.opcoesTecnologiaSelecionadas.indexOf(opcao.id);
        if (idxOpcao >= 0) {
          this.opcoesTecnologiaSelecionadas.splice(idxOpcao, 1);
        } else {
          this.opcoesTecnologiaSelecionadas.push(opcao.id);
        }
      }
    }
  }

  tecnologiaSelecionada(tecnologiaId: number): boolean {
    return this.tecnologiasSelecionadas.includes(tecnologiaId);
  }

  avancarParaPrecoHora(): void {
    this.passo.set(3);
  }

  finalizarOnboardingMentor(): void {
    const usuarioId = this.authService.getUsuarioId();
    if (!usuarioId) return;

    this.carregando = true;
    this.cdr.detectChanges();

    // Salva respostas texto (perguntas 4 e 6)
    const respostasTexto$ = forkJoin([
      this.respostaTextoService.criar({
        clienteUsuarioId: usuarioId,
        perguntaCadastroId: 4,
        conteudo: this.mentorDados.descricao,
        status: 1
      }),
      this.respostaTextoService.criar({
        clienteUsuarioId: usuarioId,
        perguntaCadastroId: 6,
        conteudo: String(this.mentorDados.precoHora),
        status: 1
      })
    ]).pipe(catchError(err => { console.warn('Erro ao salvar respostas-texto mentor:', err); return of(null); }));

    // Salva respostas-opcao da pergunta 5 (uma por tecnologia selecionada)
    const respostasOpcao$ = this.opcoesTecnologiaSelecionadas.length > 0
      ? forkJoin(this.opcoesTecnologiaSelecionadas.map(opcaoId =>
          this.respostaOpcaoService.criar({
            clienteUsuarioId: usuarioId,
            opcaoPerguntaId: opcaoId,
            status: 1
          })
        )).pipe(catchError(err => { console.warn('Erro ao salvar respostas-opcao mentor:', err); return of(null); }))
      : of(null);

    // Vincula tecnologias em usuario-tecnologia
    const vinculosTech$ = this.tecnologiasSelecionadas.length > 0
      ? forkJoin(this.tecnologiasSelecionadas.map(techId =>
          this.usuarioTecnologiaService.criar({ usuarioId, tecnologiaId: techId, status: 1 })
        )).pipe(catchError(err => { console.warn('Erro ao vincular tecnologias:', err); return of(null); }))
      : of(null);

    forkJoin([respostasTexto$, respostasOpcao$, vinculosTech$]).pipe(
      switchMap(() => this.mentorService.buscarPorUsuarioId(usuarioId)),
      switchMap(mentorExistente => {
        const dadosMentor = {
          usuarioId,
          descricao: this.mentorDados.descricao,
          precoHora: this.mentorDados.precoHora ?? 0,
          mediaAvaliacao: mentorExistente?.mediaAvaliacao ?? 0,
          status: mentorExistente?.status ?? 1,
          onboardingConcluido: 1
        };
        return mentorExistente
          ? this.mentorService.atualizar(usuarioId, dadosMentor)
          : this.mentorService.criar(dadosMentor);
      })
    ).subscribe({
      next: () => {
        this.carregando = false;
        this.cdr.detectChanges();
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        console.error('Erro ao finalizar onboarding mentor:', err);
        this.carregando = false;
        this.cdr.detectChanges();
        this.router.navigate(['/app/dashboard']);
      }
    });
  }
}
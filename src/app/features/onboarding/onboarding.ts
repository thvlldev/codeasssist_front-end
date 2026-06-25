import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { MentorService } from '../../services/mentor.service';
import { RespostaOpcaoService } from '../../services/resposta_opcao.service';
import { RespostaTextoService } from '../../services/resposta_texto.service';
import { TecnologiaService } from '../../services/tecnologia.service';
import { UsuarioTecnologiaService } from '../../services/usuario_tecnologia.service';
import { Tecnologia } from '../../model/tecnologia.model';
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
  private router = inject(Router);

  readonly TipoUsuario = TipoUsuario;

  papelAtivo: TipoUsuario = TipoUsuario.Cliente;
  passoAtual: number = 0;
  carregando: boolean = false;

  // SIMULA UM SIGNAL PARA CASAR COM O HTML
  passo = Object.assign(
    () => this.passoAtual,
    {
      set: (valor: number) => {
        this.passoAtual = valor;
      }
    }
  );

  // ---- Estado do onboarding de Cliente (fluxo já existente) ----
  respostas = {
    perfilId: null as number | null,
    uso: '',
    objetivo: '',
    objective: ''
  };

  // ---- Estado do onboarding de Mentor (novo fluxo) ----
  mentorDados = {
    descricao: '',
    precoHora: null as number | null
  };
  tecnologiasDisponiveis: Tecnologia[] = [];
  tecnologiasSelecionadas: number[] = [];

  ngOnInit(): void {
    const idSessao = this.authService.getUsuarioId();
    if (!idSessao) {
      console.warn('Nenhum usuário ativo encontrado na sessão.');
    }

    this.papelAtivo = this.authService.getPapelAtivo() ?? TipoUsuario.Cliente;

    if (this.papelAtivo === TipoUsuario.Mentor) {
      this.carregarTecnologias();
    }
  }

  get ehMentor(): boolean {
    return this.papelAtivo === TipoUsuario.Mentor;
  }

  // ===================== FLUXO CLIENTE =====================

  selecionarPerfil(opcaoId: number): void {
    this.respostas.perfilId = opcaoId;

    const usuarioId = this.authService.getUsuarioId();
    if (!usuarioId) {
      console.error('Usuário não identificado para criar o perfil.');
      return;
    }

    this.carregando = true;

    this.clienteService.buscarPorUsuarioId(usuarioId).subscribe({
      next: (clienteExistente) => {
        if (clienteExistente) {
          this.carregando = false;
          this.passo.set(2);
          return;
        }
        this.clienteService.criar({
          usuarioId: usuarioId,
          stack: '',
          descricao: '',
          onboardingConcluido: 0,
          status: 1
        }).subscribe({
          next: () => {
            this.carregando = false;
            this.passo.set(2);
          },
          error: (err) => {
            console.error('Erro ao criar o cliente no banco:', err);
            this.carregando = false;
            this.passo.set(2);
          }
        });
      },
      error: () => {
        this.carregando = false;
        this.passo.set(2);
      }
    });
  }

  finalizar(): void {
    this.finalizarOnboardingCliente();
  }

  private finalizarOnboardingCliente(): void {
    const usuarioId = this.authService.getUsuarioId();
    if (!usuarioId) {
      console.error('Nenhum usuário logado.');
      return;
    }

    this.carregando = true;

    const requisicoes: any = {
      passo2Uso: this.respostaTextoService.criar({
        clienteUsuarioId: usuarioId,
        perguntaCadastroId: 2,
        conteudo: this.respostas.uso,
        status: 1
      }),
      passo3Objetivo: this.respostaTextoService.criar({
        clienteUsuarioId: usuarioId,
        perguntaCadastroId: 3,
        conteudo: this.respostas.objetivo || this.respostas.objective,
        status: 1
      })
    };

    if (this.respostas.perfilId) {
      requisicoes.passo1Perfil = this.respostaOpcaoService.criar({
        clienteUsuarioId: usuarioId,
        opcaoPerguntaId: this.respostas.perfilId,
        status: 1
      });
    }

    forkJoin(requisicoes).pipe(
      switchMap(() => this.authService.marcarOnboardingConcluido())
    ).subscribe({
      next: () => {
        this.carregando = false;
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        console.error('Erro ao salvar as respostas finais do onboarding:', err);
        this.carregando = false;
        this.router.navigate(['/app/dashboard']);
      }
    });
  }

  // ===================== FLUXO MENTOR =====================

  private carregarTecnologias(): void {
    this.tecnologiaService.listarTodas().subscribe({
      next: (techs) => this.tecnologiasDisponiveis = techs.filter(t => t.status === 1),
      error: (err) => console.error('Erro ao carregar tecnologias:', err)
    });
  }

  alternarTecnologia(tecnologiaId: number): void {
    const indice = this.tecnologiasSelecionadas.indexOf(tecnologiaId);
    if (indice >= 0) {
      this.tecnologiasSelecionadas.splice(indice, 1);
    } else {
      this.tecnologiasSelecionadas.push(tecnologiaId);
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
    if (!usuarioId) {
      console.error('Nenhum usuário logado.');
      return;
    }

    this.carregando = true;

    const vinculosTecnologia$ = this.tecnologiasSelecionadas.length > 0
      ? forkJoin(this.tecnologiasSelecionadas.map(tecnologiaId =>
          this.usuarioTecnologiaService.criar({ usuarioId, tecnologiaId, status: 1 })
        ))
      : of([]);

    this.mentorService.buscarPorUsuarioId(usuarioId).pipe(
      switchMap(mentorExistente => {
        const dadosMentor = {
          usuarioId,
          descricao: this.mentorDados.descricao,
          precoHora: this.mentorDados.precoHora ?? 0,
          mediaAvaliacao: mentorExistente?.mediaAvaliacao ?? 0,
          onboardingConcluido: 1,
          status: 1
        };
        return mentorExistente
          ? this.mentorService.atualizar(usuarioId, dadosMentor)
          : this.mentorService.criar(dadosMentor);
      }),
      switchMap(() => vinculosTecnologia$)
    ).subscribe({
      next: () => {
        this.carregando = false;
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        console.error('Erro ao salvar o onboarding de mentor:', err);
        this.carregando = false;
        this.router.navigate(['/app/dashboard']);
      }
    });
  }
}
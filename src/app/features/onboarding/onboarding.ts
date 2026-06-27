import { Component, inject, OnInit } from '@angular/core';
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

  passo = Object.assign(
    () => this.passoAtual,
    {
      set: (valor: number) => {
        this.passoAtual = valor;
      }
    }
  );

  perguntasMap: { [key: number]: string } = {};

  respostas = {
    perfilId: null as number | null,
    uso: '',
    objetivo: ''
  };

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
    this.carregarDadosIniciais();
  }

  get ehMentor(): boolean {
    return this.papelAtivo === TipoUsuario.Mentor;
  }

  private carregarDadosIniciais(): void {
    this.perguntasMap = {
      1: 'Quais stacks você atua?',
      2: 'Como você descreve sua experiência no mercado de tecnologia?',
      3: 'Qual é o seu principal objetivo na plataforma?',
      4: 'Conte sobre sua experiência',
      5: 'Quais tecnologias você domina?',
      6: 'Qual valor da sua hora de mentoria?'
    };

    this.tecnologiaService.listarTodas().subscribe({
      next: (techs) => this.tecnologiasDisponiveis = techs.filter(t => t.status === 1),
      error: (err) => console.error('Erro ao carregar tecnologias:', err)
    });
  }

  // ===================== FLUXO CLIENTE =====================

  selecionarPerfil(opcaoId: number): void {
    this.respostas.perfilId = opcaoId;
    this.passo.set(2);
  }

  finalizar(): void {
    this.finalizarOnboardingCliente();
  }

  private finalizarOnboardingCliente(): void {
    const usuarioId = this.authService.getUsuarioId();
    if (!usuarioId) return;

    this.carregando = true;

    let stackFinal = 'Iniciante / Estudante';
    if (this.respostas.perfilId === 2) stackFinal = 'Intermediário / Freelancer';
    if (this.respostas.perfilId === 3) stackFinal = 'Avançado / Full Time';

    const requisicoesForm: any = {
      passo2: this.respostaTextoService.criar({
        clienteUsuarioId: usuarioId,
        perguntaCadastroId: 2,
        conteudo: this.respostas.uso,
        status: 1
      }),
      passo3: this.respostaTextoService.criar({
        clienteUsuarioId: usuarioId,
        perguntaCadastroId: 3,
        conteudo: this.respostas.objetivo,
        status: 1
      })
    };

    if (this.respostas.perfilId) {
      requisicoesForm.passo1 = this.respostaOpcaoService.criar({
        clienteUsuarioId: usuarioId,
        opcaoPerguntaId: this.respostas.perfilId,
        status: 1
      });
    }

    forkJoin(requisicoesForm).pipe(
      catchError(err => {
        console.warn('Respostas não puderam ser salvas (endpoint indisponível):', err);
        return of(null);
      }),
      switchMap(() => this.clienteService.buscarPorUsuarioId(usuarioId)),
      switchMap((clienteExistente) => {
        const dadosAtualizados = {
          usuarioId: usuarioId,
          stack: stackFinal,
          descricao: this.respostas.uso || 'Sem descrição',
          status: clienteExistente?.status ?? 1,
          onboardingConcluido: 1
        };
        return this.clienteService.atualizar(usuarioId, dadosAtualizados);
      })
    ).subscribe({
      next: () => {
        console.log('Onboarding cliente concluído com sucesso.');
        this.carregando = false;
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        console.error('Erro ao finalizar onboarding do cliente:', err);
        this.carregando = false;
        this.router.navigate(['/app/dashboard']);
      }
    });
  }

  // ===================== FLUXO MENTOR =====================

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
    if (!usuarioId) return;

    this.carregando = true;

    const requisicoesMentor: any = {
      pergunta4: this.respostaTextoService.criar({
        clienteUsuarioId: usuarioId,
        perguntaCadastroId: 4,
        conteudo: this.mentorDados.descricao,
        status: 1
      }),
      pergunta6: this.respostaTextoService.criar({
        clienteUsuarioId: usuarioId,
        perguntaCadastroId: 6,
        conteudo: String(this.mentorDados.precoHora),
        status: 1
      })
    };

    const vinculosTech$ = this.tecnologiasSelecionadas.length > 0
      ? forkJoin(this.tecnologiasSelecionadas.map(techId =>
          this.usuarioTecnologiaService.criar({ usuarioId, tecnologiaId: techId, status: 1 })
        ))
      : of([]);

    forkJoin(requisicoesMentor).pipe(
      catchError(err => {
        console.warn('Respostas do mentor não puderam ser salvas (endpoint indisponível):', err);
        return of(null);
      }),
      switchMap(() => vinculosTech$),
      catchError(err => {
        console.warn('Tecnologias não puderam ser vinculadas:', err);
        return of(null);
      }),
      switchMap(() => this.mentorService.buscarPorUsuarioId(usuarioId)),
      switchMap((mentorExistente) => {
        const dadosMentor = {
          usuarioId: usuarioId,
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
        console.log('Onboarding mentor concluído com sucesso.');
        this.carregando = false;
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        console.error('Erro ao salvar onboarding do mentor:', err);
        this.carregando = false;
        this.router.navigate(['/app/dashboard']);
      }
    });
  }
}
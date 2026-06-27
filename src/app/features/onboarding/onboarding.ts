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

  passo = Object.assign(
    () => this.passoAtual,
    {
      set: (valor: number) => {
        this.passoAtual = valor;
      }
    }
  );

  perguntasMap: { [key: number]: string } = {};

  // Estado do onboarding de Cliente (Perguntas 1, 2 e 3)
  respostas = {
    perfilId: null as number | null,
    uso: '',
    objetivo: ''
  };

  // Estado do onboarding de Mentor (Perguntas 4, 5 e 6)
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
      1: "Quais stacks você atua?",
      2: "Como você descreve sua experiência no mercado de tecnologia?",
      3: "Qual é o seu principal objetivo na plataforma?",
      4: "Conte sobre sua experiência",
      5: "Quais tecnologias você domina?",
      6: "Qual valor da sua hora de mentoria?"
    };

    this.tecnologiaService.listarTodas().subscribe({
      next: (techs) => this.tecnologiasDisponiveis = techs.filter(t => t.status === 1),
      error: (err) => console.error('Erro ao carregar tecnologias:', err)
    });
  }

  // ===================== FLUXO CLIENTE =====================

  selecionarPerfil(opcaoId: number): void {
    this.respostas.perfilId = opcaoId;

    const usuarioId = this.authService.getUsuarioId();
    if (!usuarioId) return;

    this.carregando = true;

    this.clienteService.buscarPorUsuarioId(usuarioId).subscribe({
      next: (clienteExistente) => {
        if (clienteExistente) {
          this.carregando = false;
          this.passo.set(2);
          return;
        }

        let stackInicial = '';
        if (opcaoId === 1) stackInicial = 'Iniciante / Estudante';
        if (opcaoId === 2) stackInicial = 'Intermediário / Freelancer';
        if (opcaoId === 3) stackInicial = 'Avançado / Full Time';

        const novoCliente = {
          usuarioId: usuarioId,
          stack: stackInicial,
          descricao: '',
          onboardingConcluido: "0",
          status: 1
        } as any;

        this.clienteService.criar(novoCliente).subscribe({
          next: () => {
            this.carregando = false;
            this.passo.set(2);
          },
          error: () => {
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
    if (!usuarioId) return;

    this.carregando = true;

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
      switchMap(() => this.clienteService.buscarPorUsuarioId(usuarioId)),
      switchMap((clienteExistente) => {
        let stackFinal = 'Iniciante / Estudante';
        if (this.respostas.perfilId === 1) stackFinal = 'Iniciante / Estudante';
        if (this.respostas.perfilId === 2) stackFinal = 'Intermediário / Freelancer';
        if (this.respostas.perfilId === 3) stackFinal = 'Avançado / Full Time';

        // Remove explicitamente a propriedade antiga para evitar conflitos de spread
        if (clienteExistente && 'onboardingConcluido' in clienteExistente) {
          delete (clienteExistente as any).onboardingConcluido;
        }

        const dadosAtualizados = {
          ...clienteExistente,
          usuarioId: usuarioId,
          stack: stackFinal,
          descricao: this.respostas.uso || 'Sem descrição',
          status: 1,
          onboardingConcluido: "1" // Forçado como String estável "1"
        } as any;

        return this.clienteService.atualizar(usuarioId, dadosAtualizados);
      }),
      switchMap(() => this.authService.marcarOnboardingConcluido())
    ).subscribe({
      next: () => {
        this.carregando = false;
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        console.error('Erro ao forçar a atualização do cliente:', err);
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
      switchMap(() => vinculosTech$),
      switchMap(() => this.mentorService.buscarPorUsuarioId(usuarioId)),
      switchMap((mentorExistente) => {
        // Remove explicitamente a propriedade antiga para evitar conflitos de spread
        if (mentorExistente && 'onboardingConcluido' in mentorExistente) {
          delete (mentorExistente as any).onboardingConcluido;
        }

        const dadosMentor = {
          ...mentorExistente,
          usuarioId: usuarioId,
          descricao: this.mentorDados.descricao,
          precoHora: this.mentorDados.precoHora ?? 0,
          mediaAvaliacao: mentorExistente?.mediaAvaliacao ?? 0,
          status: 1,
          onboardingConcluido: "1" // Forçado como String estável "1"
        } as any;

        return mentorExistente
          ? this.mentorService.atualizar(usuarioId, dadosMentor)
          : this.mentorService.criar(dadosMentor);
      }),
      switchMap(() => this.authService.marcarOnboardingConcluido())
    ).subscribe({
      next: () => {
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

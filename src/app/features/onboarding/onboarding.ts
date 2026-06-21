import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RespostaOpcaoService } from '../../services/resposta_opcao.service';
import { RespostaTextoService } from '../../services/resposta_texto.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './onboarding.html',
  styleUrls: ['./onboarding.css']
})
export class OnboardingComponent implements OnInit {
  private authService = inject(AuthService);
  private respostaOpcaoService = inject(RespostaOpcaoService);
  private respostaTextoService = inject(RespostaTextoService);
  private router = inject(Router);

  passoAtual: number = 0;
  carregando: boolean = false;

  // SIMULA UM SIGNAL PARA CASAR COM O HTML: Permite chamadas como passo() e passo.set(X)
  passo = Object.assign(
    () => this.passoAtual,
    {
      set: (valor: number) => {
        this.passoAtual = valor;
      }
    }
  );

  respostas = {
    perfilId: null as number | null,
    uso: '',
    objetivo: ''
  };

  ngOnInit(): void {
    const idSessao = this.authService.getUsuarioId();
    if (!idSessao) {
      console.warn('Nenhum usuário ativo encontrado na sessão.');
    }
  }

  selecionarPerfil(opcaoId: number): void {
    this.respostas.perfilId = opcaoId;
    this.passo.set(2);
  }

  finalizar(): void {
    this.finalizarOnboarding();
  }

  finalizarOnboarding(): void {
    this.carregando = true;

    const usuarioId = this.authService.getUsuarioId();
    if (!usuarioId) {
      console.error('Nenhum usuário logado.');
      this.carregando = false;
      return;
    }

    if (this.respostas.perfilId) {
      this.respostaOpcaoService.criar({
        clienteUsuarioId: usuarioId,
        opcaoPerguntaId: this.respostas.perfilId,
        status: 1
      }).subscribe({
        next: () => console.log('Passo 1 (Perfil) salvo.'),
        error: (err) => console.error('Erro ao salvar passo 1:', err)
      });
    }

    this.respostaTextoService.criar({
      clienteUsuarioId: usuarioId,
      perguntaCadastroId: 2,
      conteudo: this.respostas.uso,
      status: 1
    }).subscribe({
      next: () => {
        console.log('Passo 2 (Uso) salvo.');

        this.respostaTextoService.criar({
          clienteUsuarioId: usuarioId,
          perguntaCadastroId: 3,
          conteudo: this.respostas.objetivo,
          status: 1
        }).subscribe({
          next: () => {
            console.log('Passo 3 (Objetivo) salvo. Onboarding concluído!');
            this.carregando = false;
            this.router.navigate(['/app/dashboard']);
          },
          error: (err) => {
            console.error('Erro ao salvar passo 3:', err);
            this.carregando = false;
            this.router.navigate(['/app/dashboard']);
          }
        });
      },
      error: (err) => {
        console.error('Erro ao salvar passo 2:', err);
        this.carregando = false;
        this.router.navigate(['/app/dashboard']);
      }
    });
  }
}
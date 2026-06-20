import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './onboarding.html',
  styleUrls: ['./onboarding.css']
})
export class OnboardingComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  passoAtual: number = 1;
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

  // Objeto para capturar as respostas das telas
  respostas = {
    perfilId: null as number | null, // Passo 1 (Múltipla escolha)
    uso: '',                         // Passo 2 (Texto livre)
    objetivo: ''                     // Passo 3 (Texto livre)
  };

  ngOnInit(): void {
    const idSessao = this.authService.getUsuarioId();
    if (!idSessao) {
      console.warn('Nenhum usuário ativo encontrado na sessão.');
    }
  }

  avancarPasso(): void {
    if (this.passoAtual < 3) {
      this.passoAtual++;
    } else {
      this.finalizarOnboarding();
    }
  }

  voltarPasso(): void {
    if (this.passoAtual > 1) {
      this.passoAtual--;
    }
  }

  selecionarPerfil(opcaoId: number): void {
    this.respostas.perfilId = opcaoId;
    this.avancarPasso();
  }

  // Atalho exigido pelo clique (click)="finalizar()" do seu HTML
  finalizar(): void {
    this.finalizarOnboarding();
  }

  finalizarOnboarding(): void {
    this.carregando = true;

    const idSessao = this.authService.getUsuarioId();
    const usuarioId: number = idSessao !== null && idSessao !== undefined ? idSessao : 3;

    console.log('Salvando respostas do onboarding para o usuário:', usuarioId);

    if (this.respostas.perfilId) {
      this.authService.salvarRespostaOpcao(usuarioId, this.respostas.perfilId).subscribe({
        next: () => console.log('Passo 1 (Perfil) salvo com sucesso.'),
        error: (err) => console.error('Erro ao salvar passo 1:', err)
      });
    }

    this.authService.salvarRespostaTexto(usuarioId, 2, this.respostas.uso).subscribe({
      next: () => {
        console.log('Passo 2 (Uso) salvo com sucesso.');

        this.authService.salvarRespostaTexto(usuarioId, 3, this.respostas.objetivo).subscribe({
          next: () => {
            console.log('Passo 3 (Objetivo) salvo com sucesso. Onboarding concluído!');
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

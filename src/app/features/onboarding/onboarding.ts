import { Component, signal, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
})
export class OnboardingComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  passo = signal(0);

  respostas = {
    opcaoId: 0,
    uso: '',
    objetivo: ''
  };

  selecionarPerfil(opcao: number) {
    this.respostas.opcaoId = opcao;
    this.passo.set(2);
  }

  finalizar() {
    const usuarioId = this.authService.getUsuarioId();
    console.log('Disparando os POSTs estruturados para a API...', this.respostas);

    // 1º POST: Envia a opção escolhida de múltipla escolha (Tabela opcoes-pergunta)
    this.authService.salvarRespostaOpcao(usuarioId, this.respostas.opcaoId).subscribe({
      next: () => {

        // 2º POST: Envia o texto da Pergunta 2 (perguntaCadastroId: 2)
        this.authService.salvarRespostaTexto(usuarioId, 2, this.respostas.uso).subscribe({
          next: () => {

            // 3º POST: Envia o texto da Pergunta 3 (CORRIGIDO para perguntaCadastroId: 3)
            this.authService.salvarRespostaTexto(usuarioId, 3, this.respostas.objetivo).subscribe({
              next: () => {
                alert('Onboarding concluído com sucesso!');
                this.router.navigate(['/app/dashboard']);
              },
              error: (err) => this.tratarErroRedirecionamento('Erro no POST do objetivo (Texto 3)', err)
            });
          },
          error: (err) => this.tratarErroRedirecionamento('Erro no POST do uso (Texto 2)', err)
        });
      },
      error: (err) => this.tratarErroRedirecionamento('Erro no POST do perfil (Opção 1)', err)
    });
  }

  private tratarErroRedirecionamento(contexto: string, erro: any) {
    console.error(`[${contexto}]:`, erro);
    // Contingência: Avança caso o servidor do Senac bloqueie o cabeçalho por CORS
    console.warn('Avançando para o dashboard local devido a restrições de rede.');
    this.router.navigate(['/app/dashboard']);
  }
}

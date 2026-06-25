import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TipoUsuario } from '../../shared/enums/TipoUsuario';

declare var bootstrap: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  readonly TipoUsuario = TipoUsuario;

  loginData = {
    email: '',
    password: '',
    rememberMe: false,
    papel: TipoUsuario.Cliente as TipoUsuario
  };

  enviando = false;
  erroMsg = '';

  abrirModalCadastro() {
    const loginEl = document.getElementById('loginModal');
    const cadastroEl = document.getElementById('cadastroModal');
    if (!loginEl || !cadastroEl) return;

    const loginModal = bootstrap.Modal.getInstance(loginEl);
    loginEl.addEventListener('hidden.bs.modal', () => {
      const cadastroModal = new bootstrap.Modal(cadastroEl);
      cadastroModal.show();
    }, { once: true });

    loginModal?.hide();
  }

  handleSubmit() {
    this.erroMsg = '';
    this.enviando = true;

    this.authService.login(this.loginData.email, this.loginData.password, this.loginData.papel).subscribe({
      next: (resultado) => {
        console.log('Login realizado:', resultado);
        this.enviando = false;
        this.fecharModalERedirecionar(resultado.precisaOnboarding);
      },
      error: (err) => {
        console.error('Erro no login:', err);
        this.enviando = false;
        this.erroMsg = 'E-mail ou senha incorretos.';
      }
    });
  }

  private fecharModalERedirecionar(precisaOnboarding: boolean) {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    const backdrops = document.getElementsByClassName('modal-backdrop');
    while (backdrops.length > 0) {
      backdrops[0].parentNode?.removeChild(backdrops[0]);
    }

    const loginEl = document.getElementById('loginModal') || document.querySelector('.modal');
    if (loginEl && typeof bootstrap !== 'undefined') {
      const modal = bootstrap.Modal.getInstance(loginEl) || new bootstrap.Modal(loginEl);
      modal?.hide();
    }

    // Só vai para o onboarding se o papel escolhido ainda não tiver onboardingConcluido = 1
    this.router.navigate([precisaOnboarding ? '/onboarding' : '/app/dashboard']);
  }

  handleGoogleLogin() { console.log('Google login'); }
  handleGithubLogin() { console.log('GitHub login'); }
}

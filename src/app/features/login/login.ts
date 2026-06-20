import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

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

  loginData = {
    email: '',
    password: '',
    rememberMe: false
  };

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
    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (usuario) => {
        console.log('Login realizado:', usuario);
        this.fecharModalERedirecionar();
      },
      error: (err) => {
        console.error('Erro no login:', err);
        alert('E-mail ou senha incorretos.');
      }
    });
  }

  private fecharModalERedirecionar() {
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

    this.router.navigate(['/app/dashboard']);
  }

  handleGoogleLogin() { console.log('Google login'); }
  handleGithubLogin() { console.log('GitHub login'); }
}
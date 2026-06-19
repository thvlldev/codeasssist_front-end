import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare var bootstrap: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  // Objeto para bind do formulário
  loginData = {
    email: '',
    password: '',
    rememberMe: false
  };

  constructor(private router: Router) {}

  abrirModalCadastro() {

    const loginEl = document.getElementById('loginModal');
    const cadastroEl = document.getElementById('cadastroModal');

    if (!loginEl || !cadastroEl) return;

    const loginModal = bootstrap.Modal.getInstance(loginEl);

    loginEl.addEventListener(
      'hidden.bs.modal',
      () => {

        const cadastroModal = new bootstrap.Modal(cadastroEl);
        cadastroModal.show();

      },
      { once: true }
    );

    loginModal?.hide();
  }

  handleSubmit() {

    console.log('Dados do login:', this.loginData);

    const loginEl = document.getElementById('loginModal');

    if (loginEl) {

      const modal = bootstrap.Modal.getInstance(loginEl);

      // Espera o modal fechar totalmente
      loginEl.addEventListener(
        'hidden.bs.modal',
        () => {

          // Remove resíduos do Bootstrap
          document.body.classList.remove('modal-open');

          const backdrops =
            document.getElementsByClassName('modal-backdrop');

          while (backdrops.length > 0) {
            backdrops[0].parentNode?.removeChild(backdrops[0]);
          }


          this.router.navigate(['/app/dashboard']);

        },
        { once: true }
      );

      modal?.hide();

    } else {

      // fallback caso não encontre modal
      this.router.navigate(['/dashboard']);
    }
  }

  handleGoogleLogin() {
    console.log('Google login');
  }

  handleGithubLogin() {
    console.log('GitHub login');
  }
}

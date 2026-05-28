import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare var bootstrap: any;

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cadastro.html',
  styleUrls: ['./cadastro.css']
})
export class CadastroComponent {

  cadastroData = {
    email: '',
    password: '',
    rememberMe: false
  };

  constructor(private router: Router) {}

  abrirModal() {

    const cadastroEl = document.getElementById('cadastroModal');
    const loginEl = document.getElementById('loginModal');

    if (!cadastroEl || !loginEl) return;

    const cadastroModal = bootstrap.Modal.getInstance(cadastroEl);

    cadastroEl.addEventListener(
      'hidden.bs.modal',
      () => {

        const loginModal = new bootstrap.Modal(loginEl);
        loginModal.show();

      },
      { once: true }
    );

    cadastroModal?.hide();
  }

  handleSubmit() {

    console.log('Dados do cadastro:', this.cadastroData);

    const cadastroEl = document.getElementById('cadastroModal');

    if (cadastroEl) {

      const modal = bootstrap.Modal.getInstance(cadastroEl);

      // Espera o modal fechar completamente
      cadastroEl.addEventListener(
        'hidden.bs.modal',
        () => {

          // Remove resíduos do Bootstrap
          document.body.classList.remove('modal-open');

          const backdrops =
            document.getElementsByClassName('modal-backdrop');

          while (backdrops.length > 0) {
            backdrops[0].parentNode?.removeChild(backdrops[0]);
          }

          // Navega para dashboard
          this.router.navigate(['/dashboard']);

        },
        { once: true }
      );

      modal?.hide();

    } else {

      // fallback caso modal não exista
      this.router.navigate(['/dashboard']);
    }
  }

  handleGooglecadastro() {
    console.log('Google cadastro');
  }

  handleGithubcadastro() {
    console.log('GitHub cadastro');
  }
}
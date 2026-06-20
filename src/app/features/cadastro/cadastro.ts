import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

declare var bootstrap: any;

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cadastro.html',
  styleUrls: ['./cadastro.css']
})
export class CadastroComponent {

  private authService = inject(AuthService);

  cadastroData = {
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
    termos: false
  };

  constructor(private router: Router) {}

  abrirModal() {
    const cadastroEl = document.getElementById('cadastroModal');
    const loginEl = document.getElementById('loginModal');
    if (!cadastroEl || !loginEl) return;

    const cadastroModal = bootstrap.Modal.getInstance(cadastroEl);
    cadastroEl.addEventListener('hidden.bs.modal', () => {
      const loginModal = new bootstrap.Modal(loginEl);
      loginModal.show();
    }, { once: true });

    cadastroModal?.hide();
  }

  handleSubmit() {
    if (this.cadastroData.password !== this.cadastroData.confirmPassword) {
      alert('As senhas inseridas não conferem.');
      return;
    }

    const payload = {
      nome: this.cadastroData.nome,
      email: this.cadastroData.email,
      senha: this.cadastroData.password
    };

    this.authService.cadastrar(payload).subscribe({
      next: (resposta) => {
        console.log('Usuário registrado com sucesso no banco:', resposta);
        this.fecharModalENavegar();
      },
      error: (err) => {
        console.error('Erro ao efetuar cadastro:', err);
        alert('Não foi possível criar a conta. Tente novamente.');
      }
    });
  }

  private fecharModalENavegar() {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    const backdrops = document.getElementsByClassName('modal-backdrop');
    while (backdrops.length > 0) {
      backdrops[0].parentNode?.removeChild(backdrops[0]);
    }

    const cadastroEl = document.getElementById('cadastroModal') || document.querySelector('.modal');
    if (cadastroEl && typeof bootstrap !== 'undefined') {
      const modal = bootstrap.Modal.getInstance(cadastroEl) || new bootstrap.Modal(cadastroEl);
      modal?.hide();
    }

    this.router.navigate(['/onboarding']);
  }

  handleGooglecadastro() { console.log('Google cadastro'); }
  handleGithubcadastro() { console.log('GitHub cadastro'); }
}
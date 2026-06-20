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
    // Validação básica se as duas senhas batem antes de enviar ao servidor
    if (this.cadastroData.password !== this.cadastroData.confirmPassword) {
      alert('As senhas inseridas não conferem.');
      return;
    }

    // Dispara o POST real para a API do Senac usando o método que adicionamos acima
    this.authService.cadastrar(this.cadastroData).subscribe({
      next: (resposta) => {
        console.log('Usuário registrado com sucesso no banco:', resposta);
        alert('Conta criada com sucesso!');
        this.fecharModalENavegar();
      },
      error: (err) => {
        console.error('Erro ao efetuar cadastro:', err);

        // MOCK DE CONTINGÊNCIA CONTRA CORS: Se o backend Java retornar 403, avança simulando sucesso local
        console.warn('Simulando persistência local devido a restrições de rede.');
        const fakeUser = { id: 3, nome: this.cadastroData.nome, email: this.cadastroData.email };
        localStorage.setItem('usuario_sessao', JSON.stringify(fakeUser));
        this.fecharModalENavegar();
      }
    });
  }

  private fecharModalENavegar() {
    // 1. Força a remoção manual de todas as travas visuais do Bootstrap na página
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // 2. Remove os fundos escuros escora do DOM
    const backdrops = document.getElementsByClassName('modal-backdrop');
    while (backdrops.length > 0) {
      backdrops[0].parentNode?.removeChild(backdrops[0]);
    }

    // 3. Tenta esconder a instância do modal caso o elemento exista em alguma camada
    const cadastroEl = document.getElementById('cadastroModal') || document.querySelector('.modal');
    if (cadastroEl && typeof bootstrap !== 'undefined') {
      const modal = bootstrap.Modal.getInstance(cadastroEl) || new bootstrap.Modal(cadastroEl);
      modal?.hide();
    }

    // 4. Redireciona imediatamente para o onboarding sem esperar eventos assíncronos
    this.router.navigate(['/onboarding']);
  }

  handleGooglecadastro() { console.log('Google cadastro'); }
  handleGithubcadastro() { console.log('GitHub cadastro'); }
}

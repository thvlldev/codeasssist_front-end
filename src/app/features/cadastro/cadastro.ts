import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TipoUsuario } from '../../shared/enums/TipoUsuario';

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

  readonly TipoUsuario = TipoUsuario;

  // Passo 0 = escolha do papel, Passo 1 = formulário de dados
  passoAtual: number = 0;
  papelSelecionado: TipoUsuario | null = null;

  cadastroData = {
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
    termos: false
  };

  enviando = false;
  erroMsg = '';

  constructor(private router: Router) {}

  selecionarPapel(papel: TipoUsuario) {
    this.papelSelecionado = papel;
    this.passoAtual = 1;
  }

  voltarParaEscolhaPapel() {
    this.passoAtual = 0;
  }

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
    this.erroMsg = '';

    if (this.papelSelecionado === null) {
      this.erroMsg = 'Selecione se você quer entrar como Cliente ou Mentor.';
      this.passoAtual = 0;
      return;
    }

    if (this.cadastroData.password !== this.cadastroData.confirmPassword) {
      this.erroMsg = 'As senhas inseridas não conferem.';
      return;
    }

    const payload = {
      nome: this.cadastroData.nome,
      email: this.cadastroData.email,
      senha: this.cadastroData.password
    };

    this.enviando = true;

    this.authService.cadastrar(payload, this.papelSelecionado).subscribe({
      next: (resultado) => {
        console.log('Usuário registrado com sucesso no banco:', resultado);
        this.enviando = false;
        this.fecharModalENavegar();
      },
      error: (err) => {
        console.error('Erro ao efetuar cadastro:', err);
        this.enviando = false;
        this.erroMsg = 'Não foi possível criar a conta. Tente novamente.';
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

    // Cadastro novo => onboarding sempre é necessário para o papel escolhido.
    this.router.navigate(['/onboarding']);
  }

  handleGooglecadastro() { console.log('Google cadastro'); }
  handleGithubcadastro() { console.log('GitHub cadastro'); }
}

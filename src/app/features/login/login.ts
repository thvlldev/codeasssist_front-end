import { Component, inject } from '@angular/core'; // Adicionado inject
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service'; // Importe o seu AuthService

declare var bootstrap: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  private authService = inject(AuthService); // Injetando o AuthService

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
    loginEl.addEventListener('hidden.bs.modal', () => {
      const cadastroModal = new bootstrap.Modal(cadastroEl);
      cadastroModal.show();
    }, { once: true });

    loginModal?.hide();
  }

 handleSubmit() {
  console.log('Dados do login enviados:', this.loginData);

  // MOCK PROVISÓRIO: Como a API do Senac deu CORS 403, gravamos o usuário direto para destravar o Front-end
  const usuarioMockado = {
    id: 1,
    nome: "Jarbas",
    email: this.loginData.email
  };

  // Salva na sessão do navegador exatamente o que o nova-publicacao e o dashboard esperam
  localStorage.setItem('usuario_sessao', JSON.stringify(usuarioMockado));

  // Executa o fechamento do modal e redireciona para o dashboard
  const loginEl = document.getElementById('loginModal');
  if (loginEl) {
    const modal = bootstrap.Modal.getInstance(loginEl);

    loginEl.addEventListener('hidden.bs.modal', () => {
      document.body.classList.remove('modal-open');
      const backdrops = document.getElementsByClassName('modal-backdrop');
      while (backdrops.length > 0) {
        backdrops[0].parentNode?.removeChild(backdrops[0]);
      }
      this.router.navigate(['/app/dashboard']);
    }, { once: true });

    modal?.hide();
  } else {
    this.router.navigate(['/app/dashboard']);
  }
}

  // Isolamos a lógica visual do bootstrap que você criou em um método auxiliar
  private fecharModalERedirecionar() {
    const loginEl = document.getElementById('loginModal');

    if (loginEl) {
      const modal = bootstrap.Modal.getInstance(loginEl);

      loginEl.addEventListener('hidden.bs.modal', () => {
        document.body.classList.remove('modal-open');
        const backdrops = document.getElementsByClassName('modal-backdrop');
        while (backdrops.length > 0) {
          backdrops[0].parentNode?.removeChild(backdrops[0]);
        }
        this.router.navigate(['/app/dashboard']);
      }, { once: true });

      modal?.hide();
    } else {
      this.router.navigate(['/app/dashboard']);
    }
  }

  handleGoogleLogin() { console.log('Google login'); }
  handleGithubLogin() { console.log('GitHub login'); }
}

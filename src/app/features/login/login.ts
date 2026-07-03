// Importa o decorator Component para declarar este arquivo como um componente Angular.
// Importa inject para injetar services diretamente na classe.
import { Component, inject } from '@angular/core';

// Importa recursos comuns do Angular usados no template.
import { CommonModule } from '@angular/common';

// RouterModule permite usar recursos de rota no HTML.
// Router permite navegar programaticamente para outras telas.
import { RouterModule, Router } from '@angular/router';

// FormsModule permite trabalhar com formulários simples, como ngModel.
import { FormsModule } from '@angular/forms';

// Importa o AuthService, responsável pelo login, sessão e papel ativo do usuário.
import { AuthService } from '../../services/auth.service';

// Importa o enum TipoUsuario, usado para diferenciar Cliente, Mentor etc.
import { TipoUsuario } from '../../shared/enums/TipoUsuario';

// Declara a variável global bootstrap.
// Isso permite usar os modais do Bootstrap diretamente no TypeScript.
declare var bootstrap: any;

// Configuração do componente Angular.
@Component({
  // Nome da tag do componente caso ele seja usado em algum template.
  selector: 'app-login',

  // Indica que este componente é standalone, ou seja, não depende de NgModule.
  standalone: true,

  // Define os módulos que este componente pode usar no template.
  imports: [CommonModule, RouterModule, FormsModule],

  // Arquivo HTML associado ao componente.
  templateUrl: './login.html',

  // Arquivo CSS associado ao componente.
  styleUrls: ['./login.css']
})
export class LoginComponent {

  // Injeta o AuthService para usar o método de login.
  private authService = inject(AuthService);

  // Injeta o Router para redirecionar o usuário após o login.
  private router = inject(Router);

  // Disponibiliza o enum TipoUsuario para uso no HTML.
  readonly TipoUsuario = TipoUsuario;

  // Objeto que armazena os dados preenchidos no formulário de login.
  loginData = {
    // Email digitado pelo usuário.
    email: '',

    // Senha digitada pelo usuário.
    password: '',

    // Indica se o usuário marcou a opção de lembrar login.
    rememberMe: false,

    // Papel escolhido para acessar o sistema.
    // Por padrão, começa como Cliente.
    papel: TipoUsuario.Cliente as TipoUsuario
  };

  // Controla se o formulário está sendo enviado.
  // Pode ser usado para desabilitar botão ou mostrar carregamento.
  enviando = false;

  // Guarda mensagem de erro exibida na tela.
  erroMsg = '';

  // Método usado para fechar o modal de login e abrir o modal de cadastro.
  abrirModalCadastro() {
    // Busca no HTML o modal de login pelo id.
    const loginEl = document.getElementById('loginModal');

    // Busca no HTML o modal de cadastro pelo id.
    const cadastroEl = document.getElementById('cadastroModal');

    // Se algum dos modais não existir no HTML, interrompe o método.
    if (!loginEl || !cadastroEl) return;

    // Pega a instância atual do modal de login, se ela já existir.
    const loginModal = bootstrap.Modal.getInstance(loginEl);

    // Adiciona um evento para quando o modal de login terminar de fechar.
    loginEl.addEventListener('hidden.bs.modal', () => {
      // Cria uma instância do modal de cadastro.
      const cadastroModal = new bootstrap.Modal(cadastroEl);

      // Abre o modal de cadastro.
      cadastroModal.show();
    }, { once: true });

    // Fecha o modal de login.
    loginModal?.hide();
  }

  // Método chamado quando o formulário de login é enviado.
  handleSubmit() {
    // Limpa mensagem de erro anterior.
    this.erroMsg = '';

    // Regex de validação programática da senha: 1 maiúscula, 1 especial, 1 número, de 6 a 18 chars
    // Essa regex exige:
    // pelo menos uma letra maiúscula,
    // pelo menos um caractere especial,
    // pelo menos um número,
    // tamanho entre 6 e 18 caracteres.
    const regexSenha = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*\d).{6,18}$/;

    // Verifica se a senha digitada cumpre os critérios definidos pela regex.
    if (!regexSenha.test(this.loginData.password)) {
      // Define mensagem de erro caso a senha não atenda aos requisitos.
      this.erroMsg = 'A senha informada não cumpre os requisitos mínimos de segurança.';

      // Interrompe o login.
      return;
    }

    // Ativa o estado de envio.
    this.enviando = true;

    // Chama o método login do AuthService.
    // Passa email, senha e papel escolhidos no formulário.
    this.authService.login(this.loginData.email, this.loginData.password, this.loginData.papel).subscribe({
      // Executa se o login der certo.
      next: (resultado) => {
        // Mostra no console o resultado retornado pelo AuthService.
        console.log('Login realizado:', resultado);

        // Desativa o estado de envio.
        this.enviando = false;

        // Fecha o modal e redireciona o usuário.
        // Se precisar de onboarding, vai para /onboarding.
        // Se não precisar, vai para /app/dashboard.
        this.fecharModalERedirecionar(resultado.precisaOnboarding);
      },

      // Executa se acontecer erro no login.
      error: (err) => {
        // Mostra erro no console.
        console.error('Erro no login:', err);

        // Desativa o estado de envio.
        this.enviando = false;

        // Define mensagem de erro para o usuário.
        this.erroMsg = 'E-mail ou senha incorretos.';
      }
    });
  }

  // Método privado usado após login bem-sucedido.
  // Ele limpa o modal da tela e redireciona o usuário.
  private fecharModalERedirecionar(precisaOnboarding: boolean) {
    // Remove a classe que o Bootstrap adiciona ao body quando um modal está aberto.
    document.body.classList.remove('modal-open');

    // Restaura o overflow do body.
    document.body.style.overflow = '';

    // Restaura o padding direito do body.
    document.body.style.paddingRight = '';

    // Busca todos os elementos de backdrop criados pelo Bootstrap.
    const backdrops = document.getElementsByClassName('modal-backdrop');

    // Remove todos os backdrops que ficaram na tela.
    while (backdrops.length > 0) {
      backdrops[0].parentNode?.removeChild(backdrops[0]);
    }

    // Busca o modal de login.
    // Se não encontrar pelo id, tenta pegar qualquer modal da página.
    const loginEl = document.getElementById('loginModal') || document.querySelector('.modal');

    // Se encontrou o modal e o Bootstrap está disponível:
    if (loginEl && typeof bootstrap !== 'undefined') {
      // Pega uma instância já existente do modal ou cria uma nova.
      const modal = bootstrap.Modal.getInstance(loginEl) || new bootstrap.Modal(loginEl);

      // Fecha o modal.
      modal?.hide();
    }

    // Redireciona o usuário com base no resultado do login.
    // Se precisaOnboarding for true, vai para /onboarding.
    // Se for false, vai para /app/dashboard.
    this.router.navigate([precisaOnboarding ? '/onboarding' : '/app/dashboard']);
  }

  // Método placeholder para login com Google.
  // Atualmente apenas imprime no console.
  handleGoogleLogin() { console.log('Google login'); }

  // Método placeholder para login com GitHub.
  // Atualmente apenas imprime no console.
  handleGithubLogin() { console.log('GitHub login'); }
}

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

  abrirModalCadastro() {

  const loginEl = document.getElementById('loginModal');
  const cadastroEl = document.getElementById('cadastroModal');

  const loginModal = bootstrap.Modal.getInstance(loginEl);

  loginEl?.addEventListener('hidden.bs.modal', () => {

    const cadastroModal = new bootstrap.Modal(cadastroEl);
    cadastroModal.show();

  }, { once: true });

  loginModal.hide();
}


  // Objeto para bind do formulário
  loginData = {
    email: '',
    password: '',
    rememberMe: false
  };

  constructor(private router: Router) {}

  handleSubmit() {
    console.log('Dados do login:', this.loginData);
    this.router.navigate(['/dashboard']);
  }

  handleGoogleLogin() {
    console.log('Google login');
  }

  handleGithubLogin() {
    console.log('GitHub login');
  }





}

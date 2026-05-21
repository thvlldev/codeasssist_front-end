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

  abrirModal() {

  const cadastroEl = document.getElementById('cadastroModal');
  const loginEl = document.getElementById('loginModal');

  const cadastroModal = bootstrap.Modal.getInstance(cadastroEl);

  cadastroEl?.addEventListener('hidden.bs.modal', () => {

    const loginModal = new bootstrap.Modal(loginEl);
    loginModal.show();

  }, { once: true });

  cadastroModal.hide();
}

  cadastroData = {
    email: '',
    password: '',
    rememberMe: false
  };





  constructor(private router: Router) {

  }

  handleSubmit() {

    console.log('Dados do cadastro:', this.cadastroData);
    this.router.navigate(['/dashboard']);
  }

  handleGooglecadastro() {
    console.log('Google cadastro');
  }

  handleGithubcadastro() {
    console.log('GitHub cadastro');
  }


}

import { Component } from '@angular/core';
import { LoginComponent } from '../login/login';
import { CadastroComponent } from '../cadastro/cadastro';
import { CommonModule } from '@angular/common';



declare var bootstrap: any;

@Component({
   selector: 'app-landing-page',
  imports: [CommonModule, LoginComponent, CadastroComponent],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})

export class LandingPageComponent {

  abrirModal() {
    const elemento = document.getElementById('loginModal');
    const meuModal = new bootstrap.Modal(elemento);
    meuModal.show();
  }

  abrirModalCadastro() {
    const elemento = document.getElementById('cadastroModal');
    const meuModal = new bootstrap.Modal(elemento);
    meuModal.show();
  }
}

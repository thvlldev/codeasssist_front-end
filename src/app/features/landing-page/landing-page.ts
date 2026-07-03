import { Component } from '@angular/core';
import { LoginComponent } from '../login/login';
import { CadastroComponent } from '../cadastro/cadastro';
import { CommonModule } from '@angular/common';



declare var bootstrap: any;//cria um objeto global bootstrap no window

@Component({
   selector: 'app-landing-page',
  imports: [CommonModule, LoginComponent, CadastroComponent],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})

export class LandingPageComponent {//js puro, foi feito no inicio do projeto da um desconto , a gente pesquisou e tem um tal de ViewChild no angular pra isso mas n dava tempo

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

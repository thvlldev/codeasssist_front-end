import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-onboarding',
  imports: [FormsModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
})
export class OnboardingComponent {
  passo = signal(0);
  respostas = { funcao: '', uso: '', objetivo: '' };

  constructor(private router: Router) {}

  finalizar() {
    console.log(this.respostas);
    this.router.navigate(['/dashboard']);
  }
}
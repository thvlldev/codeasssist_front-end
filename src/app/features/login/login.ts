import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  // Objeto para bind do formulário
  loginData = {
    email: '',
    password: '',
    rememberMe: false
  };

  constructor(private router: Router) {}

  handleSubmit() {
    // No Angular, usamos o Router para navegação SPA
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

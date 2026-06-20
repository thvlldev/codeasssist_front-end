import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf, NgForOf, CurrencyPipe } from '@angular/common';
import { DashboardData } from '../../model/dashboard.model';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgIf, NgForOf, CurrencyPipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);

  dashboard!: DashboardData;
  carregando: boolean = true;

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.carregando = true;
    const usuarioId = this.authService.getUsuarioId();

    if (!usuarioId) {
      console.error('Nenhum usuário logado encontrado.');
      this.carregando = false;
      return;
    }

    this.dashboardService.buscarDashboard(usuarioId).subscribe({
      next: (dados) => {
        this.dashboard = dados;
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar dashboard:', err);
        this.carregando = false;
      }
    });
  }
}
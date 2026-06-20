import { Component, OnInit, inject } from '@angular/core';
import {
  CommonModule,
  NgIf,
  NgForOf,
  CurrencyPipe
} from '@angular/common';

import { DashboardResponse } from '../../model/dashboard.model';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { Sidenav } from "../../shared/sidenav/sidenav";
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgForOf,
    CurrencyPipe,
    Sidenav,
    Footer
  ],
  providers: [DashboardService],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);

  dashboard!: DashboardResponse;

  carregando: boolean = true;

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {

    this.carregando = true;

    const usuarioId = this.authService.getUsuarioId();

    if (!usuarioId) {

      console.error(
        'Nenhum usuário logado encontrado.'
      );

      this.carregando = false;
      return;
    }

    console.log(
      'Carregando dashboard para usuário:',
      usuarioId
    );

    this.dashboardService
      .buscarDashboard(usuarioId)
      .subscribe({

        next: (dados) => {

          console.log(
            'Dashboard recebido:',
            dados
          );

          this.dashboard = dados;
          this.carregando = false;
        },

        error: (err) => {

          console.error(
            'Erro ao carregar dashboard:',
            err
          );

          this.carregando = false;
        }
      });
  }
}

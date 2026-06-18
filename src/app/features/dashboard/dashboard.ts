import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf, NgForOf, CurrencyPipe } from '@angular/common';


import { DashboardResponse } from '../../model/dashboard.model';


import { DashboardService } from '../../services/dashboard.service';
import { Sidenav } from "../../shared/sidenav/sidenav";
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgIf, NgForOf, CurrencyPipe, Sidenav, Footer],
  providers: [DashboardService],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {


  private dashboardService = inject(DashboardService);

  dashboard!: DashboardResponse;
  carregando: boolean = true;

  constructor() {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.carregando = true;

    this.dashboardService.buscarDashboard().subscribe({
      next: (dados) => {
        this.dashboard = dados;
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar os dados do Dashboard:', err);
        this.carregando = false;
      }
    });
  }
}

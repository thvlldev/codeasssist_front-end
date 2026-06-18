import { Component, OnInit, inject } from '@angular/core'; // <-- AGORA SIM: 'inject' importado do @angular/core
import { CommonModule, NgIf, NgForOf, CurrencyPipe } from '@angular/common';

// Importação da interface/model atualizada com os campos do banco de dados
import { DashboardResponse } from '../../model/dashboard.model';

// Importação do serviço de Dashboard
import { DashboardService } from '../../services/dashboard.service'; 

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgIf, NgForOf, CurrencyPipe],
  providers: [DashboardService], // Garante o provider local se não estiver global
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  
  // Injeção limpa e direta usando o inject() importado do core
  private dashboardService = inject(DashboardService);

  dashboard!: DashboardResponse;
  carregando: boolean = true;

  constructor() {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.carregando = true;
    
    this.dashboardService.obterDadosDashboard().subscribe({
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
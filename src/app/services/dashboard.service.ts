import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardResponse } from '../model/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);

  // Apontando para a raiz da API para facilitar a concatenação dos endpoints
  private readonly API = 'http://academico3.rj.senac.br/20261prjint3manha-mentoria/api';

  // Busca as métricas dinâmicas do usuário que está logado
  buscarDashboard(usuarioId: number): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.API}/dashboard/usuario/${usuarioId}`);
  }
}

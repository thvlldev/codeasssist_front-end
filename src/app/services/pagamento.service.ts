import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Pagamento } from '../model/pagamento.model';

@Injectable({ providedIn: 'root' })
export class PagamentoService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  listarTodos(): Observable<Pagamento[]> {
    return this.http.get<Pagamento[]>(`${this.API_BASE}/pagamentos`);
  }

  criar(pagamento: Partial<Pagamento>): Observable<Pagamento> {
    return this.http.post<Pagamento>(`${this.API_BASE}/pagamentos`, pagamento);
  }
}
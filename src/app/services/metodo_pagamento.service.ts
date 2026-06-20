import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MetodoPagamento } from '../model/metodo_pagamento.model';

@Injectable({ providedIn: 'root' })
export class MetodoPagamentoService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  listarTodos(): Observable<MetodoPagamento[]> {
    return this.http.get<MetodoPagamento[]>(`${this.API_BASE}/metodos-pagamento`);
  }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cliente } from '../model/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  listarTodos(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.API_BASE}/clientes`);
  }

  buscarPorUsuarioId(usuarioId: number): Observable<Cliente | undefined> {
    return this.listarTodos().pipe(
      map(clientes => clientes.find(c => c.usuarioId === usuarioId))
    );
  }

  criar(cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.API_BASE}/clientes`, cliente);
  }
}
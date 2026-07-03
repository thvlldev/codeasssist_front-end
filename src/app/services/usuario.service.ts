import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../model/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService { // CRU sem D delete pq não fizemos administrador
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  listarTodos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.API_BASE}/usuarios`);
  }

  buscarPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.API_BASE}/usuarios/${id}`);
  }

  criar(usuario: Partial<Usuario>): Observable<Usuario> {// Partial é um utility type do TypeScript que torna todas as propriedades da interface opcionais, não vamos mandar id pra api pq é automatico
    return this.http.post<Usuario>(`${this.API_BASE}/usuarios`, usuario);
  }
  atualizar(id: number, usuario: Partial<Usuario>): Observable<Usuario> {
  return this.http.put<Usuario>(`${this.API_BASE}/usuarios/${id}`, usuario);
}
}
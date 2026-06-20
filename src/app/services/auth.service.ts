import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../model/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  login(email: string, senha: string): Observable<Usuario> {
    return this.http.get<Usuario[]>(`${this.API_BASE}/usuarios`).pipe(
      map(usuarios => {
        const usuario = usuarios.find(
          u => u.email === email && u.senha === senha && u.status === 1
        );
        if (!usuario) throw new Error('Email ou senha inválidos');
        return usuario;
      }),
      tap(usuario => localStorage.setItem('usuario_sessao', JSON.stringify(usuario)))
    );
  }

  cadastrar(dados: { nome: string; email: string; senha: string }): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.API_BASE}/usuarios`, dados).pipe(
      tap(usuario => localStorage.setItem('usuario_sessao', JSON.stringify(usuario)))
    );
  }

  logout(): void {
    localStorage.removeItem('usuario_sessao');
  }

  isLoggedIn(): boolean {
    return this.getUsuarioId() !== null;
  }

  getUsuarioId(): number | null {
    const sessao = localStorage.getItem('usuario_sessao');
    if (!sessao) return null;
    return JSON.parse(sessao)?.id ?? null;
  }

  getUsuarioLogado(): Usuario | null {
    const sessao = localStorage.getItem('usuario_sessao');
    return sessao ? JSON.parse(sessao) : null;
  }
}
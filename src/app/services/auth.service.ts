import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private readonly API_BASE =
    'http://academico3.rj.senac.br/20261prjint3manha-mentoria/api';

  // =========================
  // CADASTRO
  // =========================
  cadastrar(dadosUsuario: any): Observable<any> {

    const payload = {
      nome: dadosUsuario.nome,
      email: dadosUsuario.email,
      senha: dadosUsuario.password
    };

    return this.http.post<any>(
      `${this.API_BASE}/usuarios`,
      payload
    ).pipe(
      tap(usuarioCriado => {

        if (usuarioCriado) {
          localStorage.setItem(
            'usuario_sessao',
            JSON.stringify(usuarioCriado)
          );
        }
      })
    );
  }

  // =========================
  // LOGIN (TEMPORÁRIO LOCAL)
  // =========================
  buscarUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.API_BASE}/usuarios`
    );
  }

  // =========================
  // ONBOARDING - OPÇÃO
  // =========================
  salvarRespostaOpcao(
    usuarioId: number,
    opcaoId: number
  ): Observable<any> {

    const payload = {
      clienteUsuarioId: usuarioId,
      opcaoPerguntaId: opcaoId,
      status: 1
    };

    return this.http.post<any>(
      `${this.API_BASE}/opcoes-pergunta`,
      payload
    );
  }

  // =========================
  // ONBOARDING - TEXTO
  // =========================
  salvarRespostaTexto(
    usuarioId: number,
    perguntaId: number,
    texto: string
  ): Observable<any> {

    const payload = {
      clienteUsuarioId: usuarioId,
      perguntaCadastroId: perguntaId,
      conteudo: texto,
      status: 1
    };

    return this.http.post<any>(
      `${this.API_BASE}/respostas-texto`,
      payload
    );
  }

  // =========================
  // SESSÃO
  // =========================
  getUsuarioId(): number | null {

    const sessao =
      localStorage.getItem('usuario_sessao');

    if (!sessao) return null;

    const usuario = JSON.parse(sessao);

    return usuario.id ?? null;
  }

  logout(): void {
    localStorage.removeItem('usuario_sessao');
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  // URL base adaptada ao padrão do projeto
  private readonly API_BASE = 'http://academico3.rj.senac.br/20261prjint3manha-mentoria/api';

  // 1. NOVO/FALTANDO: Envia os dados de cadastro para a API do Senac
  cadastrar(dadosUsuario: any): Observable<any> {
    const payload = {
      nome: dadosUsuario.nome,
      email: dadosUsuario.email,
      senha: dadosUsuario.password // Alinhe o nome deste campo com o DTO do seu Java se necessário
    };

    return this.http.post<any>(`${this.API_BASE}/usuarios`, payload).pipe(
      tap(usuarioCriado => {
        // Se a API retornar o objeto com o ID do banco, já deixamos salvo no localStorage para o Onboarding ler
        if (usuarioCriado) {
          localStorage.setItem('usuario_sessao', JSON.stringify(usuarioCriado));
        }
      })
    );
  }

  // 2. Envia a resposta de Múltipla Escolha (Passo 1 do Onboarding)
  salvarRespostaOpcao(usuarioId: number, opcaoId: number): Observable<any> {
    const payload = {
      clienteUsuarioId: usuarioId,
      opcaoPerguntaId: opcaoId,
      status: 1
    };
    return this.http.post<any>(`${this.API_BASE}/opcoes-pergunta`, payload);
  }

  // 3. Envia a resposta de Texto Livre (Passos 2 e 3 do Onboarding)
  salvarRespostaTexto(usuarioId: number, perguntaId: number, texto: string): Observable<any> {
    const payload = {
      clienteUsuarioId: usuarioId,
      perguntaCadastroId: perguntaId,
      conteudo: texto,
      status: 1
    };
    return this.http.post<any>(`${this.API_BASE}/respostas-texto`, payload);
  }

  // Recupera o ID logado salvo no localStorage
  getUsuarioId(): number {
    const sessao = localStorage.getItem('usuario_sessao');
    if (sessao) {
      const usuario = JSON.parse(sessao);
      // Mapeia de forma segura: tenta pegar 'id' ou 'clienteUsuarioId' ou 'usuarioId' dependendo do retorno do Java
      return usuario.id || usuario.clienteUsuarioId || usuario.usuarioId || 3;
    }
    return 3; // Fallback para testes (Usuario ID 3 fornecido no seu JSON)
  }
}

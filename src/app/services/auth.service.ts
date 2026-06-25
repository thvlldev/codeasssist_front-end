import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, switchMap, of, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../model/usuario.model';
import { Cliente } from '../model/cliente.model';
import { Mentor } from '../model/mentor.model';
import { TipoUsuario } from '../shared/enums/TipoUsuario';
import { ClienteService } from './cliente.service';
import { MentorService } from './mentor.service';

const CHAVE_SESSAO = 'usuario_sessao';
const CHAVE_PAPEL = 'papel_ativo';

export interface ResultadoAcesso {
  usuario: Usuario;
  papel: TipoUsuario;
  precisaOnboarding: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private clienteService = inject(ClienteService);
  private mentorService = inject(MentorService);
  private readonly API_BASE = environment.apiServer;

  /**
   * Faz login validando email/senha e, em seguida, garante que o usuário
   * possua um registro para o papel escolhido (Cliente ou Mentor).
   * Caso seja a primeira vez que essa conta assume esse papel, o registro
   * é criado com onboardingConcluido = 0 e o front deve redirecionar para o onboarding.
   */
  login(email: string, senha: string, papel: TipoUsuario): Observable<ResultadoAcesso> {
    return this.http.get<Usuario[]>(`${this.API_BASE}/usuarios`).pipe(
      map(usuarios => {
        const usuario = usuarios.find(
          u => u.email === email && u.senha === senha && u.status === 1
        );
        if (!usuario) throw new Error('Email ou senha inválidos');
        return usuario;
      }),
      switchMap(usuario => this.assumirPapel(usuario, papel))
    );
  }

  /**
   * Cria a conta (Usuario) já vinculada ao papel escolhido no passo anterior
   * ao formulário, e cria também o registro inicial em Cliente ou Mentor
   * (sempre com onboardingConcluido = 0, pois é cadastro novo).
   */
  cadastrar(dados: { nome: string; email: string; senha: string }, papel: TipoUsuario): Observable<ResultadoAcesso> {
    const payloadUsuario = {
      nome: dados.nome,
      email: dados.email,
      senha: dados.senha,
      tipoUsuario: papel,
      dataCadastro: new Date().toISOString().slice(0, 10),
      status: 1
    };

    return this.http.post<Usuario>(`${this.API_BASE}/usuarios`, payloadUsuario).pipe(
      switchMap(usuario => this.criarPerfilPapel(usuario, papel).pipe(
        map(() => ({ usuario, papel, precisaOnboarding: true }))
      )),
      tap(resultado => this.salvarSessao(resultado))
    );
  }

  /**
   * Garante que o registro de Cliente/Mentor exista para o usuário e o papel
   * informados. Se não existir, cria com onboardingConcluido = 0.
   * Retorna se o onboarding daquele papel ainda precisa ser feito.
   */
  private assumirPapel(usuario: Usuario, papel: TipoUsuario): Observable<ResultadoAcesso> {
    const busca$: Observable<Cliente | Mentor | undefined> = papel === TipoUsuario.Mentor
      ? this.mentorService.buscarPorUsuarioId(usuario.id)
      : this.clienteService.buscarPorUsuarioId(usuario.id);

    return busca$.pipe(
      switchMap(perfil => {
        if (!perfil) {
          // Primeira vez que essa conta assume esse papel: cria o registro.
          return this.criarPerfilPapel(usuario, papel).pipe(
            map(() => ({ usuario, papel, precisaOnboarding: true }))
          );
        }
        const onboardingConcluido = perfil.onboardingConcluido === 1;
        return of({ usuario, papel, precisaOnboarding: !onboardingConcluido });
      }),
      switchMap(resultado => this.atualizarTipoUsuario(usuario, papel).pipe(
        map(usuarioAtualizado => ({ ...resultado, usuario: usuarioAtualizado }))
      )),
      tap(resultado => this.salvarSessao(resultado))
    );
  }

  private criarPerfilPapel(usuario: Usuario, papel: TipoUsuario): Observable<Cliente | Mentor> {
    if (papel === TipoUsuario.Mentor) {
      return this.mentorService.criar({
        usuarioId: usuario.id,
        descricao: '',
        precoHora: 0,
        mediaAvaliacao: 0,
        onboardingConcluido: 0,
        status: 1
      });
    }
    return this.clienteService.criar({
      usuarioId: usuario.id,
      stack: '',
      descricao: '',
      onboardingConcluido: 0,
      status: 1
    });
  }

  /**
   * Mantém o campo tipoUsuario do Usuario sincronizado com o último papel
   * assumido na sessão (PUT /usuarios/:id).
   */
  private atualizarTipoUsuario(usuario: Usuario, papel: TipoUsuario): Observable<Usuario> {
    if (usuario.tipoUsuario === papel) {
      return of(usuario);
    }
    const usuarioAtualizado = { ...usuario, tipoUsuario: papel };
    return this.http.put<Usuario>(`${this.API_BASE}/usuarios/${usuario.id}`, usuarioAtualizado).pipe(
      catchError(() => of(usuarioAtualizado))
    );
  }

  private salvarSessao(resultado: ResultadoAcesso): void {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(resultado.usuario));
    localStorage.setItem(CHAVE_PAPEL, String(resultado.papel));
  }

  /** Marca o onboarding do papel ativo como concluído (chamado ao final do onboarding). */
  marcarOnboardingConcluido(): Observable<Cliente | Mentor> {
    const usuarioId = this.getUsuarioId();
    const papel = this.getPapelAtivo();
    if (!usuarioId || papel === null) {
      throw new Error('Sessão inválida para concluir onboarding.');
    }

    if (papel === TipoUsuario.Mentor) {
      return this.mentorService.buscarPorUsuarioId(usuarioId).pipe(
        switchMap(perfil => {
          if (!perfil) throw new Error('Perfil de mentor não encontrado.');
          return this.mentorService.atualizar(usuarioId, { ...perfil, onboardingConcluido: 1 });
        })
      );
    }
    return this.clienteService.buscarPorUsuarioId(usuarioId).pipe(
      switchMap(perfil => {
        if (!perfil) throw new Error('Perfil de cliente não encontrado.');
        return this.clienteService.atualizar(usuarioId, { ...perfil, onboardingConcluido: 1 });
      })
    );
  }

  logout(): void {
    localStorage.removeItem(CHAVE_SESSAO);
    localStorage.removeItem(CHAVE_PAPEL);
  }

  isLoggedIn(): boolean {
    return this.getUsuarioId() !== null;
  }

  getUsuarioId(): number | null {
    const sessao = localStorage.getItem(CHAVE_SESSAO);
    if (!sessao) return null;
    return JSON.parse(sessao)?.id ?? null;
  }

  getUsuarioLogado(): Usuario | null {
    const sessao = localStorage.getItem(CHAVE_SESSAO);
    return sessao ? JSON.parse(sessao) : null;
  }

  /** Papel (Cliente ou Mentor) assumido nesta sessão. */
  getPapelAtivo(): TipoUsuario | null {
    const papel = localStorage.getItem(CHAVE_PAPEL);
    if (papel === null) return null;
    return Number(papel) as TipoUsuario;
  }

  isMentorAtivo(): boolean {
    return this.getPapelAtivo() === TipoUsuario.Mentor;
  }

  isClienteAtivo(): boolean {
    return this.getPapelAtivo() === TipoUsuario.Cliente;
  }
}

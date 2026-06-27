import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { ClienteService } from '../../services/cliente.service';
import { MentorService } from '../../services/mentor.service';
import { TecnologiaService } from '../../services/tecnologia.service';
import { UsuarioTecnologiaService } from '../../services/usuario_tecnologia.service';
import { AvaliacaoService } from '../../services/avaliacao.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Usuario } from '../../model/usuario.model';
import { Cliente } from '../../model/cliente.model';
import { Mentor } from '../../model/mentor.model';
import { Tecnologia } from '../../model/tecnologia.model';
import { UsuarioTecnologia } from '../../model/usuario_tecnologia.model';
import { Avaliacao } from '../../model/avaliacao.model';
import { forkJoin, map } from 'rxjs';

interface AvaliacaoComCliente extends Avaliacao {
  nomeCliente?: string;
}

interface TecnologiaComStatus extends Tecnologia {
  vinculada: boolean;
  jaExistia: boolean;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css']
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private clienteService = inject(ClienteService);
  private mentorService = inject(MentorService);
  private tecnologiaService = inject(TecnologiaService);
  private usuarioTecnologiaService = inject(UsuarioTecnologiaService);
  private avaliacaoService = inject(AvaliacaoService);
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  usuarioLogado        = signal<Usuario | null>(null);
  dadosCliente         = signal<Cliente | undefined>(undefined);
  dadosMentor          = signal<Mentor | undefined>(undefined);
  tecnologiasDoUsuario = signal<Tecnologia[]>([]);
  avaliacoesMentor     = signal<AvaliacaoComCliente[]>([]);
  loading              = signal(true);
  erroMsg              = signal('');

  modalAberto          = signal(false);
  modalLoading         = signal(false);
  modalErro            = signal('');
  todasTecnologias     = signal<TecnologiaComStatus[]>([]);
  salvandoTecnologia   = signal<number | null>(null);

  ngOnInit(): void {
    this.carregarDadosPerfil();
  }

  carregarDadosPerfil(): void {
    const id = this.authService.getUsuarioId();
    if (!id) {
      this.erroMsg.set('Usuário não autenticado.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    this.usuarioService.buscarPorId(id).subscribe({
      next: (usuario) => {
        this.usuarioLogado.set(usuario);

        if (usuario.tipoUsuario === 0) {
          forkJoin({
            perfil: this.clienteService.buscarPorUsuarioId(id),
            techs: this.usuarioTecnologiaService.listarPorUsuario(id)
          }).subscribe({
            next: (res) => {
              this.dadosCliente.set(res.perfil);
              this.filtrarNomesTecnologias(res.techs);
              this.loading.set(false);
            },
            error: () => this.loading.set(false)
          });

        } else if (usuario.tipoUsuario === 1) {
          forkJoin({
            perfil: this.mentorService.buscarPorUsuarioId(id),
            techs: this.usuarioTecnologiaService.listarPorUsuario(id),
            feedbacks: this.avaliacaoService.listarPorMentor(id)
          }).subscribe({
            next: (res) => {
              this.dadosMentor.set(res.perfil);
              this.filtrarNomesTecnologias(res.techs);

              if (!res.feedbacks || res.feedbacks.length === 0) {
                this.avaliacoesMentor.set([]);
                this.loading.set(false);
                return;
              }

              const reqs$ = res.feedbacks.map(av =>
                this.http.get<any>(`${this.API_BASE}/usuarios/${av.clienteUsuarioId}`).pipe(
                  map(user => ({ ...av, nomeCliente: user.nome }))
                )
              );

              forkJoin(reqs$).subscribe({
                next: (completos) => {
                  this.avaliacoesMentor.set(completos);
                  this.loading.set(false);
                },
                error: () => {
                  this.avaliacoesMentor.set(
                    res.feedbacks.map(f => ({ ...f, nomeCliente: 'Usuário do Sistema' }))
                  );
                  this.loading.set(false);
                }
              });
            },
            error: () => this.loading.set(false)
          });

        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.erroMsg.set('Erro ao carregar os dados do perfil.');
        this.loading.set(false);
      }
    });
  }

  private filtrarNomesTecnologias(relacoes: UsuarioTecnologia[]): void {
    if (!relacoes || relacoes.length === 0) {
      this.tecnologiasDoUsuario.set([]);
      return;
    }
    this.tecnologiaService.listarTodas().subscribe({
      next: (todasTechs) => {
        const idsVinculados = relacoes.filter(r => r.status === 1).map(r => r.tecnologiaId);
        this.tecnologiasDoUsuario.set(todasTechs.filter(t => idsVinculados.includes(t.id)));
      }
    });
  }

  // ── Modal ─────────────────────────────────────────────────────────────

  abrirModalTecnologias(): void {
    this.modalErro.set('');
    this.modalLoading.set(true);
    this.todasTecnologias.set([]);
    this.modalAberto.set(true);

    const usuarioId = this.authService.getUsuarioId()!;

    this.tecnologiaService.listarTodas().subscribe({
      next: (todas) => {
        this.usuarioTecnologiaService.listarTodas().subscribe({
          next: (relacoes) => {
            const relacoesDoUsuario = relacoes.filter(r => r.usuarioId === usuarioId);
            this.todasTecnologias.set(
              todas
                .filter(t => t.status === 1)
                .map(t => {
                  const rel = relacoesDoUsuario.find(r => r.tecnologiaId === t.id);
                  return { ...t, vinculada: rel ? rel.status === 1 : false, jaExistia: !!rel };
                })
            );
            this.modalLoading.set(false);
          },
          error: () => {
            this.todasTecnologias.set(
              todas.filter(t => t.status === 1).map(t => ({ ...t, vinculada: false, jaExistia: false }))
            );
            this.modalErro.set('Não foi possível carregar suas tecnologias vinculadas.');
            this.modalLoading.set(false);
          }
        });
      },
      error: () => {
        this.modalErro.set('Erro ao carregar lista de tecnologias. Tente novamente.');
        this.modalLoading.set(false);
      }
    });
  }

  fecharModalTecnologias(): void {
    this.modalAberto.set(false);
  }

  toggleTecnologia(tech: TecnologiaComStatus): void {
    const usuarioId = this.authService.getUsuarioId()!;
    this.salvandoTecnologia.set(tech.id);
    this.modalErro.set('');

    const atualizar = (novoStatus: number) => {
      this.usuarioTecnologiaService.atualizar(usuarioId, tech.id, novoStatus).subscribe({
        next: () => {
          tech.vinculada = novoStatus === 1;
          tech.jaExistia = true;
          this.todasTecnologias.set([...this.todasTecnologias()]);
          this.salvandoTecnologia.set(null);
          this.sincronizarBadges();
        },
        error: () => {
          this.modalErro.set(`Erro ao ${novoStatus === 1 ? 'adicionar' : 'remover'} ${tech.nome}.`);
          this.salvandoTecnologia.set(null);
        }
      });
    };

    if (tech.vinculada) {
      atualizar(0);
    } else if (tech.jaExistia) {
      atualizar(1);
    } else {
      this.usuarioTecnologiaService.criar({ usuarioId, tecnologiaId: tech.id, status: 1 }).subscribe({
        next: () => {
          tech.vinculada = true;
          tech.jaExistia = true;
          this.todasTecnologias.set([...this.todasTecnologias()]);
          this.salvandoTecnologia.set(null);
          this.sincronizarBadges();
        },
        error: () => {
          this.modalErro.set(`Erro ao adicionar ${tech.nome}.`);
          this.salvandoTecnologia.set(null);
        }
      });
    }
  }

  private sincronizarBadges(): void {
    this.tecnologiasDoUsuario.set(
      this.todasTecnologias()
        .filter(t => t.vinculada)
        .map(t => ({ id: t.id, nome: t.nome, status: t.status }))
    );
  }

  // ── Utilitários ───────────────────────────────────────────────────────

  getIniciais(nome?: string): string {
    if (!nome) return 'US';
    const partes = nome.split(' ');
    return partes.length > 1
      ? (partes[0][0] + partes[1][0]).toUpperCase()
      : partes[0][0].toUpperCase();
  }

  formatarData(dataStr?: string): string {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataStr;
  }

  gerarEstrelas(nota: number): number[] {
    return Array(Math.floor(nota || 0)).fill(0);
  }
}

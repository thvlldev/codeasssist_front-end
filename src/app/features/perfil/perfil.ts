import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { ClienteService } from '../../services/cliente.service';
import { MentorService } from '../../services/mentor.service';
import { TecnologiaService } from '../../services/tecnologia.service';
import { UsuarioTecnologiaService } from '../../services/usuario_tecnologia.service';
import { AvaliacaoService } from '../../services/avaliacao.service'; // Usando o seu service existente
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Usuario } from '../../model/usuario.model';
import { Cliente } from '../../model/cliente.model';
import { Mentor } from '../../model/mentor.model';
import { Tecnologia } from '../../model/tecnologia.model';
import { Avaliacao } from '../../model/avaliacao.model'; // Usando a sua model existente
import { forkJoin, map } from 'rxjs';

interface AvaliacaoComCliente extends Avaliacao {
  nomeCliente?: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
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
  private avaliacaoService = inject(AvaliacaoService); // Injetando o seu service
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private readonly API_BASE = environment.apiServer;

  usuarioLogado: Usuario | null = null;
  dadosCliente?: Cliente;
  dadosMentor?: Mentor;
  tecnologiasDoUsuario: Tecnologia[] = [];

  avaliacoesMentor: AvaliacaoComCliente[] = [];

  loading: boolean = true;
  erroMsg: string = '';

  ngOnInit(): void {
    this.carregarDadosPerfil();
  }

  carregarDadosPerfil(): void {
    const id = this.authService.getUsuarioId();
    if (!id) {
      this.erroMsg = 'Usuário não autenticado.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;

    this.usuarioService.buscarPorId(id).subscribe({
      next: (usuario) => {
        this.usuarioLogado = usuario;

        if (usuario.tipoUsuario === 0) {
          forkJoin({
            perfil: this.clienteService.buscarPorUsuarioId(id),
            techs: this.usuarioTecnologiaService.listarPorUsuario(id)
          }).subscribe({
            next: (res) => {
              this.dadosCliente = res.perfil;
              this.filtrarNomesTecnologias(res.techs);
              this.loading = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.loading = false;
              this.cdr.detectChanges();
            }
          });
        } else if (usuario.tipoUsuario === 1) {
          forkJoin({
            perfil: this.mentorService.buscarPorUsuarioId(id),
            techs: this.usuarioTecnologiaService.listarPorUsuario(id),
            feedbacks: this.avaliacaoService.listarPorMentor(id) // Chamando o seu método com mentorUsuarioId
          }).subscribe({
            next: (res) => {
              this.dadosMentor = res.perfil;
              this.filtrarNomesTecnologias(res.techs);

              if (!res.feedbacks || res.feedbacks.length === 0) {
                this.avaliacoesMentor = [];
                this.loading = false;
                this.cdr.detectChanges();
                return;
              }

              // Mapeia os clientes que fizeram as avaliações buscando de /usuarios/{id}
              const requisicoesClientes$ = res.feedbacks.map(av =>
                this.http.get<any>(`${this.API_BASE}/usuarios/${av.clienteUsuarioId}`).pipe(
                  map(user => ({ ...av, nomeCliente: user.nome }))
                )
              );

              forkJoin(requisicoesClientes$).subscribe({
                next: (comentariosCompletos) => {
                  this.avaliacoesMentor = comentariosCompletos;
                  this.loading = false;
                  this.cdr.detectChanges();
                },
                error: () => {
                  this.avaliacoesMentor = res.feedbacks.map(f => ({ ...f, nomeCliente: 'Usuário do Sistema' }));
                  this.loading = false;
                  this.cdr.detectChanges();
                }
              });
            },
            error: () => {
              this.loading = false;
              this.cdr.detectChanges();
            }
          });
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.erroMsg = 'Erro ao carregar os dados do perfil.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private filtrarNomesTecnologias(relacoes: any[]): void {
    if (!relacoes || relacoes.length === 0) {
      this.tecnologiasDoUsuario = [];
      this.cdr.detectChanges();
      return;
    }

    this.tecnologiaService.listarTodas().subscribe({
      next: (todasTechs) => {
        const idsVinculados = relacoes.filter(r => r.status === 1).map(r => r.tecnologiaId);
        this.tecnologiasDoUsuario = todasTechs.filter(t => idsVinculados.includes(t.id));
        this.cdr.detectChanges();
      }
    });
  }

  getIniciais(nome?: string): string {
    if (!nome) return 'US';
    const partes = nome.split(' ');
    if (partes.length > 1) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return partes[0][0].toUpperCase();
  }

  formatarData(dataStr?: string): string {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  }

  gerarEstrelas(nota: number): number[] {
    return Array(Math.floor(nota || 0)).fill(0);
  }
}

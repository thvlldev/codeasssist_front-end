import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; // Adicionado ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { ClienteService } from '../../services/cliente.service';
import { MentorService } from '../../services/mentor.service';
import { TecnologiaService } from '../../services/tecnologia.service';
import { UsuarioTecnologiaService } from '../../services/usuario_tecnologia.service';
import { Usuario } from '../../model/usuario.model';
import { Cliente } from '../../model/cliente.model';
import { Mentor } from '../../model/mentor.model';
import { Tecnologia } from '../../model/tecnologia.model';
import { forkJoin } from 'rxjs';

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
  private cdr = inject(ChangeDetectorRef); // Injetando o detector de mudanças de forma limpa

  usuarioLogado: Usuario | null = null;
  dadosCliente?: Cliente;
  dadosMentor?: Mentor;
  tecnologiasDoUsuario: Tecnologia[] = [];

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
      this.cdr.detectChanges(); // Força atualização da mensagem de erro na tela
      return;
    }

    this.loading = true;

    // 1. Busca os dados principais do Usuário
    this.usuarioService.buscarPorId(id).subscribe({
      next: (usuario) => {
        this.usuarioLogado = usuario;

        // 2. Dispara as consultas do Perfil específico e Relações de Tecnologia em paralelo
        if (usuario.tipoUsuario === 0) {
          // É Cliente
          forkJoin({
            perfil: this.clienteService.buscarPorUsuarioId(id),
            techs: this.usuarioTecnologiaService.listarPorUsuario(id)
          }).subscribe({
            next: (res: { perfil: Cliente | undefined; techs: any[] }) => {
              this.dadosCliente = res.perfil;
              this.filtrarNomesTecnologias(res.techs);
              this.loading = false;
              this.cdr.detectChanges(); // Garante a renderização do layout do Cliente
            },
            error: () => {
              this.loading = false;
              this.cdr.detectChanges();
            }
          });
        } else if (usuario.tipoUsuario === 1) {
          // É Mentor
          forkJoin({
            perfil: this.mentorService.buscarPorUsuarioId(id),
            techs: this.usuarioTecnologiaService.listarPorUsuario(id)
          }).subscribe({
            next: (res: { perfil: Mentor | undefined; techs: any[] }) => {
              this.dadosMentor = res.perfil;
              this.filtrarNomesTecnologias(res.techs);
              this.loading = false;
              this.cdr.detectChanges(); // Garante a renderização do layout do Mentor
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
      error: (err) => {
        this.erroMsg = 'Erro ao carregar os dados do perfil.';
        this.loading = false;
        this.cdr.detectChanges(); // Renderiza o estado de erro geral
      }
    });
  }

  // 3. Cruza os IDs da tabela de junção com a lista global de tecnologias para obter os nomes reais
  private filtrarNomesTecnologias(relacoes: any[]): void {
    if (!relacoes || relacoes.length === 0) {
      this.tecnologiasDoUsuario = [];
      this.cdr.detectChanges();
      return;
    }

    this.tecnologiaService.listarTodas().subscribe({
      next: (todasTechs) => {
        // Filtra os IDs das relações que possuem status ativo (1)
        const idsVinculados = relacoes.filter(r => r.status === 1).map(r => r.tecnologiaId);
        this.tecnologiasDoUsuario = todasTechs.filter(t => idsVinculados.includes(t.id));
        this.cdr.detectChanges(); // Atualiza a seção de tags assim que as strings forem resolvidas
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
}

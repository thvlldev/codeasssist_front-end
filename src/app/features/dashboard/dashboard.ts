import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { DashboardData, DashboardCliente, DashboardMentor } from '../../model/dashboard.model';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { TipoUsuario } from '../../shared/enums/TipoUsuario';
import { TecnologiaService } from '../../services/tecnologia.service';
import { UsuarioTecnologiaService } from '../../services/usuario_tecnologia.service';
import { Tecnologia } from '../../model/tecnologia.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private tecnologiaService = inject(TecnologiaService);
  private usuarioTecnologiaService = inject(UsuarioTecnologiaService);
  private cdr = inject(ChangeDetectorRef);

  dashboard!: DashboardData;
  carregando = true;

  modalTecnologiasAberto = false;
  todasTecnologias: Tecnologia[] = [];
  tecnologiasSelecionadas: number[] = [];
  salvandoTecnologias = false;

  get ehMentor(): boolean {
    return this.authService.getPapelAtivo() === TipoUsuario.Mentor;
  }

  get dashboardCliente(): DashboardCliente {
    return this.dashboard as DashboardCliente;
  }

  get dashboardMentor(): DashboardMentor {
    return this.dashboard as DashboardMentor;
  }

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.carregando = true;
    const usuarioId = this.authService.getUsuarioId();

    if (!usuarioId) {
      this.carregando = false;
      return;
    }

    const obs$: Observable<DashboardData> = this.ehMentor
      ? this.dashboardService.buscarDashboardMentor(usuarioId)
      : this.dashboardService.buscarDashboardCliente(usuarioId);

    obs$.subscribe({
      next: (dados: DashboardData) => {
        this.dashboard = dados;
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        console.error('Erro ao carregar dashboard:', err);
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalTecnologias(): void {
    const usuarioId = this.authService.getUsuarioId();
    if (!usuarioId) return;

    forkJoin([
      this.tecnologiaService.listarTodas(),
      this.usuarioTecnologiaService.listarPorUsuario(usuarioId)
    ]).subscribe({
      next: ([todas, doUsuario]) => {
        this.todasTecnologias = todas.filter(t => t.status !== 0);
        this.tecnologiasSelecionadas = doUsuario
          .filter(ut => ut.status !== 0)
          .map(ut => ut.tecnologiaId);
        this.modalTecnologiasAberto = true;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => console.error('Erro ao carregar tecnologias:', err)
    });
  }

  toggleTecnologia(id: number): void {
    const idx = this.tecnologiasSelecionadas.indexOf(id);
    if (idx >= 0) {
      this.tecnologiasSelecionadas.splice(idx, 1);
    } else {
      this.tecnologiasSelecionadas.push(id);
    }
  }

  tecnologiaEstaAtiva(id: number): boolean {
    return this.tecnologiasSelecionadas.includes(id);
  }

  salvarTecnologias(): void {
    const usuarioId = this.authService.getUsuarioId();
    if (!usuarioId) return;

    this.salvandoTecnologias = true;

    this.usuarioTecnologiaService.listarPorUsuario(usuarioId).subscribe({
      next: (existentes) => {
        const ativas = existentes.filter(ut => ut.status !== 0);
        const idsExistentes = ativas.map(ut => ut.tecnologiaId);

        const adicionar = this.tecnologiasSelecionadas.filter(id => !idsExistentes.includes(id));
        const remover = ativas.filter(ut => !this.tecnologiasSelecionadas.includes(ut.tecnologiaId));

        const ops: Observable<unknown>[] = [
          ...adicionar.map(techId =>
            this.usuarioTecnologiaService.criar({ usuarioId, tecnologiaId: techId, status: 1 })
          ),
          ...remover.map(ut =>
            this.usuarioTecnologiaService.atualizar(usuarioId, ut.tecnologiaId, { ...ut, status: 0 })
          )
        ];

        if (ops.length === 0) {
          this.modalTecnologiasAberto = false;
          this.salvandoTecnologias = false;
          this.cdr.detectChanges();
          return;
        }

        forkJoin(ops).subscribe({
          next: () => {
            this.salvandoTecnologias = false;
            this.modalTecnologiasAberto = false;
            this.carregarDados();
          },
          error: (err: unknown) => {
            console.error('Erro ao salvar tecnologias:', err);
            this.salvandoTecnologias = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err: unknown) => {
        console.error('Erro ao listar tecnologias do usuário:', err);
        this.salvandoTecnologias = false;
        this.cdr.detectChanges();
      }
    });
  }

  fecharModal(): void {
    this.modalTecnologiasAberto = false;
    this.cdr.detectChanges();
  }

  getLabelStatus(status: number): string {
    switch (status) {
      case 1: return 'Pendente';
      case 2: return 'Aceita';
      case 3: return 'Recusada';
      default: return 'Desconhecido';
    }
  }

  getClasseStatus(status: number): string {
    switch (status) {
      case 1: return 'bg-warning-subtle text-warning';
      case 2: return 'bg-success-subtle text-success';
      case 3: return 'bg-danger-subtle text-danger';
      default: return 'bg-secondary-subtle text-secondary';
    }
  }

  getLabelStatusPublicacao(status: number): string {
    switch (status) {
      case 1: return 'Aberta';
      case 2: return 'Em Andamento';
      case 3: return 'Finalizada';
      default: return 'Desconhecida';
    }
  }
}
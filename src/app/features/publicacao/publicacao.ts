import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidenav } from '../../shared/sidenav/sidenav';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Publicacao } from '../../model/publicacao.model';
import { PublicacaoService } from '../../services/publicacao.service';

@Component({
  selector: 'app-publicacoes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Sidenav],
  templateUrl: './publicacao.html',
  styleUrls: ['./publicacao.css']
})
export class PublicacoesComponent implements OnInit, OnDestroy {

  publicacoes: Publicacao[] = [];
  publicacoesFiltradas: Publicacao[] = [];
  termoBusca: string = '';
  carregando: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private publicacaoService: PublicacaoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarPublicacoes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregarPublicacoes(): void {
    this.carregando = true;
    this.cdr.detectChanges(); // Força o HTML a renderizar o spinner de cara

    this.publicacaoService.listarTodas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dados) => {
          this.publicacoes = dados || [];
          this.publicacoesFiltradas = [...this.publicacoes];
          this.carregando = false;
          this.cdr.detectChanges(); // OBRIGA o HTML a sumir com o spinner e desenhar os cards
        },
        error: (err) => {
          console.error('Erro ao carregar publicações da API:', err);
          this.carregando = false;
          this.cdr.detectChanges(); // Esconde o spinner mesmo em caso de erro da API
        },
        complete: () => {
          this.carregando = false;
          this.cdr.detectChanges();
        }
      });
  }

  filtrarPublicacoes(): void {
    if (!this.termoBusca.trim()) {
      this.publicacoesFiltradas = this.publicacoes;
      return;
    }
    this.publicacoesFiltradas = this.publicacoes.filter(pub =>
      pub.titulo?.toLowerCase().includes(this.termoBusca.toLowerCase()) ||
      pub.conteudo?.toLowerCase().includes(this.termoBusca.toLowerCase())
    );
    this.cdr.detectChanges();
  }
}

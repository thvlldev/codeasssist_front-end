import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { PublicacaoService } from '../../services/publicacao.service';
import { PublicacaoTecnologiaService } from '../../services/publicacao_tecnologia.service';
import { TecnologiaService } from '../../services/tecnologia.service';
import { AuthService } from '../../services/auth.service';
import { Publicacao } from '../../model/publicacao.model';
import { Tecnologia } from '../../model/tecnologia.model';
import { Footer } from '../../shared/footer/footer';

interface PublicacaoComTecnologias extends Publicacao {
  tecnologias: Tecnologia[];
}

@Component({
  selector: 'app-publicacoes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Footer],
  templateUrl: './publicacao.html',
  styleUrls: ['./publicacao.css']
})
export class PublicacoesComponent implements OnInit {

  private publicacaoService = inject(PublicacaoService);
  private publicacaoTecnologiaService = inject(PublicacaoTecnologiaService);
  private tecnologiaService = inject(TecnologiaService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  publicacoes: PublicacaoComTecnologias[] = [];
  publicacoesFiltradas: PublicacaoComTecnologias[] = [];

  termoBusca: string = '';
  carregando: boolean = true;

  ngOnInit(): void {
    this.carregarMinhasPublicacoes();
  }

  carregarMinhasPublicacoes(): void {

    this.carregando = true;

    const usuarioId = this.authService.getUsuarioId();

    if (!usuarioId) {
      console.error('Nenhum usuário logado encontrado.');
      this.carregando = false;
      return;
    }

    forkJoin([
      this.publicacaoService.listarPorUsuario(usuarioId),
      this.publicacaoTecnologiaService.listarTodas(),
      this.tecnologiaService.listarTodas()
    ]).subscribe({

      next: ([minhasPublicacoes, relacoes, tecnologias]) => {

        this.publicacoes = minhasPublicacoes.map(pub => {

          const idsRelacionados = relacoes
            .filter(r => r.publicacaoId === pub.id)
            .map(r => r.tecnologiaId);

          const tecnologiasDaPub = tecnologias.filter(t =>
            idsRelacionados.includes(t.id)
          );

          return { ...pub, tecnologias: tecnologiasDaPub };
        });

        this.publicacoesFiltradas = [...this.publicacoes];
        this.carregando = false;
        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Erro ao buscar publicações:', err);
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  filtrarPublicacoes(): void {

    if (!this.publicacoes || this.publicacoes.length === 0) {
      this.publicacoesFiltradas = [];
      return;
    }

    if (!this.termoBusca || !this.termoBusca.trim()) {
      this.publicacoesFiltradas = [...this.publicacoes];
      return;
    }

    const termo = this.termoBusca.toLowerCase().trim();

    this.publicacoesFiltradas = this.publicacoes.filter(pub => {
      const tituloBate = pub.titulo ? pub.titulo.toLowerCase().includes(termo) : false;
      const conteudoBate = pub.conteudo ? pub.conteudo.toLowerCase().includes(termo) : false;
      return tituloBate || conteudoBate;
    });
  }
}

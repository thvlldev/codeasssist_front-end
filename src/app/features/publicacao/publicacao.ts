import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { PublicacaoService } from '../../services/publicacao.service';
import { PublicacaoTecnologiaService } from '../../services/publicacao_tecnologia.service';
import { TecnologiaService } from '../../services/tecnologia.service';
import { UsuarioTecnologiaService } from '../../services/usuario_tecnologia.service'; // Injetado
import { AuthService } from '../../services/auth.service';
import { Publicacao } from '../../model/publicacao.model';
import { Tecnologia } from '../../model/tecnologia.model';

interface PublicacaoComTecnologias extends Publicacao {
  tecnologias: Tecnologia[];
}

@Component({
  selector: 'app-publicacoes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './publicacao.html',
  styleUrls: ['./publicacao.css']
})
export class PublicacoesComponent implements OnInit {

  private publicacaoService = inject(PublicacaoService);
  private publicacaoTecnologiaService = inject(PublicacaoTecnologiaService);
  private tecnologiaService = inject(TecnologiaService);
  private usuarioTecnologiaService = inject(UsuarioTecnologiaService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  publicacoes: PublicacaoComTecnologias[] = [];
  publicacoesFiltradas: PublicacaoComTecnologias[] = [];

  termoBusca: string = '';
  carregando: boolean = true;
  ehMentor: boolean = false; // Flag para o chaveamento reativo da tela

  ngOnInit(): void {
    // Determina o papel do usuário na sessão (1 para Mentor)
    const papel = this.authService.getPapelAtivo();
    this.ehMentor = papel === 1;

    this.carregarDadosMural();
  }

  carregarDadosMural(): void {
    this.carregando = true;
    const usuarioId = this.authService.getUsuarioId();

    if (!usuarioId) {
      console.error('Nenhum usuário logado encontrado.');
      style: this.carregando = false;
      return;
    }

    // Carrega em paralelo tudo o que o cruzamento relacional precisa
    forkJoin([
      this.publicacaoService.listarTodas(), // Pega o feed geral
      this.publicacaoTecnologiaService.listarTodas(),
      this.tecnologiaService.listarTodas(),
      this.usuarioTecnologiaService.listarPorUsuario(usuarioId) // Habilidades do mentor
    ]).subscribe({
      next: ([todasPublicacoes, relacoesPubTech, todasTecnologias, techsDoMentor]) => {

        // Extrai apenas os IDs das tecnologias que este mentor domina
        const idsTechsMentor = techsDoMentor.filter(t => t.status === 1).map(t => t.tecnologiaId);

        // Map relacional para injetar a lista de tags [Tecnologia] dentro de cada publicação
        const publicacoesMapeadas = todasPublicacoes.map(pub => {
          const idsRelacionados = relacoesPubTech
            .filter(r => r.publicacaoId === pub.id)
            .map(r => r.tecnologiaId);

          const tecnologiasDaPub = todasTecnologias.filter(t =>
            idsRelacionados.includes(t.id)
          );

          return { ...pub, tecnologias: tecnologiasDaPub };
        });

        // Aplica o filtro de negócios baseado no tipo de usuário logado
        if (this.ehMentor) {
          // SE FOR MENTOR: Esconde as dele e filtra estritamente pelas tecnologias dele
          this.publicacoes = publicacoesMapeadas.filter(pub => {
            const naoEFormuladaPorMim = pub.usuarioId !== usuarioId;
            const possuiTechQueDomino = pub.tecnologias.some(t => idsTechsMentor.includes(t.id));
            return naoEFormuladaPorMim && possuiTechQueDomino;
          });
        } else {
          // SE FOR CLIENTE: Mantém a regra anterior de ver apenas as dele
          this.publicacoes = publicacoesMapeadas.filter(pub => pub.usuarioId === usuarioId);
        }

        this.publicacoesFiltradas = [...this.publicacoes];
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao processar dados do mural:', err);
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

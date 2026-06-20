import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PublicacaoService } from '../../services/publicacao.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-publicacoes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './publicacao.html',
  styleUrls: ['./publicacao.css']
})
export class PublicacoesComponent implements OnInit {

  private publicacaoService = inject(PublicacaoService);
  private authService = inject(AuthService);

  publicacoes: any[] = [];
  publicacoesFiltradas: any[] = [];

  termoBusca: string = '';

  carregando: boolean = true;

  ngOnInit(): void {
    this.carregarMinhasPublicacoes();
  }

  carregarMinhasPublicacoes(): void {

    this.carregando = true;

    const timer = setTimeout(() => {

      if (this.carregando) {

        console.warn(
          'Servidor demorou muito. Ativando fallback.'
        );

        this.ativarFallbackLocal();
      }

    }, 6000);

    try {

      const usuarioId =
        this.authService.getUsuarioId();

      if (!usuarioId) {

        console.error(
          'Nenhum usuário logado encontrado.'
        );

        clearTimeout(timer);

        this.carregando = false;
        return;
      }

      console.log(
        'Buscando publicações do usuário:',
        usuarioId
      );

      this.publicacaoService
        .listarPorUsuario(usuarioId)
        .subscribe({

          next: (dados) => {

            clearTimeout(timer);

            console.log(
              'Resposta da API:',
              dados
            );

            if (
              dados &&
              Array.isArray(dados)
            ) {

              this.publicacoes = dados;

            } else if (
              dados &&
              (dados as any).publicacoes
            ) {

              this.publicacoes =
                (dados as any).publicacoes;

            } else {

              this.publicacoes = [];
            }

            this.publicacoesFiltradas =
              [...this.publicacoes];

            this.carregando = false;
          },

          error: (err) => {

            clearTimeout(timer);

            console.error(
              'Erro ao buscar publicações:',
              err
            );

            this.ativarFallbackLocal();
          }
        });

    } catch (e) {

      clearTimeout(timer);

      console.error(
        'Erro inesperado:',
        e
      );

      this.ativarFallbackLocal();
    }
  }

  private ativarFallbackLocal(): void {

    this.publicacoes = [

      {
        titulo: 'Problema com API',
        conteudo:
          'Problema com GET no servidor do Senac',
        orcamentoMin: 30,
        orcamentoMax: 100,
        dataCriacao: new Date(),
        status: 1
      },

      {
        titulo: 'Ajuda em Angular',
        conteudo:
          'Estou tentando não surtar configurando os injetores e modais',
        orcamentoMin: 20,
        orcamentoMax: 50,
        dataCriacao: new Date(),
        status: 1
      }
    ];

    this.publicacoesFiltradas =
      [...this.publicacoes];

    this.carregando = false;
  }

  filtrarPublicacoes(): void {

    if (
      !this.publicacoes ||
      this.publicacoes.length === 0
    ) {

      this.publicacoesFiltradas = [];
      return;
    }

    if (
      !this.termoBusca ||
      !this.termoBusca.trim()
    ) {

      this.publicacoesFiltradas =
        [...this.publicacoes];

      return;
    }

    const termo =
      this.termoBusca
        .toLowerCase()
        .trim();

    this.publicacoesFiltradas =
      this.publicacoes.filter(pub => {

        const tituloBate =
          pub?.titulo
            ? pub.titulo
                .toLowerCase()
                .includes(termo)
            : false;

        const conteudoBate =
          pub?.conteudo
            ? pub.conteudo
                .toLowerCase()
                .includes(termo)
            : false;

        return (
          tituloBate ||
          conteudoBate
        );
      });
  }
}

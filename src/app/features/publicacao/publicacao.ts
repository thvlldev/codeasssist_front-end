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

// Tipo que estende Publicacao, adicionando o array de tecnologias vinculadas a ela.
// Necessário porque a ligação publicação-tecnologia vem de uma tabela separada
// e esse componente monta esse "join" manualmente em memória.
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

  publicacoes: PublicacaoComTecnologias[] = []; // lista completa já processada e filtrada pela regra de negócio
  publicacoesFiltradas: PublicacaoComTecnologias[] = []; // lista que a tela exibe (reduzida pela busca)

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
      style: this.carregando = false; // "style:" aqui é um label do JS, não faz nada além de rodar a atribuição normalmente
      return;
    }

    // Carrega em paralelo tudo o que o cruzamento relacional precisa
    forkJoin([
      this.publicacaoService.listarTodas(), // Pega o feed geral (GET)
      this.publicacaoTecnologiaService.listarTodas(), // relação publicação-tecnologia (GET)
      this.tecnologiaService.listarTodas(), // lista completa de tecnologias (GET)
      this.usuarioTecnologiaService.listarPorUsuario(usuarioId) // Habilidades do mentor (GET filtrado)
    ]).subscribe({
      next: ([todasPublicacoes, relacoesPubTech, todasTecnologias, techsDoMentor]) => {

        // Extrai apenas os IDs das tecnologias que este mentor domina (vínculos ativos)
        const idsTechsMentor = techsDoMentor.filter(t => t.status === 1).map(t => t.tecnologiaId);

        // Map relacional para injetar a lista de tags [Tecnologia] dentro de cada publicação
        const publicacoesMapeadas = todasPublicacoes.map(pub => {
          // Pega, da relação publicação-tecnologia, só os vínculos desta publicação específica
          const idsRelacionados = relacoesPubTech
            .filter(r => r.publicacaoId === pub.id)
            .map(r => r.tecnologiaId);

          // Busca os objetos completos de tecnologia (nome, etc) que batem com esses ids
          const tecnologiasDaPub = todasTecnologias.filter(t =>
            idsRelacionados.includes(t.id)
          );

          // Copia a publicação original e acrescenta o campo "tecnologias" com o array montado acima
          return { ...pub, tecnologias: tecnologiasDaPub };
        });

        // Aplica o filtro de negócios baseado no tipo de usuário logado
        if (this.ehMentor) {
          // SE FOR MENTOR: Esconde as dele e filtra estritamente pelas tecnologias dele
          this.publicacoes = publicacoesMapeadas.filter(pub => {
            const naoEFormuladaPorMim = pub.usuarioId !== usuarioId; // publicação não é do próprio mentor
            const possuiTechQueDomino = pub.tecnologias.some(t => idsTechsMentor.includes(t.id)); // ao menos 1 tech em comum
            return naoEFormuladaPorMim && possuiTechQueDomino;
          });
        } else {
          // SE FOR CLIENTE: Mantém a regra anterior de ver apenas as dele
          this.publicacoes = publicacoesMapeadas.filter(pub => pub.usuarioId === usuarioId);
        }

        this.publicacoesFiltradas = [...this.publicacoes]; // cópia do array para exibição inicial (sem busca aplicada)
        this.carregando = false;
        this.cdr.detectChanges(); // força atualização da tela após o subscribe
      },
      error: (err) => {
        console.error('Erro ao processar dados do mural:', err);
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Chamado a cada tecla digitada no campo de busca
  filtrarPublicacoes(): void {
    // Se não há publicações carregadas, lista filtrada fica vazia
    if (!this.publicacoes || this.publicacoes.length === 0) {
      this.publicacoesFiltradas = [];
      return;
    }

    // Se o campo de busca estiver vazio, mostra todas as publicações novamente
    if (!this.termoBusca || !this.termoBusca.trim()) {
      this.publicacoesFiltradas = [...this.publicacoes];
      return;
    }

    // Normaliza o termo digitado: minúsculo e sem espaços nas pontas
    const termo = this.termoBusca.toLowerCase().trim();

    // Filtra as publicações cujo título ou conteúdo contenham o termo buscado
    this.publicacoesFiltradas = this.publicacoes.filter(pub => {
      const tituloBate = pub.titulo ? pub.titulo.toLowerCase().includes(termo) : false;
      const conteudoBate = pub.conteudo ? pub.conteudo.toLowerCase().includes(termo) : false;
      return tituloBate || conteudoBate;
    });
  }
}
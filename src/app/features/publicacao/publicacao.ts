import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sidenav } from '../../shared/sidenav/sidenav';
import { Footer } from '../../shared/footer/footer';

// Importando as interfaces de modelo (ajustadas ao banco de dados)
import { Publicacao, NovaPublicacaoPayload, Tecnologia } from '../../model/publicacao.model';

// Importando o serviço externo que lida com o HttpClient
import { PublicacaoService } from '../../services/publicacao.service';
import { DashboardComponent } from "../dashboard/dashboard";



@Component({
  selector: 'app-publicacoes',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardComponent, Sidenav, Footer],
  templateUrl: './publicacao.html',
  styleUrls: ['./publicacao.css']
})
export class PublicacoesComponent implements OnInit {
  // Define se a tela exibe a 'lista' (feed) ou o formulário de 'nova' publicação
  viewAtual: 'lista' | 'nova' = 'lista';

  // Estados da aplicação
  publicacoes: Publicacao[] = [];
  publicacoesFiltradas: Publicacao[] = [];
  tecnologiasDisponiveis: Tecnologia[] = [];
  termoBusca: string = '';
  carregando: boolean = false;

  // Estrutura do formulário batendo com as colunas obrigatórias do banco
  novaPublicacao: NovaPublicacaoPayload = {
    publicacaoTitulo: '',
    publicacaoConteudo: '',
    publicacaoOrcamentoMin: 0,
    publicacaoOrcamentoMax: 0,
    usuarioId: 1, // ID mockado do cliente logado (vinculado a fk_publicacao_cliente)
    tecnologiasIds: [] // Armazena os IDs das tecnologias selecionadas
  };

  // Injeção do serviço através do construtor
  constructor(private publicacaoService: PublicacaoService) {}

  ngOnInit(): void {
    this.carregarPublicacoes();
    this.carregarTecnologias();
  }

  // Método que consome o service para listar as publicações do banco
  carregarPublicacoes(): void {
    this.carregando = true;
    this.publicacaoService.listarTodas().subscribe({
      next: (dados) => {
        this.publicacoes = dados;
        this.publicacoesFiltradas = dados;
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao carregar publicações:', err);
        this.carregando = false;
      }
    });
  }

  // Método que consome o service para pegar as tecnologias cadastradas no banco
  carregarTecnologias(): void {
    this.publicacaoService.listarTecnologias().subscribe({
      next: (techs) => {
        this.tecnologiasDisponiveis = techs;
      },
      error: (err) => {
        console.error('Erro ao carregar tecnologias:', err);
      }
    });
  }

  // Filtro de pesquisa em tempo real na listagem
  filtrarPublicacoes(): void {
    if (!this.termoBusca.trim()) {
      this.publicacoesFiltradas = this.publicacoes;
      return;
    }
    this.publicacoesFiltradas = this.publicacoes.filter(pub =>
      pub.publicacaoTitulo.toLowerCase().includes(this.termoBusca.toLowerCase()) ||
      pub.publicacaoConteudo.toLowerCase().includes(this.termoBusca.toLowerCase())
    );
  }

  // Gerencia a seleção de tecnologias (máximo de 5) adicionando ou removendo os IDs numéricos
  toggleTecnologia(techId: number): void {
    const index = this.novaPublicacao.tecnologiasIds.indexOf(techId);
    if (index >= 0) {
      this.novaPublicacao.tecnologiasIds.splice(index, 1);
    } else {
      if (this.novaPublicacao.tecnologiasIds.length < 5) {
        this.novaPublicacao.tecnologiasIds.push(techId);
      }
    }
  }

  // Valida o formulário e envia o payload para salvar no banco
  salvarPublicacao(): void {
    if (!this.novaPublicacao.publicacaoTitulo || !this.novaPublicacao.publicacaoConteudo || this.novaPublicacao.tecnologiasIds.length === 0) {
      alert('Preencha todos os campos obrigatórios e selecione ao menos uma tecnologia.');
      return;
    }

    this.publicacaoService.criar(this.novaPublicacao).subscribe({
      next: () => {
        alert('Publicação salva com sucesso!');
        this.viewAtual = 'lista';
        this.carregarPublicacoes(); // Recarrega o feed atualizado do banco

        // Reseta o formulário para o estado inicial limpo
        this.novaPublicacao = {
          publicacaoTitulo: '',
          publicacaoConteudo: '',
          publicacaoOrcamentoMin: 0,
          publicacaoOrcamentoMax: 0,
          usuarioId: 1,
          tecnologiasIds: []
        };
      },
      error: (err) => {
        console.error('Erro ao criar publicação:', err);
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Sidenav } from '../../shared/sidenav/sidenav';
import { Footer } from '../../shared/footer/footer';

// Importando as interfaces de modelo necessárias para a listagem
import { Publicacao } from '../../model/publicacao.model';

// Importando o serviço externo que lida com o HttpClient
import { PublicacaoService } from '../../services/publicacao.service';

@Component({
  selector: 'app-publicacoes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Sidenav, Footer],
  templateUrl: './publicacao.html',
  styleUrls: ['./publicacao.css']
})
export class PublicacoesComponent implements OnInit {

  // Estados da aplicação específicos da listagem
  publicacoes: Publicacao[] = [];
  publicacoesFiltradas: Publicacao[] = [];
  termoBusca: string = '';
  carregando: boolean = false;

  // Injeção do serviço através do construtor
  constructor(private publicacaoService: PublicacaoService) {}

  ngOnInit(): void {
    this.carregarPublicacoes();
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

  // Filtro de pesquisa em tempo real na listagem (Ajustado para o novo JSON)
  filtrarPublicacoes(): void {
    if (!this.termoBusca.trim()) {
      this.publicacoesFiltradas = this.publicacoes;
      return;
    }
    this.publicacoesFiltradas = this.publicacoes.filter(pub =>
      pub.titulo.toLowerCase().includes(this.termoBusca.toLowerCase()) ||
      pub.conteudo.toLowerCase().includes(this.termoBusca.toLowerCase())
    );
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Sidenav } from '../shared/sidenav/sidenav';


// Importando as interfaces de modelo (ajustadas ao banco de dados)
import { NovaPublicacaoPayload, Tecnologia } from '../model/publicacao.model';

// Importando o serviço externo que lida com o HttpClient
import { PublicacaoService } from '../services/publicacao.service';

@Component({
  selector: 'app-nova-publicacao',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Sidenav], // Incluído o Footer aqui
  templateUrl: './nova-publicacao.html',
  styleUrls: ['./nova-publicacao.css']
})
export class NovaPublicacaoComponent implements OnInit {

  tecnologiasDisponiveis: Tecnologia[] = [];

  // Estrutura do formulário batendo com as colunas obrigatórias do banco
  novaPublicacao: NovaPublicacaoPayload = {
    publicacaoTitulo: '',
    publicacaoConteudo: '',
    publicacaoOrcamentoMin: 0,
    publicacaoOrcamentoMax: 0,
    usuarioId: 1, // ID mockado do cliente logado
    tecnologiasIds: [] // Armazena os IDs das tecnologias selecionadas
  };

  // Injetando o Router para poder redirecionar após o salvamento
  constructor(
    private publicacaoService: PublicacaoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarTecnologias();
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

  // O MÉTODO QUE ESTAVA FALTANDO: Valida e envia o formulário para a API externa
  salvarPublicacao(): void {
    // Validação básica de campos obrigatórios
    if (!this.novaPublicacao.publicacaoTitulo.trim() ||
        !this.novaPublicacao.publicacaoConteudo.trim() ||
        this.novaPublicacao.tecnologiasIds.length === 0) {
      alert('Preencha todos os campos obrigatórios (*) e selecione ao menos uma tecnologia.');
      return;
    }

    // Consome o serviço para salvar o registro no banco
    this.publicacaoService.criar(this.novaPublicacao).subscribe({
      next: () => {
        alert('Sua solicitação de mentoria foi publicada com sucesso!');

        // Redireciona o usuário usando a rota real de listagem de publicações
        this.router.navigate(['/app/publicacoes']);
      },
      error: (err) => {
        console.error('Erro ao salvar a nova publicação no servidor:', err);
        alert('Não foi possível salvar a publicação. Verifique o console para mais detalhes.');
      }
    });
  }
}

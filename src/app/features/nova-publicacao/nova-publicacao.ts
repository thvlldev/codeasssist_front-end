import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Sidenav } from '../../shared/sidenav/sidenav';
import { PublicacaoService } from '../../services/publicacao.service';
import { AuthService } from '../../services/auth.service'; // Certifique-se de importar seu AuthService
import { Tecnologia } from '../../model/publicacao.model';

@Component({
  selector: 'app-nova-publicacao',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Sidenav],
  templateUrl: './nova-publicacao.html',
  styleUrls: ['./nova-publicacao.css']
})
export class NovaPublicacaoComponent implements OnInit {

  private publicacaoService = inject(PublicacaoService);
  private authService = inject(AuthService);
  private router = inject(Router);

  tecnologiasDisponiveis: Tecnologia[] = [];

  novaPublicacao: any = {
    titulo: '',
    conteudo: '',
    orcamentoMin: 0,
    orcamentoMax: 0,
    usuarioId: this.authService.getUsuarioId(), // Pega dinamicamente o ID 1 do Jarbas logado
    tecnologiasIds: []
  };

  ngOnInit(): void {
    this.carregarTecnologias();
  }

  carregarTecnologias(): void {
    this.publicacaoService.listarTecnologias().subscribe({
      next: (techs) => {
        // Garante que se a API de tecnologias vier vazia, o array não quebra a tela
        this.tecnologiasDisponiveis = techs || [];
      },

    });
  }

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

  salvarPublicacao(): void {
    if (!this.novaPublicacao.titulo?.trim() ||
        !this.novaPublicacao.conteudo?.trim() ||
        this.novaPublicacao.tecnologiasIds.length === 0) {
      alert('Preencha todos os campos obrigatórios (*) e selecione ao menos uma tecnologia.');
      return;
    }

    this.publicacaoService.criar(this.novaPublicacao).subscribe({
      next: () => {
        alert('Sua solicitação de mentoria foi publicada com sucesso!');
        this.router.navigate(['/app/publicacoes']);
      },
      error: (err) => {
        console.error('Erro ao salvar no servidor:', err);
        alert('Não foi possível salvar no banco de dados do Senac devido a restrições de CORS.');
      }
    });
  }
}

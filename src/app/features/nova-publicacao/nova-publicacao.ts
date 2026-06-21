import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PublicacaoService } from '../../services/publicacao.service';
import { PublicacaoTecnologiaService } from '../../services/publicacao_tecnologia.service';
import { TecnologiaService } from '../../services/tecnologia.service';
import { AuthService } from '../../services/auth.service';
import { Tecnologia } from '../../model/tecnologia.model';

@Component({
  selector: 'app-nova-publicacao',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './nova-publicacao.html',
  styleUrls: ['./nova-publicacao.css']
})
export class NovaPublicacaoComponent implements OnInit {

  private publicacaoService = inject(PublicacaoService);
  private publicacaoTecnologiaService = inject(PublicacaoTecnologiaService);
  private tecnologiaService = inject(TecnologiaService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  tecnologiasDisponiveis: Tecnologia[] = [];

  novaPublicacao = {
    titulo: '',
    conteudo: '',
    orcamentoMin: 0,
    orcamentoMax: 0,
    usuarioId: this.authService.getUsuarioId() ?? 0,
    status: 1
  };

  tecnologiasIds: number[] = [];

  ngOnInit(): void {
    this.tecnologiaService.listarTodas().subscribe({
      next: (techs) => {
        this.tecnologiasDisponiveis = techs || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar tecnologias:', err);
        this.cdr.detectChanges();
      }
    });
  }

  toggleTecnologia(techId: number): void {
    const index = this.tecnologiasIds.indexOf(techId);
    if (index >= 0) {
      this.tecnologiasIds.splice(index, 1);
    } else if (this.tecnologiasIds.length < 5) {
      this.tecnologiasIds.push(techId);
    }
    this.cdr.detectChanges();
  }

  salvarPublicacao(): void {
    if (!this.novaPublicacao.titulo?.trim() ||
        !this.novaPublicacao.conteudo?.trim() ||
        this.tecnologiasIds.length === 0) {
      alert('Preencha todos os campos obrigatórios (*) e selecione ao menos uma tecnologia.');
      return;
    }

    this.publicacaoService.criar(this.novaPublicacao).subscribe({
      next: (publicacaoCriada) => {
        const vinculos = this.tecnologiasIds.map(techId =>
          this.publicacaoTecnologiaService.criar({
            publicacaoId: publicacaoCriada.id,
            tecnologiaId: techId,
            status: 1
          })
        );

        Promise.all(vinculos.map(obs => obs.toPromise()))
          .then(() => {
            alert('Sua solicitação de mentoria foi publicada com sucesso!');
            this.router.navigate(['/app/publicacoes']);
          })
          .catch(err => {
            console.error('Publicação criada, mas erro ao vincular tecnologias:', err);
            this.router.navigate(['/app/publicacoes']);
          });
      },
      error: (err) => {
        console.error('Erro ao salvar publicação:', err);
        alert('Não foi possível salvar a publicação.');
      }
    });
  }
}
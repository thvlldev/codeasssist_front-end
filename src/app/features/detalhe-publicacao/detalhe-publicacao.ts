import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, map } from 'rxjs';

import { PublicacaoService } from '../../services/publicacao.service';
import { RespostaPublicacaoService } from '../../services/resposta_publicacao.service';
import { PublicacaoTecnologiaService } from '../../services/publicacao_tecnologia.service';
import { TecnologiaService } from '../../services/tecnologia.service';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

import { Publicacao } from '../../model/publicacao.model';
import { RespostaPublicacao } from '../../model/resposta_publicacao.model';
import { Tecnologia } from '../../model/tecnologia.model';

interface RespostaComMentor extends RespostaPublicacao {
  nomeMentor?: string;
  emailMentor?: string;
}

@Component({
  selector: 'app-detalhe-publicacao',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './detalhe-publicacao.html', // Bate com o nome sem .component
  styleUrls: ['./detalhe-publicacao.css']
})
export class DetalhePublicacaoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private publicacaoService = inject(PublicacaoService);
  private respostaPublicacaoService = inject(RespostaPublicacaoService);
  private publicacaoTecnologiaService = inject(PublicacaoTecnologiaService);
  private tecnologiaService = inject(TecnologiaService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private readonly API_BASE = environment.apiServer;

  publicacaoId!: number;
  publicacao!: Publicacao;
  tecnologias: Tecnologia[] = [];

  // Controle de papéis
  ehMentor: boolean = false;
  usuarioLogadoId!: number;
  carregando: boolean = true;

  // Lado do Mentor
  novaPropostaConteudo: string = '';
  jaRespondeu: boolean = false;
  propostaEnviadaPorMim?: RespostaPublicacao;

  // Lado do Cliente
  propostasRecebidas: RespostaComMentor[] = [];

  ngOnInit(): void {
    this.usuarioLogadoId = this.authService.getUsuarioId() ?? 0;
    const papel = this.authService.getPapelAtivo();
    this.ehMentor = papel === 1;

    this.route.params.subscribe(params => {
      this.publicacaoId = +params['id'];
      if (this.publicacaoId) {
        this.carregarDadosCompletos();
      }
    });
  }

  carregarDadosCompletos(): void {
    this.carregando = true;

    forkJoin([
      this.publicacaoService.buscarPorId(this.publicacaoId),
      this.publicacaoTecnologiaService.listarTodas(),
      this.tecnologiaService.listarTodas(),
      this.respostaPublicacaoService.listarPorPublicacao(this.publicacaoId)
    ]).subscribe({
      next: ([pub, relacoes, todasTechs, respostas]) => {
        this.publicacao = pub;

        // Mapeia tecnologias da publicação
        const idsRelacionados = relacoes
          .filter(r => r.publicacaoId === pub.id)
          .map(r => r.tecnologiaId);
        this.tecnologias = todasTechs.filter(t => idsRelacionados.includes(t.id));

        if (this.ehMentor) {
          this.propostaEnviadaPorMim = respostas.find(r => r.usuarioId === this.usuarioLogadoId);
          if (this.propostaEnviadaPorMim) {
            this.jaRespondeu = true;
          }
          this.carregando = false;
          this.cdr.detectChanges();
        } else {
          if (respostas.length === 0) {
            this.propostasRecebidas = [];
            this.carregando = false;
            this.cdr.detectChanges();
            return;
          }

          const buscaMentores$ = respostas.map(resp =>
            this.http.get<any>(`${this.API_BASE}/usuarios/${resp.usuarioId}`).pipe(
              map(user => ({
                ...resp,
                nomeMentor: user.nome,
                emailMentor: user.email
              }))
            )
          );

          forkJoin(buscaMentores$).subscribe({
            next: (respostasCompletas) => {
              this.propostasRecebidas = respostasCompletas;
              this.carregando = false;
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Erro ao buscar dados dos mentores:', err);
              this.propostasRecebidas = respostas.map(r => ({ ...r, nomeMentor: 'Mentor Parceiro' }));
              this.carregando = false;
              this.cdr.detectChanges();
            }
          });
        }
      },
      error: (err) => {
        console.error('Erro ao carregar detalhes da publicação:', err);
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  enviarProposta(): void {
    if (!this.novaPropostaConteudo.trim()) {
      alert('Por favor, descreva a sua proposta antes de enviar.');
      return;
    }

    // Monta o objeto estritamente alinhado com o contrato da tabela do banco
    const payloadProposta: any = {
      conteudo: this.novaPropostaConteudo,
      usuarioId: Number(this.usuarioLogadoId), // Garante que vá como number puro
      publicacaoId: Number(this.publicacaoId), // Garante que vá como number puro
      status: 1
    };

    this.respostaPublicacaoService.criar(payloadProposta).subscribe({
      next: (respostaCriada) => {
        alert('Sua proposta de mentoria foi enviada com sucesso!');
        this.novaPropostaConteudo = '';
        this.carregarDadosCompletos(); // Atualiza a tela para mudar o estado para jaRespondeu = true
      },
      error: (err) => {
        console.error('Erro detalhado retornado pelo servidor do Senac:', err);
        alert('Não foi possível enviar a proposta.');
      }
    });
  }
}

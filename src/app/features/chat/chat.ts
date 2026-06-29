import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { RespostaPublicacaoService } from '../../services/resposta_publicacao.service';
import { PublicacaoService } from '../../services/publicacao.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface Mensagem {
  autor: 'mentor' | 'cliente';
  texto: string;
  hora: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class ChatComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private respostaPublicacaoService = inject(RespostaPublicacaoService);
  private publicacaoService = inject(PublicacaoService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private readonly API_BASE = environment.apiServer;

  carregando = true;
  nomeMentor = '';
  tituloPublicacao = '';
  novaMensagem = '';
  chatFinalizado = false;
  publicacaoId = 0;
  respostaId = 0;
  ehMentor = false;
  processando = false;

  mensagens: Mensagem[] = [];

  ngOnInit(): void {
    this.ehMentor = this.authService.getPapelAtivo() === 1;
    this.respostaId = Number(this.route.snapshot.params['id']);

    this.respostaPublicacaoService.listarTodas().subscribe({
      next: (respostas) => {
        const resposta = respostas.find(r => r.id === this.respostaId);
        if (!resposta) {
          this.carregando = false;
          this.cdr.detectChanges();
          return;
        }

        this.publicacaoId = resposta.publicacaoId;

        forkJoin([
          this.http.get<any>(`${this.API_BASE}/usuarios/${resposta.usuarioId}`),
          this.publicacaoService.buscarPorId(resposta.publicacaoId)
        ]).subscribe({
          next: ([mentor, publicacao]) => {
            this.nomeMentor = mentor.nome;
            this.tituloPublicacao = publicacao.titulo;
            this.chatFinalizado = publicacao.status === 3;

            this.mensagens = [{
              autor: 'mentor',
              texto: resposta.conteudo,
              hora: this.horaAgora()
            }];

            this.carregando = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.carregando = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  enviarMensagem(): void {
    if (!this.novaMensagem.trim() || this.chatFinalizado) return;

    this.mensagens.push({
      autor: this.ehMentor ? 'mentor' : 'cliente',
      texto: this.novaMensagem.trim(),
      hora: this.horaAgora()
    });

    this.novaMensagem = '';
    this.cdr.detectChanges();
  }

  finalizarChat(): void {
    if (this.processando || this.chatFinalizado) return;
    this.processando = true;
    this.cdr.detectChanges();

    this.publicacaoService.buscarPorId(this.publicacaoId).subscribe({
      next: (pub) => {
        this.publicacaoService.atualizar(this.publicacaoId, { ...pub, status: 3 }).subscribe({
          next: () => {
            this.chatFinalizado = true;
            this.processando = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.processando = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  voltarParaDetalhe(): void {
    this.router.navigate(['/app/publicacoes', this.publicacaoId]);
  }

  private horaAgora(): string {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}
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

  //variaveis
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
    this.ehMentor = this.authService.getPapelAtivo() === 1;//define se quem está vendo a tela é o mentor ou o cliente
    this.respostaId = Number(this.route.snapshot.params['id']);//pega o parâmetro id da URL no momento em que a rota carregou

    this.respostaPublicacaoService.listarTodas().subscribe({
      next: (respostas) => {//next roda quando o dado chega com sucesso
        const resposta = respostas.find(r => r.id === this.respostaId);
        if (!resposta) {
          this.carregando = false;
          this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela
          return;
        }

        this.publicacaoId = resposta.publicacaoId;

        forkJoin([// busca o usuario e a publicacao ao mesmo tempo 
          this.http.get<any>(`${this.API_BASE}/usuarios/${resposta.usuarioId}`),
          this.publicacaoService.buscarPorId(resposta.publicacaoId)
        ]).subscribe({
          next: ([mentor, publicacao]) => {//pega o array de resultados e já separa em duas variáveis
            this.nomeMentor = mentor.nome;
            this.tituloPublicacao = publicacao.titulo;
            this.chatFinalizado = publicacao.status === 3;//decide se o chat já está encerrado olhando o status da publicação

            this.mensagens = [{//monta a primeira mensagem simulada do chat, usando o conteúdo da resposta que o mentor deu 
              autor: 'mentor',
              texto: resposta.conteudo,
              hora: this.horaAgora()
            }];

            this.carregando = false;
            this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela
          },
          error: () => {//error roda se a requisição falhar
            this.carregando = false;
            this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela
          }
        });
      },
      error: () => {//error roda se a requisição falhar
        this.carregando = false;
        this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela
      }
    });
  }

  enviarMensagem(): void {
    if (!this.novaMensagem.trim() || this.chatFinalizado) return;// não faz nada se a mensagem estiver vazia ou chat finalizado

    this.mensagens.push({//Adiciona a mensagem no array mensagens com .push() localmente,não funciona de verdade
      autor: this.ehMentor ? 'mentor' : 'cliente',//decide o autor da mensagem baseado em quem está logado.
      texto: this.novaMensagem.trim(),
      hora: this.horaAgora()
    });

    this.novaMensagem = '';//Limpa o campo de texto pra esvaziar o input
    this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela
  }

  finalizarChat(): void {
    if (this.processando || this.chatFinalizado) return;//não faz nada se já estiver processando ou finalizado
    this.processando = true;//liga o estado de loading pro html usar o spinner
    this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela

    this.publicacaoService.buscarPorId(this.publicacaoId).subscribe({//busca a publicação atual completa 
      next: (pub) => {
        this.publicacaoService.atualizar(this.publicacaoId, { ...pub, status: 3 }).subscribe({// troca o status da publicacao pra 3(finalizado)
          next: () => {
            this.chatFinalizado = true;
            this.processando = false;
            this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela
          },
          error: () => {
            this.processando = false;
            this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela
          }
        });
      }
    });
  }

  voltarParaDetalhe(): void {//troca de rota sem precisar de um link no html
    this.router.navigate(['/app/publicacoes', this.publicacaoId]);
  }

  private horaAgora(): string {//pega a hora atual e formata como "HH:mm" no padrão brasileiro 
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}
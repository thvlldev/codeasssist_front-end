import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, switchMap, of } from 'rxjs';
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

  tecnologiasDisponiveis: Tecnologia[] = [];//vai guardar a lista de tecnologias que vem da API, pra popular os botões clicáveis no formulário.
  ehMentor: boolean = false; // Flag para o HTML bloquear a tela

  novaPublicacao = {//objeto que representa os dados do formulário
    titulo: '',
    conteudo: '',
    orcamentoMin: 0,
    orcamentoMax: 0,
    usuarioId: this.authService.getUsuarioId() ?? 0,// puxa o ID do usuário logado
    status: 1
  };

  tecnologiasIds: number[] = [];//array que guarda só os IDs numéricos das tecnologias que o usuário selecionou clicando nos botões

  ngOnInit(): void {
    
    const papelAtivo = this.authService.getPapelAtivo();//Pega o papel ativo do usuário

    
    this.ehMentor = papelAtivo === 1;//define ehMentor comparando com 1.

    if (!this.ehMentor) {
      this.tecnologiaService.listarTodas().subscribe({//Se não for mentor, busca a lista de tecnologias da API e preencher tecnologiasDisponiveis
        next: (techs) => {
          this.tecnologiasDisponiveis = techs || [];// garante que seja um array mesmo se a resposta da api vier null 
          this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela
        },
        error: (err) => {
          console.error('Erro ao carregar tecnologias:', err);
          this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela
        }
      });
    }
  }

  toggleTecnologia(techId: number): void {//é chamado toda vez que o usuário clica em um botão de tecnologia no formulário.
    const index = this.tecnologiasIds.indexOf(techId);// procura a posição do techId dentro do array Se não encontrar, retorna -1.
    if (index >= 0) {
      this.tecnologiasIds.splice(index, 1);//se o id ja estava no array vai desmarcar 
    } else if (this.tecnologiasIds.length < 5) {//se o index for -1 e tiver menos de 5 tecnologias marcadas
      this.tecnologiasIds.push(techId);//vai adicionar o id dela no array com o .push
    }
    this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela
  }

  salvarPublicacao(): void {
    if (this.ehMentor) return;// se for mentor n faz nada

    if (!this.novaPublicacao.titulo?.trim() ||// verifica se ficou com titulo vazio
        !this.novaPublicacao.conteudo?.trim() ||//verifica se ficou com conteudo vazio
        this.tecnologiasIds.length === 0) {//verifica se não selecionou nenhuma tecnologia
      return;//se qualquer um for true retorna sem fazer nada
    }

    this.publicacaoService.criar(this.novaPublicacao).pipe(// faz um post e A API responde com a publicação criada
      switchMap((publicacaoCriada) => {//transforma o resultado em um observable dentro do switchMap
        if (this.tecnologiasIds.length === 0) return of([]);//checa se tem tecnologias, se nao tiver retorna um Observable que emite um array vazio, sem fazer mais requisições.

        const requests = this.tecnologiasIds.map(techId =>//.map() de array do javascript,percorre cada ID de tecnologia selecionado 
          this.publicacaoTecnologiaService.criar({//Para cada techId passa um objeto com:
            publicacaoId: publicacaoCriada.id,              // id da publicacao
            tecnologiaId: techId,                           // id da tecnologia
            status: 1                                       // status: 1
          })
        );
        return forkJoin(requests);//dispara todas as requisições em paralelo, e o Observable resultante só emite um valor quando todas elas tiverem terminado.
      })
    ).subscribe({
      next: () => {
        this.router.navigate(['/app/publicacoes']);//caso de certo redireciona pra publicacoes
      },
      error: (err) => {
        console.error('Erro ao salvar publicação:', err);
        this.router.navigate(['/app/publicacoes']);//caso de errado da o console error e redireciona mesmo assim pra publicacoes
      }
    });
  }
}
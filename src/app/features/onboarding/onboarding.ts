import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { RespostaOpcaoService } from '../../services/resposta_opcao.service';
import { RespostaTextoService } from '../../services/resposta_texto.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './onboarding.html',
  styleUrls: ['./onboarding.css']
})
export class OnboardingComponent implements OnInit {
  private authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private respostaOpcaoService = inject(RespostaOpcaoService);
  private respostaTextoService = inject(RespostaTextoService);
  private router = inject(Router);

  passoAtual: number = 0;
  carregando: boolean = false;

  // SIMULA UM SIGNAL PARA CASAR COM O HTML
  passo = Object.assign(
    () => this.passoAtual,
    {
      set: (valor: number) => {
        this.passoAtual = valor;
      }
    }
  );

  // Objeto de respostas unificado para aceitar tanto português quanto inglês do HTML
  respostas = {
    perfilId: null as number | null,
    uso: '',
    objetivo: '',  // Usado nos nossos services
    objective: '' // Casado com a linha 73 do seu HTML antigo
  };

  ngOnInit(): void {
    const idSessao = this.authService.getUsuarioId();
    if (!idSessao) {
      console.warn('Nenhum usuário ativo encontrado na sessão.');
    }
  }

  selecionarPerfil(opcaoId: number): void {
    this.respostas.perfilId = opcaoId;

    const usuarioId = this.authService.getUsuarioId();
    if (!usuarioId) {
      console.error('Usuário não identificado para criar o perfil.');
      return;
    }

    this.carregando = true;

    // Dispara o POST direto sem checar se já existe registro
    this.clienteService.criar({
      usuarioId: usuarioId,
      descricao: '',
      status: 1
    }).subscribe({
      next: () => {
        console.log(`Novo registro de cliente criado com sucesso para o usuário ${usuarioId}`);
        this.carregando = false;
        this.passo.set(2);
      },
      error: (err) => {
        console.error('Erro ao criar o cliente no banco:', err);
        this.carregando = false;
        this.passo.set(2); // Avança por garantia para não travar a tela
      }
    });
  }

  finalizar(): void {
    this.finalizarOnboarding();
  }

  finalizarOnboarding(): void {
    const usuarioId = this.authService.getUsuarioId();
    if (!usuarioId) {
      console.error('Nenhum usuário logado.');
      return;
    }

    this.carregando = true;

    // Lote de requisições paralelas obrigatórias enviadas juntas pelo forkJoin
    const requisicoes: any = {
      passo2Uso: this.respostaTextoService.criar({
        clienteUsuarioId: usuarioId,
        perguntaCadastroId: 2,
        conteudo: this.respostas.uso,
        status: 1
      }),
      passo3Objetivo: this.respostaTextoService.criar({
        clienteUsuarioId: usuarioId,
        perguntaCadastroId: 3,
        conteudo: this.respostas.objetivo || this.respostas.objective,
        status: 1
      })
    };

    // Adiciona o Passo 1 ao lote caso uma opção tenha sido clicada
    if (this.respostas.perfilId) {
      requisicoes.passo1Perfil = this.respostaOpcaoService.criar({
        clienteUsuarioId: usuarioId,
        opcaoPerguntaId: this.respostas.perfilId,
        status: 1
      });
    }

    forkJoin(requisicoes).subscribe({
      next: (resultados) => {
        console.log('Todos os dados do onboarding salvos no JSON Server!', resultados);
        this.carregando = false;
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        console.error('Erro ao salvar as respostas finais do onboarding:', err);
        this.carregando = false;
        this.router.navigate(['/app/dashboard']);
      }
    });
  }
}
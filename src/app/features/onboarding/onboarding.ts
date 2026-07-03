import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of, switchMap, catchError } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { MentorService } from '../../services/mentor.service';
import { RespostaOpcaoService } from '../../services/resposta_opcao.service';
import { RespostaTextoService } from '../../services/resposta_texto.service';
import { TecnologiaService } from '../../services/tecnologia.service';
import { UsuarioTecnologiaService } from '../../services/usuario_tecnologia.service';
import { PerguntaCadastroService } from '../../services/pergunta_cadastro.service';
import { OpcaoPerguntaService } from '../../services/opcao_pergunta.service';

import { Tecnologia } from '../../model/tecnologia.model';
import { OpcaoPergunta } from '../../model/opcao_pergunta.model';
import { PerguntaCadastro } from '../../model/pergunta_cadastro.model';
import { TipoUsuario } from '../../shared/enums/TipoUsuario';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './onboarding.html',
  styleUrls: ['./onboarding.css']
})
export class OnboardingComponent implements OnInit {
  // Injeção de dependências: services usados para buscar e salvar dados do onboarding
  private authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private mentorService = inject(MentorService);
  private respostaOpcaoService = inject(RespostaOpcaoService);
  private respostaTextoService = inject(RespostaTextoService);
  private tecnologiaService = inject(TecnologiaService);
  private usuarioTecnologiaService = inject(UsuarioTecnologiaService);
  private perguntaCadastroService = inject(PerguntaCadastroService);
  private opcaoPerguntaService = inject(OpcaoPerguntaService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef); // usado para forçar atualização manual da tela

  readonly TipoUsuario = TipoUsuario; // usa o enum para uso no template HTML

  papelAtivo: TipoUsuario = TipoUsuario.Cliente; // papel do usuário logado 
  passoAtual: number = 0; // etapa atual do onboarding
  carregando: boolean = false; // controla estado de loading dos botões

  
  
  passo = Object.assign(// Objeto criado manualmente para imitar um Signal do Angular:
    () => this.passoAtual,
    { set: (valor: number) => { this.passoAtual = valor; this.cdr.detectChanges(); } }// passo() lê o valor atual (passoAtual) e passo.set(valor) atualiza e força re-renderização
  );

  // Perguntas e opções do banco
  perguntas: PerguntaCadastro[] = [];
  opcoesPergunta1: OpcaoPergunta[] = []; // stacks cliente
  opcoesPergunta5: OpcaoPergunta[] = []; // tecnologias mentor
  todasTecnologias: Tecnologia[] = [];

  // Estado cliente
  respostas = {
    opcaoSelecionadaId: null as number | null,   // pergunta 1
    opcaoSelecionadaDescricao: '' as string,      // para atualizar stack
    uso: '',                                       // pergunta 2
    objetivo: ''                                   // pergunta 3
  };

  // Estado mentor
  mentorDados = {
    descricao: '',
    precoHora: null as number | null
  };
  tecnologiasDisponiveis: Tecnologia[] = [];
  tecnologiasSelecionadas: number[] = [];          // ids de tecnologias (pergunta 5)
  opcoesTecnologiaSelecionadas: number[] = [];     // ids das opcoes selecionadas para respostas-opcao

  // verifica se o papel ativo é Mentor toda vez que é lido no template
  get ehMentor(): boolean {
    return this.papelAtivo === TipoUsuario.Mentor;
  }

  ngOnInit(): void {
    // Define o papel ativo e carrega os dados iniciais
    this.papelAtivo = this.authService.getPapelAtivo() ?? TipoUsuario.Cliente;
    this.carregarDadosIniciais();
  }

  private carregarDadosIniciais(): void {
    // Dispara 3 requisições em paralelo e só continua quando todas responderem
    forkJoin([
      this.perguntaCadastroService.listarTodas(), // GET /perguntas-cadastro
      this.opcaoPerguntaService.listarTodas(), // GET /opcoes-pergunta
      this.tecnologiaService.listarTodas() // GET /tecnologias
    ]).subscribe({
      next: ([perguntas, opcoes, tecnologias]) => {
        this.perguntas = perguntas.filter(p => p.status !== 0);// Filtra apenas os registros ativos 
        this.opcoesPergunta1 = opcoes.filter(o => o.perguntaCadastroId === 1 && o.status !== 0);// Filtra as opções da pergunta 1 (stack do cliente)
        this.opcoesPergunta5 = opcoes.filter(o => o.perguntaCadastroId === 5 && o.status !== 0);// Filtra as opções da pergunta 5 (tecnologias do mentor)
        this.todasTecnologias = tecnologias.filter(t => t.status !== 0);//Filtra as tecnologias que nao sofreram soft delete
        this.tecnologiasDisponiveis = this.todasTecnologias;
        this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela
      },
      error: (err) => console.error('Erro ao carregar dados do onboarding:', err)
    });
  }

  // Busca o texto (enunciado) de uma pergunta pelo id; retorna string vazia se não encontrar
  getPergunta(id: number): string {
    return this.perguntas.find(p => p.id === id)?.enunciado ?? '';
  }

  // ===================== FLUXO CLIENTE =====================

  // Chamado ao clicar numa opção da pergunta 1: salva a escolha e avança para o passo 2
  selecionarOpcaoPergunta1(opcao: OpcaoPergunta): void {
    this.respostas.opcaoSelecionadaId = opcao.id;
    this.respostas.opcaoSelecionadaDescricao = opcao.descricao;
    this.passo.set(2);
  }

  // Método chamado pelo botão do template
  finalizar(): void {
    this.finalizarOnboardingCliente();
  }

  private finalizarOnboardingCliente(): void {
    const usuarioId = this.authService.getUsuarioId();
    if (!usuarioId) return; // interrompe se não houver usuário logado

    this.carregando = true;
    this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela

    // Salva respostas em texto (perguntas 2 e 3) em paralelo;
    // catchError evita que uma falha aqui interrompa o restante do fluxo
    const respostasTexto$ = forkJoin([
      this.respostaTextoService.criar({ // POST /respostas-texto
        clienteUsuarioId: usuarioId,
        perguntaCadastroId: 2,
        conteudo: this.respostas.uso,
        status: 1
      }),
      this.respostaTextoService.criar({ // POST /respostas-texto
        clienteUsuarioId: usuarioId,
        perguntaCadastroId: 3,
        conteudo: this.respostas.objetivo,
        status: 1
      })
    ]).pipe(catchError(err => { console.warn('Erro ao salvar respostas-texto:', err); return of(null); }));

    // Salva a resposta da opção (pergunta 1), apenas se alguma opção foi selecionada
    const respostaOpcao$ = this.respostas.opcaoSelecionadaId
      ? this.respostaOpcaoService.criar({ // POST /respostas-opcao
          clienteUsuarioId: usuarioId,
          opcaoPerguntaId: this.respostas.opcaoSelecionadaId,
          status: 1
        }).pipe(catchError(err => { console.warn('Erro ao salvar respostas-opcao:', err); return of(null); }))
      : of(null); // se não houve seleção, emite null sem fazer requisição

    // Espera as duas etapas acima, depois busca o cliente já existente e atualiza seus dados
    forkJoin([respostasTexto$, respostaOpcao$]).pipe(
      switchMap(() => this.clienteService.buscarPorUsuarioId(usuarioId)), // GET /clientes (filtrado por usuarioId)
      switchMap(clienteExistente => {
        const dadosAtualizados = {
          usuarioId,
          stack: this.respostas.opcaoSelecionadaDescricao || 'Não informado',
          descricao: this.respostas.uso || '',
          status: clienteExistente?.status ?? 1, // mantém o status já existente ou usa 1 como padrão
          onboardingConcluido: 1 // marca o onboarding como concluído
        };
        return this.clienteService.atualizar(usuarioId, dadosAtualizados); // PUT /clientes/:usuarioId
      })
    ).subscribe({
      next: () => {
        // Sucesso: desliga loading e navega para o dashboard
        this.carregando = false;
        this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        // Erro: registra no console, mas ainda assim navega para o dashboard
        console.error('Erro ao finalizar onboarding cliente:', err);
        this.carregando = false;
        this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela
        this.router.navigate(['/app/dashboard']);
      }
    });
  }

  // ===================== FLUXO MENTOR =====================

  // Alterna a seleção de uma tecnologia e sincroniza com a opção de pergunta correspondente
  alternarTecnologia(tecnologiaId: number): void {
    // Adiciona ou remove o id da tecnologia no array de selecionadas
    const idxTech = this.tecnologiasSelecionadas.indexOf(tecnologiaId);
    if (idxTech >= 0) {
      this.tecnologiasSelecionadas.splice(idxTech, 1);
    } else {
      this.tecnologiasSelecionadas.push(tecnologiaId);
    }

    // Encontra a opcao correspondente pela descricao == nome da tecnologia
    const tech = this.todasTecnologias.find(t => t.id === tecnologiaId);
    if (tech) {
      const opcao = this.opcoesPergunta5.find(o => o.descricao === tech.nome);
      if (opcao) {
        // Aplica a mesma lógica de alternar (adicionar/remover) no array de opções selecionadas
        const idxOpcao = this.opcoesTecnologiaSelecionadas.indexOf(opcao.id);
        if (idxOpcao >= 0) {
          this.opcoesTecnologiaSelecionadas.splice(idxOpcao, 1);
        } else {
          this.opcoesTecnologiaSelecionadas.push(opcao.id);
        }
      }
    }
  }

  // Verifica se uma tecnologia está selecionada (usado para estilizar o botão no template)
  tecnologiaSelecionada(tecnologiaId: number): boolean {
    return this.tecnologiasSelecionadas.includes(tecnologiaId);
  }

  // Avança o onboarding do mentor para o passo 3 (preço por hora)
  avancarParaPrecoHora(): void {
    this.passo.set(3);
  }

  finalizarOnboardingMentor(): void {
    const usuarioId = this.authService.getUsuarioId();
    if (!usuarioId) return; // interrompe se não houver usuário logado

    this.carregando = true;
    this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela

    // Salva respostas texto (perguntas 4 e 6: descrição e preço por hora) em paralelo
    const respostasTexto$ = forkJoin([
      this.respostaTextoService.criar({ // POST /respostas-texto
        clienteUsuarioId: usuarioId,
        perguntaCadastroId: 4,
        conteudo: this.mentorDados.descricao,
        status: 1
      }),
      this.respostaTextoService.criar({ // POST /respostas-texto
        clienteUsuarioId: usuarioId,
        perguntaCadastroId: 6,
        conteudo: String(this.mentorDados.precoHora), // converte o número para string
        status: 1
      })
    ]).pipe(catchError(err => { console.warn('Erro ao salvar respostas-texto mentor:', err); return of(null); }));

    // Salva respostas-opcao da pergunta 5 (uma por tecnologia selecionada), se houver alguma
    const respostasOpcao$ = this.opcoesTecnologiaSelecionadas.length > 0
      ? forkJoin(this.opcoesTecnologiaSelecionadas.map(opcaoId =>
          this.respostaOpcaoService.criar({ // POST /respostas-opcao (uma requisição por opção selecionada)
            clienteUsuarioId: usuarioId,
            opcaoPerguntaId: opcaoId,
            status: 1
          })
        )).pipe(catchError(err => { console.warn('Erro ao salvar respostas-opcao mentor:', err); return of(null); }))
      : of(null);

    // Vincula tecnologias em usuario-tecnologia, uma requisição por tecnologia selecionada
    const vinculosTech$ = this.tecnologiasSelecionadas.length > 0
      ? forkJoin(this.tecnologiasSelecionadas.map(techId =>
          this.usuarioTecnologiaService.criar({ usuarioId, tecnologiaId: techId, status: 1 }) // POST /usuarios-tecnologias (uma requisição por tecnologia selecionada)
        )).pipe(catchError(err => { console.warn('Erro ao vincular tecnologias:', err); return of(null); }))
      : of(null);

    // Espera as três etapas acima, busca o mentor existente e então cria ou atualiza o perfil
    forkJoin([respostasTexto$, respostasOpcao$, vinculosTech$]).pipe(
      switchMap(() => this.mentorService.buscarPorUsuarioId(usuarioId)), // GET /mentores (filtrado por usuarioId)
      switchMap(mentorExistente => {
        const dadosMentor = {
          usuarioId,
          descricao: this.mentorDados.descricao,
          precoHora: this.mentorDados.precoHora ?? 0,
          mediaAvaliacao: mentorExistente?.mediaAvaliacao ?? 0, // mantém a média já existente
          status: mentorExistente?.status ?? 1,
          onboardingConcluido: 1
        };
        // Se já existe um registro de mentor, atualiza; senão, cria um novo
        return mentorExistente
          ? this.mentorService.atualizar(usuarioId, dadosMentor) // PUT /mentores/:usuarioId
          : this.mentorService.criar(dadosMentor); // POST /mentores
      })
    ).subscribe({
      next: () => {
        // Sucesso: desliga loading e navega para o dashboard
        this.carregando = false;
        this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        // Erro: registra no console, mas ainda assim navega para o dashboard
        console.error('Erro ao finalizar onboarding mentor:', err);
        this.carregando = false;
        this.cdr.detectChanges();// por ser um projeto zoneless o angular não percebe sozinho quando uma variavel muda dentro do subscibe e nao muda na tela
        this.router.navigate(['/app/dashboard']);
      }
    });
  }
}
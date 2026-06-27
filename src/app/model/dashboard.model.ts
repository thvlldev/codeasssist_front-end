import { Publicacao } from './publicacao.model';
import { Usuario } from './usuario.model';
import { Tecnologia } from './tecnologia.model';

export interface PublicacaoResumo extends Publicacao {
  totalRespostas: number;
}

export interface RespostaComPublicacao {
  respostaId: number;
  conteudo: string;
  publicacaoId: number;
  publicacaoTitulo: string;
  publicacaoStatus: number;
  orcamentoMin: number;
  orcamentoMax: number;
  statusResposta: number;
}

// ---- CLIENTE ----
export interface DashboardMetricasCliente {
  totalPublicacoes: number;
  totalRespostasRecebidas: number;
  publicacoesAbertas: number;
  valorTotalInvestido: number;
}

export interface DashboardCliente {
  tipo: 'cliente';
  usuario: Usuario;
  metricas: DashboardMetricasCliente;
  publicacoesRecentes: PublicacaoResumo[];
  tecnologias: Tecnologia[];
}

// ---- MENTOR ----
export interface DashboardMetricasMentor {
  ganhosMes: number;
  sessoesConcluidas: number;
  candidaturasEnviadas: number;
  mediaAvaliacao: number;
}

export interface SessaoAndamento {
  publicacaoId: number;
  publicacaoTitulo: string;
  clienteNome: string;
}

export interface DashboardMentor {
  tipo: 'mentor';
  usuario: Usuario;
  metricas: DashboardMetricasMentor;
  sessaoAndamento: SessaoAndamento | null;
  candidaturas: RespostaComPublicacao[];
  tecnologias: Tecnologia[];
  precoHora: number;
}

export type DashboardData = DashboardCliente | DashboardMentor;
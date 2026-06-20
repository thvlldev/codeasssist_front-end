import { Publicacao } from './publicacao.model';
import { Usuario } from './usuario.model';

export interface PublicacaoResumo extends Publicacao {
  totalRespostas: number;
}

export interface DashboardMetricas {
  totalPublicacoes: number;
  totalRespostasRecebidas: number;
  publicacoesAbertas: number;
  valorTotalInvestido: number;
}

export interface DashboardData {
  usuario: Usuario;
  metricas: DashboardMetricas;
  publicacoesRecentes: PublicacaoResumo[];
}
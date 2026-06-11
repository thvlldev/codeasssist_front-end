export interface DashboardResponse {

  usuario: DashboardUsuario;

  metricas: DashboardMetricas;

  publicacoesRecentes: DashboardPublicacao[];

}

export interface DashboardUsuario {

  id: number;

  nome: string;

  email: string;

  stack: string;

  descricao: string;

}

export interface DashboardMetricas {

  totalPublicacoes: number;

  totalRespostasRecebidas: number;

  publicacoesAbertas: number;

  valorTotalInvestido: number;

}

export interface DashboardPublicacao {

  id: number;

  conteudo: string;

  status: number;

  totalRespostas: number;

}
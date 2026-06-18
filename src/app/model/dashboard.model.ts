export interface DashboardResponse {
  usuario: DashboardUsuario;
  metricas: DashboardMetricas;
  publicacoesRecentes: DashboardPublicacao[];
}

export interface DashboardUsuario {
  usuarioId: number;
  usuarioNome: string;
  usuarioEmail: string;
  usuarioTipoUsuario: number;
  usuarioDataCadastro: string;
  usuarioStatus: number;
  clienteStack?: string;
  usuarioDescricao?: string;
}

export interface DashboardMetricas {
  totalPublicacoes: number;
  totalRespostasRecebidas: number;
  publicacoesAbertas: number;
  valorTotalInvestido: number;
}

export interface DashboardPublicacao {
  publicacaoId: number;
  publicacaoTitulo: string;
  publicacaoConteudo: string;
  publicacaoStatus: number; 
  totalRespostas: number;
}
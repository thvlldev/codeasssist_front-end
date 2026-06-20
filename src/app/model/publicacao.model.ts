export interface Publicacao {
  id: number;
  titulo: string;
  conteudo: string;
  orcamentoMin: number;
  orcamentoMax: number;
  dataCriacao: string;
  usuarioId: number;
  status: number;
}
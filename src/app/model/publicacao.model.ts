export interface Tecnologia {
  tecnologiaId: number;
  tecnologiaNome: string;
  tecnologiaStatus: number;
}

export interface Publicacao {
  id: number;
  titulo: string;
  conteudo: string;
  orcamentoMin: number;
  orcamentoMax: number;
  dataCriacao: string;
  usuarioId: number;
  status: number;
  tecnologias?: any[];
}


export interface NovaPublicacaoPayload {
  publicacaoTitulo: string;
  publicacaoConteudo: string;
  publicacaoOrcamentoMin: number;
  publicacaoOrcamentoMax: number;
  usuarioId: number;
  tecnologiasIds: number[];
}

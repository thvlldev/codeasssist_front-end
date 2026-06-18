export interface Tecnologia {
  tecnologiaId: number;
  tecnologiaNome: string;
  tecnologiaStatus: number;
}

export interface Publicacao {
  publicacaoId: number;
  publicacaoTitulo: string;
  publicacaoConteudo: string;
  publicacaoOrcamentoMin: number;
  publicacaoOrcamentoMax: number;
  publicacaoDataCriacao: string;
  usuarioId: number; 
  publicacaoStatus: number;
  tecnologias?: Tecnologia[]; 
}


export interface NovaPublicacaoPayload {
  publicacaoTitulo: string;
  publicacaoConteudo: string;
  publicacaoOrcamentoMin: number;
  publicacaoOrcamentoMax: number;
  usuarioId: number; 
  tecnologiasIds: number[]; 
}
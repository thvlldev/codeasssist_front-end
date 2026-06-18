export interface PerfilResponse {
  usuario: PerfilUsuario;
  tecnologias: TecnologiaPerfil[];
  avaliacoes: AvaliacaoPerfil[];
  trabalhosRecentes: TrabalhoRecente[];
}

export interface PerfilUsuario {
  usuarioId: number;
  usuarioNome: string;
  usuarioEmail: string;
  usuarioDataCadastro: string;

  mentorDescricao: string;
  mentorPrecoHora: number;
  mentorMediaAvaliacao: number;

  totalAvaliacoes: number;
  totalTrabalhos: number;

  localizacao?: string;
}

export interface TecnologiaPerfil {
  tecnologiaId: number;
  tecnologiaNome: string;
}

export interface AvaliacaoPerfil {
  avaliacaoId: number;
  clienteNome: string;
  avaliacaoValor: number;
  avaliacaoComentario: string;
}

export interface TrabalhoRecente {
  publicacaoId: number;
  publicacaoTitulo: string;
}

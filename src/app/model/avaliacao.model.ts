export interface Avaliacao {
  id: number;
  clienteUsuarioId: number;
  mentorUsuarioId: number;
  valor: number;
  comentario: string;
  publicacaoId: number;
  status: number;
}
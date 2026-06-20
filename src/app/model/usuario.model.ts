export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha: string;
  tipoUsuario: number | null; // confirmado que pode vir null (ex: id 7, 8, 9...)
  dataCadastro: string;
  status: number;
}
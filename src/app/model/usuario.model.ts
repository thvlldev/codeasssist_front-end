export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha: string;
  tipoUsuario: number | null; 
  dataCadastro: string;
  status: number;
}
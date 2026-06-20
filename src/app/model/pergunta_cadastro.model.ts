export interface PerguntaCadastro {
  id: number;
  enunciado: string;
  tipo: string; // valores vistos: "multipla_escolha" | "texto"
  status: number;
}
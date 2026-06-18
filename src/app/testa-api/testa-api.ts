import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';


interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha: string;
  tipoUsuario: number;
  dataCadastro: string;
  status: number;
}

@Component({
  selector: 'app-testa-api',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testa-api.html',
})
export class ApiTesteComponent {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  apiUrl = `http://academico3.rj.senac.br/20261prjint3manha-mentoria/api/usuarios`;
  status: 'idle' | 'carregando' | 'sucesso' | 'erro' = 'idle';
  usuarios: Usuario[] = [];
  erro = '';

  testar() {
    this.status = 'carregando';
    this.usuarios = [];
    this.erro = '';
    this.cdr.detectChanges();

    this.http.get<Usuario[]>(this.apiUrl).subscribe({
      next: (dados) => {
        this.usuarios = dados;
        this.status = 'sucesso';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.erro = `${err.status} - ${err.message}`;
        this.status = 'erro';
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }
}

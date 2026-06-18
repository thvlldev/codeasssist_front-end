import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { PerfilResponse } from '../../model/perfil.model';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {

  private readonly API =
    'http://academico3.rj.senac.br/20261prjint3manha-mentoria/api/perfil';

  constructor(
    private http: HttpClient
  ) {}

  buscarPerfil(): Observable<PerfilResponse> {
    return this.http.get<PerfilResponse>(this.API);
  }

}

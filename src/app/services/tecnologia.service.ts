import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Tecnologia } from '../model/tecnologia.model';

@Injectable({ providedIn: 'root' })
export class TecnologiaService {
  private http = inject(HttpClient);
  private readonly API_BASE = environment.apiServer;

  listarTodas(): Observable<Tecnologia[]> {
    return this.http.get<Tecnologia[]>(`${this.API_BASE}/tecnologias`);
  }

  buscarPorId(id: number): Observable<Tecnologia> {
    return this.http.get<Tecnologia>(`${this.API_BASE}/tecnologias/${id}`);
  }
}
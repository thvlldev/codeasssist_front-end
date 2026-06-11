import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

import { DashboardResponse } from '../model/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private readonly API =
    'http://localhost:8080/dashboard';

  constructor(
    private http: HttpClient
  ) {}

  buscarDashboard():
    Observable<DashboardResponse> {

    return this.http.get<DashboardResponse>(
      this.API
    );

  }

}
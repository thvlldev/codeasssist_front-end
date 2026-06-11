import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  RouterModule
} from '@angular/router';

import {
  DashboardService
} from '../../services/dashboard.service';

import { DashboardResponse } from '../../model/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent
implements OnInit {

  dashboard!: DashboardResponse;

  carregando = true;

  constructor(
    private dashboardService:
      DashboardService
  ) {}

  ngOnInit(): void {

    this.buscarDashboard();

  }

  buscarDashboard(): void {

    this.dashboardService
      .buscarDashboard()
      .subscribe({

        next: (response) => {

          this.dashboard = response;

          this.carregando = false;

        },

        error: (error) => {

          console.error(error);

          this.carregando = false;

        }

      });

  }

}
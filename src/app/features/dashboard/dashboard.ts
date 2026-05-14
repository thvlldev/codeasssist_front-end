import { Component } from '@angular/core';
import { Footer } from "../../shared/footer/footer";
import { Sidenav } from '../../shared/sidenav/sidenav';


@Component({
  selector: 'app-dashboard',
  imports: [Footer, Sidenav],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {

}

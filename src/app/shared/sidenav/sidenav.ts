import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-sidenav',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    Footer
  ],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.css',
})
export class Sidenav {

  constructor(private router: Router) {}

   sair() {
    this.router.navigate(['/']);
  }


}

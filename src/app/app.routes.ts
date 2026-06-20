import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page';
import { DashboardComponent } from './features/dashboard/dashboard';
import { OnboardingComponent } from './features/onboarding/onboarding';
import { PublicacoesComponent } from './features/publicacao/publicacao';
import { ApiTesteComponent } from './testa-api/testa-api';
import { Sidenav } from './shared/sidenav/sidenav';
import { NovaPublicacaoComponent } from './features/nova-publicacao/nova-publicacao';

export const routes: Routes = [
  // Rota inicial pública
  { path: 'landingPage', component: LandingPageComponent },

  // Telas internas com suporte ao Sidenav
  {
    path: 'app',
    component: Sidenav,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'publicacoes', component: PublicacoesComponent },
      { path: 'nova-publicacao', component: NovaPublicacaoComponent },

    ]
  },

  // Rotas isoladas para testes ou fluxos iniciais
  { path: 'teste', component: ApiTesteComponent },
  { path: 'onboarding', component: OnboardingComponent },

  // Wildcard (Qualquer rota inválida joga para a Landing Page)
  { path: '**', redirectTo: 'landingPage' }
];

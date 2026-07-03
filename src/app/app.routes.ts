import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page';
import { DashboardComponent } from './features/dashboard/dashboard';
import { OnboardingComponent } from './features/onboarding/onboarding';
import { PublicacoesComponent } from './features/publicacao/publicacao';
import { DetalhePublicacaoComponent } from './features/detalhe-publicacao/detalhe-publicacao';
import { Sidenav } from './shared/sidenav/sidenav';
import { NovaPublicacaoComponent } from './features/nova-publicacao/nova-publicacao';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'landingPage', component: LandingPageComponent },

  {
    path: 'app',
    component: Sidenav,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'publicacoes', component: PublicacoesComponent },
      { path: 'publicacoes/:id', component: DetalhePublicacaoComponent },
      { path: 'nova-publicacao', component: NovaPublicacaoComponent },
      {path: 'perfil',loadComponent: () => import('./features/perfil/perfil').then(m => m.PerfilComponent)},// lazy loading: o código do PerfilComponent só é baixado quando o usuário navega até /app/perfil
      {path: 'chat/:id',loadComponent: () => import('./features/chat/chat').then(m => m.ChatComponent)} // lazy loading + parâmetro dinâmico: o :id identifica a conversa/resposta a ser exibida
    ]
  },
  { path: 'onboarding', component: OnboardingComponent },
  { path: '', redirectTo: 'landingPage', pathMatch: 'full' },
  { path: '**', redirectTo: 'landingPage' }
];
import { Footer } from './shared/footer/footer';
import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page';
import { DashboardComponent } from './features/dashboard/dashboard';
import { OnboardingComponent } from './features/onboarding/onboarding';
import { PublicacoesComponent } from './features/publicacao/publicacao';
import { ApiTesteComponent } from './testa-api/testa-api';
import { Sidenav } from './shared/sidenav/sidenav';
import { NovaPublicacaoComponent } from './nova-publicacao/nova-publicacao';

export const routes: Routes = [


    {path:'landingPage', component:LandingPageComponent},
    {
  path: 'app',
  component: Sidenav,
  children: [
    {path: '',redirectTo: 'dashboard', pathMatch :'full'},
    { path: 'dashboard', component: DashboardComponent },
    { path: 'publicacoes', component: PublicacoesComponent },
    { path: 'nova-publicacao', component: NovaPublicacaoComponent}
    // ... suas outras rotas filhas
  ]
},
    {path: 'teste', component: ApiTesteComponent},

    {path: 'publicacoes', component: PublicacoesComponent},
    { path: 'onboarding', component: OnboardingComponent },

    {path: 'perfil',loadComponent: () => import('./features/perfil/perfil').then(m => m.PerfilService)},
    {path: '**', redirectTo:'landingPage'},



]

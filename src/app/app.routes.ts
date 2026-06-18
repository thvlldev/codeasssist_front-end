import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page';
import { DashboardComponent } from './features/dashboard/dashboard';
import { OnboardingComponent } from './features/onboarding/onboarding';
import { PublicacoesComponent } from './features/publicacao/publicacao';
import { ApiTesteComponent } from './testa-api/testa-api';
import { Sidenav } from './shared/sidenav/sidenav';

export const routes: Routes = [

    {path: '',redirectTo: 'landingPage', pathMatch :'full'},
    {path:'landingPage', component:LandingPageComponent},
    {
  path: 'app', redirectTo: 'app/dashboard',
  component: Sidenav, // O componente da Sidenav serve como a "casca" estrutural
  children: [
    { path: 'dashboard', component: DashboardComponent },
    { path: 'publicacoes', component: PublicacoesComponent },
    // ... suas outras rotas filhas
  ]
},
    {path: 'teste', component: ApiTesteComponent},

    {path: 'publicacoes', component: PublicacoesComponent},
    { path: 'onboarding', component: OnboardingComponent },

    {path: 'perfil',loadComponent: () => import('./features/perfil/perfil').then(m => m.PerfilService)},
    {path: '**', redirectTo:'landingPage'},



]

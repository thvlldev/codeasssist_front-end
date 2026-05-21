import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page';
import { DashboardComponent } from './features/dashboard/dashboard';

export const routes: Routes = [

    {path: '',redirectTo: 'landingPage', pathMatch :'full'},
    {path:'landingPage', component:LandingPageComponent},
    {path:'dashboard', component: DashboardComponent},
    {path: '**', redirectTo:'landingPage'},


]

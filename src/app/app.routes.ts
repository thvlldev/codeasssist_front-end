import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page';
import { DashboardComponent } from './features/dashboard/dashboard';
import { OnboardingComponent } from './features/onboarding/onboarding';

export const routes: Routes = [

    {path: '',redirectTo: 'landingPage', pathMatch :'full'},
    {path:'landingPage', component:LandingPageComponent},
    {path:'dashboard', component: DashboardComponent},
    { path: 'onboarding', component: OnboardingComponent },
    {path: '**', redirectTo:'landingPage'},


]

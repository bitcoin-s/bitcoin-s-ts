import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { AboutComponent } from './component/about/about.component';
import { BuildAcceptOfferComponent } from './component/build-accept-offer/build-accept-offer.component';
import { ContactsComponent } from './component/contacts/contacts.component';
import { ContractsComponent } from './component/contracts/contracts.component';
import { LoginComponent } from './component/login/login.component';
import { NetworkComponent } from './component/network/network.component';
import { NewUserOnboardingComponent } from './component/new-user-onboarding/new-user-onboarding.component';
import { OffersComponent } from './component/offers/offers.component';
import { WalletBalanceComponent } from './component/wallet-balance/wallet-balance.component';

import { AuthGuard } from './guard/auth-guard';

const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'about', component: AboutComponent },
  {
    path: 'onboarding',
    component: NewUserOnboardingComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'wallet',
    component: WalletBalanceComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'contracts',
    component: ContractsComponent,
    canActivate: [AuthGuard],
  },
  { path: 'offers', component: OffersComponent, canActivate: [AuthGuard] },
  {
    path: 'create',
    component: BuildAcceptOfferComponent,
    canActivate: [AuthGuard],
  },
  { path: 'network', component: NetworkComponent, canActivate: [AuthGuard] },
  { path: 'contacts', component: ContactsComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  // { path: '**', component: AppComponent }, // TODO : 404 page
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forRoot(
      appRoutes,
      { useHash: true, enableTracing: false } // <-- debugging purposes only
    ),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}

import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Routes } from '@angular/router'

import { AboutComponent } from './component/about/about.component'
import { BuildAcceptOfferComponent } from './component/build-accept-offer/build-accept-offer.component'
import { ContractsComponent } from './component/contracts/contracts.component'
import { WalletBalanceComponent } from './component/wallet-balance/wallet-balance.component'


const appRoutes: Routes = [
  { path: 'wallet', component: WalletBalanceComponent },
  { path: 'contracts', component: ContractsComponent },
  { path: 'offers', component: BuildAcceptOfferComponent },
  { path: 'about', component: AboutComponent },
  { path: '',   redirectTo: '/wallet', pathMatch: 'full' },
  // { path: '**', component: AppComponent }, // TODO : 404 page
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forRoot(
      appRoutes,
      { useHash: true, 
        enableTracing: false } // <-- debugging purposes only
    )
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }

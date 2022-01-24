import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Routes } from '@angular/router'

import { AboutComponent } from './about/about.component'
import { LoginComponent } from './login/login.component'
import { OracleComponent } from './oracle/oracle.component'

import { AuthGuard } from './guard/auth-guard'


const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'about', component: AboutComponent },
  { path: 'oracle', component: OracleComponent, canActivate: [AuthGuard] },
  { path: '',   redirectTo: '/login', pathMatch: 'full' },
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

import { Injectable } from '@angular/core'
import { Router, CanActivate } from '@angular/router'

import { AuthService } from '~service/auth.service'


@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.authService.isLoggedIn) {
      console.warn('not logged in, going to /login')
      this.router.navigate(['/login'])
      return false
    }
    return true
  }

}

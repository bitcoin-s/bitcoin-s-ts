import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http'
import { Injectable, Injector } from '@angular/core'
import { Observable } from 'rxjs'

import { AuthService } from '~service/auth.service'


@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  // Have seen issues with direct injection
  // https://github.com/angular/angular/issues/23023
  // get authService() {
  //   return this.injector.get(AuthService)
  // }

  private _authService: AuthService

  constructor(private injector: Injector) {
    this._authService = this.injector.get(AuthService)
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this._authService.getToken()

    if (token) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', 'Bearer ' + token)
      })
      return next.handle(cloned)
    } else {
      return next.handle(req)
    }
  }

}

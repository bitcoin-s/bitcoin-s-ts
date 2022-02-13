import { HttpClient } from '@angular/common/http'
import { EventEmitter, Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { of, Subscription, timer } from 'rxjs'
import { shareReplay, tap, take, catchError } from 'rxjs/operators'

import { environment } from '../environments/environment'

import { LogoutDialogComponent } from '~app/dialog/logout/logout.component'


// LocalStorage Keys
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const EXPIRES_KEY = 'expires_at'

interface LoginResponse { accessToken: string, refreshToken: string, expiresIn: number }

const LOGOUT_DELAY = 60000 // ms
const LOGOUT_FUDGE_FACTOR = 45000 // ms, extra padding on logout to make sure async actions don't trigger 400 errors close to logout

@Injectable({ providedIn: 'root' })
export class AuthService {

  expiration: Date|null|undefined = undefined
  loginTime$: Subscription

  loggedIn: EventEmitter<void> = new EventEmitter()
  loggedOut: EventEmitter<void> = new EventEmitter()

  // Store password for authentication via Websocket
  private _password: string
  get password() { return this._password }

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  // Initialize this service, throwing loggedIn if current login is valid
  initialize() {
    // console.debug('AuthService.initialize()')
    const expiresAt = localStorage.getItem(EXPIRES_KEY)
    if (expiresAt) {
      const expiration = new Date(parseInt(expiresAt))
      if (expiration.getTime() < new Date().getTime()) {
        console.debug('AuthService.initialize() Found expired auth token')
        this.unsetSession()
      } else {
        console.debug('AuthService.initialize() Found auth token')
        // If the token is from a previous server run, will logout when data loading 403s
        this.expiration = expiration
        this.setLoginTimer(expiration.getTime() - new Date().getTime() - LOGOUT_FUDGE_FACTOR)
        this.loggedIn.emit()
      }
    }
  }

  login(user: string, password: string) {
    this._password = password
    return this.http.post<LoginResponse>(environment.proxyApi + `/auth/login`, { user, password })
      .pipe(tap(result => {
        this.doLogin(result)
      }), shareReplay())
  }

  logout() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    return this.http.post<any>(environment.proxyApi + `/auth/logout`, { refreshToken })
      .pipe(tap(res => {
        this.doLogout()
      }), shareReplay())
  }

  authTest() {
    return this.http.post<any>(environment.proxyApi + `/auth/test`, { test: 1 })
      .pipe(tap(res => {
        // Nothing to do
      }))
  }

  private doLogin(result: LoginResponse) {
    this.setSession(result)
    this.loggedIn.emit()
  }
        
  private setSession(response: LoginResponse) {
    // console.debug('setSession()', response)
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
    this.expiration = new Date(Date.now() + response.expiresIn)
    localStorage.setItem(EXPIRES_KEY, this.expiration.getTime().toString())
    this.setLoginTimer(response.expiresIn - LOGOUT_FUDGE_FACTOR)
  }
  
  private setLoginTimer(expiresIn: number) {
    let time = expiresIn - LOGOUT_DELAY
    console.debug('setLoginTimer()', time, 'ms')
    if (time <= 0) this.showLogoutDialog(Math.floor(expiresIn / 1000))
    else {
      if (this.loginTime$) this.loginTime$.unsubscribe()
      this.loginTime$ = timer(time).pipe(take(1)).subscribe(_ => {
        this.showLogoutDialog(LOGOUT_DELAY / 1000)
      })
    }
  }

  private showLogoutDialog(time: number) {
    console.debug('showLogoutDialog()', time)
    const dialog = this.dialog.open(LogoutDialogComponent, {
      data: {
        time: time
      }
    }).afterClosed().subscribe(result => {
      console.debug('Logout Dialog closed', result)
      if (result && result.refresh) {
        console.debug('refreshing auth token')
        this.refresh().subscribe(res => {
          console.debug('auth token refreshed')
        })
      } else {
        this.logout().subscribe()
      }
    })
  }

  // Public to allow error handlers to call
  doLogout() {
    this.unsetSession()
    this.loggedOut.emit()
  }

  private unsetSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(EXPIRES_KEY)
    this.expiration = null
    if (this.loginTime$) {
      this.loginTime$.unsubscribe()
    }
  }

  refresh() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) {
      console.error('no refreshToken to refresh')
      return of(<LoginResponse><unknown>null)
    }
    return this.http.post<LoginResponse>(environment.proxyApi + `/auth/refresh`, 
      { user: 'frontend', refreshToken })
      .pipe(catchError(error => {
        this.doLogout()
        throw(Error('auth refresh error, doLogout()'))
      }), tap(res => {
        this.setSession(res)
      }), shareReplay())
  }

  public getToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  }

  public get isLoggedIn() {
    if (this.expiration) {
      return this.expiration.getTime() >= new Date().getTime()
    }
    return false
  }

  public get isLoggedOut() {
    return !this.isLoggedIn
  }

}

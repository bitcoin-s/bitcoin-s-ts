import { Injectable } from '@angular/core'

import { stringToBoolean } from '~util/ui-util'


// LocalStorage Keys
const TOR_KEY = 'USE_TOR'

const DEFAULT_USE_TOR = false

// const TOR_ERROR_THRESHOLD = 0

@Injectable({ providedIn: 'root' })
export class TorService {

  private _useTor: boolean
  set useTor(value: boolean) {
    this._useTor = value
    localStorage.setItem(TOR_KEY, value.toString())
  }
  get useTor() {
    // if (this._errors > TOR_ERROR_THRESHOLD) {
    //   return false;
    // }
    return this._useTor
  }

  // Could track error count and doing something here...
  // private _errors = 0
  // addError() {
  //   ++this._errors
  // }

  constructor() {
    const value = localStorage.getItem(TOR_KEY)
    this._useTor = value ? stringToBoolean(value) : DEFAULT_USE_TOR
    console.warn('useTor:', this.useTor)
  }

}

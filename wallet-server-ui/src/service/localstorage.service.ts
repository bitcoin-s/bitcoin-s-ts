import { Injectable } from '@angular/core'


export const NO_SPLASH_KEY = 'noSplash';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {

  constructor() {}

  get(key: string): string|null {
    return localStorage.getItem(key)
  }

  getObject(key: string): any|null {
    const s = localStorage.getItem(key)

    if (s) {
      try {
        const obj = JSON.parse(s)
        return obj
      } catch (err) {
        console.error('error parsing localStorage key', key, err)
      }
    }
    return null
  }

  set(key: string, value: any) {
    if (value) {
      const stringValue = JSON.stringify(value)
      localStorage.setItem(key, stringValue)
    }
  }

  clear(key: string) {
    localStorage.removeItem(key)
  }

}

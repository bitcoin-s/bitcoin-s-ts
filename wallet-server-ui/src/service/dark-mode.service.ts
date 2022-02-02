import { EventEmitter, Injectable, Output } from '@angular/core'


const CSS_DARK_MODE = 'CSS_DARK_MODE'
const SET = 'SET'

@Injectable({ providedIn: 'root' })
export class DarkModeService {

  @Output() darkModeChanged: EventEmitter<boolean> = new EventEmitter()

  get isDarkMode() {
    return localStorage.getItem(CSS_DARK_MODE) !== null
  }

  setDarkMode(darkModeOn: boolean) {
    console.debug('setDarkMode()', darkModeOn)
    if (darkModeOn) {
      localStorage.setItem(CSS_DARK_MODE, SET)
    } else {
      localStorage.removeItem(CSS_DARK_MODE)
    }
    this.darkModeChanged.next(darkModeOn)
  }

}

import { animate, animateChild, query, style, transition, trigger } from '@angular/animations'
import { Router } from '@angular/router'

import { Component, OnInit } from '@angular/core'

const SPLASH_KEY = 'noSplash'

@Component({
  selector: 'splash',
  templateUrl: './splash.component.html',
  animations: [
    // the fade-in/fade-out animation.
    trigger('fadeOut', [
      transition(':leave', [query(':leave', animateChild(), { optional: true }), animate(300, style({ opacity: 0 }))]),
    ]),
  ],
  styleUrls: ['./splash.component.scss'],
})
export class SplashComponent implements OnInit {
  showSplash = false
  dontShowSplashAgain = false

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Force reset splash key
    // localStorage.removeItem(SPLASH_KEY)

    const show = localStorage.getItem(SPLASH_KEY) === null
    this.showSplash = show
  }

  onStartOnboardingClicked() {
    this.saveSplashSettings()
    this.showSplash = false

    this.router.navigate(['/onboarding'])
  }

  onSkipOnboardingClicked() {
    this.saveSplashSettings()
    this.showSplash = false

    this.router.navigate(['/wallet'])
  }

  saveSplashSettings() {
    if (this.dontShowSplashAgain) {
      localStorage.setItem(SPLASH_KEY, '1')
    }
  }
}

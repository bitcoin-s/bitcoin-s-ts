import { animate, animateChild, group, query, style, transition, trigger } from '@angular/animations'
import { Component, OnInit } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'

import { BackendService } from '~service/backend.service'
import { WalletStateService } from '~service/wallet-state-service'

import { copyToClipboard, formatNumber } from '~util/utils'

import { ExportComponent } from '../export/export.component'
import { NewUserOnboardingSteps } from '../new-user-onboarding-card/new-user-onboarding-step'


const slideInFromRight = [
  query(':enter, :leave', style({ position: 'absolute', width: '100%' }), {
    optional: true,
  }),
  group([
    query(':enter', [style({ transform: 'translateX(-100%)' }), animate('.3s ease-out', style({ transform: 'translateX(0%)' }))], {
      optional: true,
    }),
    query(':leave', [style({ transform: 'translateX(0%)' }), animate('.3s ease-out', style({ transform: 'translateX(100%)' }))], {
      optional: true,
    }),
  ]),
]

const slideInFromLeft = [
  query(':enter, :leave', style({ position: 'absolute', width: '100%' }), {
    optional: true,
  }),
  group([
    query(':enter', [style({ transform: 'translateX(100%)' }), animate('.3s ease-out', style({ transform: 'translateX(0%)' }))], {
      optional: true,
    }),
    query(':leave', [style({ transform: 'translateX(0%)' }), animate('.3s ease-out', style({ transform: 'translateX(-100%)' }))], {
      optional: true,
    }),
  ]),
]

@Component({
  selector: 'app-new-user-onboarding',
  templateUrl: './new-user-onboarding.component.html',
  styleUrls: ['./new-user-onboarding.component.scss'],
  animations: [
    // the fade-in/fade-out animation for the top-level page.
    trigger('fadeOut', [transition(':leave', [query(':leave', animateChild(), { optional: true }), animate(300, style({ opacity: 0 }))])]),

    trigger('stepSlider', [transition(':increment', slideInFromLeft), transition(':decrement', slideInFromRight)]),
  ],
})
export class NewUserOnboardingComponent implements OnInit {

  public copyToClipboard = copyToClipboard
  public formatNumber = formatNumber

  public NewUserOnboardingSteps = NewUserOnboardingSteps

  currentStep = 1

  constructor(public walletStateService: WalletStateService, public backendService: BackendService,
    private router: Router, private dialog: MatDialog) {}

  ngOnInit() {}

  onNextStep() {
    console.debug('onNextStep()')
    if (this.currentStep < this.NewUserOnboardingSteps.length) {
      this.currentStep += 1
    }
  }

  onPreviousStep() {
    console.debug('onPreviousStep()')
    if (this.currentStep > 0) {
      this.currentStep -= 1
    }
  }

  onComplete() {
    console.debug('onComplete()')
    this.router.navigate(['/wallet'])
  }

  onStepSelected(step: number) {
    console.debug('onStepSelected()')
    this.currentStep = step
  }

  onExportSeed() {
    console.debug('onExportSeed()')
    this.dialog.open(ExportComponent)
  }
}

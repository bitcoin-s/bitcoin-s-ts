import { Component, OnInit } from '@angular/core'

import { animate, animateChild, group, query, style, transition, trigger } from '@angular/animations'
import { onboardingSteps } from '../new-user-onboarding-card/new-user-onboarding-step'

const slideLeft = [
  query(':enter, :leave', style({ position: 'fixed', width: '100%' }), {
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

const slideRight = [
  query(':enter, :leave', style({ position: 'fixed', width: '100%' }), {
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

    // onboardingStepAnimations,
    trigger('stepSlider', [transition(':increment', slideRight), transition(':decrement', slideLeft)]),
  ],
})
export class NewUserOnboardingComponent implements OnInit {
  currentStep: number = 1

  constructor() {}

  onboardingStepCards = onboardingSteps

  ngOnInit() {}

  stepIconName(step: number): string {
    switch (step) {
      case 1:
        return 'looks_one'
      case 2:
        return 'looks_two'
      case 3:
        return 'looks_3'
      default:
        return ''
    }
  }

  onNextStepTapped() {
    if (this.currentStep < this.onboardingStepCards.length) {
      this.currentStep += 1
    }
  }

  onPreviousStepTapped() {
    if (this.currentStep > 0) {
      this.currentStep -= 1
    }
  }

  onCompleteTapped() {}

  onStepSelected(step: number) {
    this.currentStep = step
  }
}

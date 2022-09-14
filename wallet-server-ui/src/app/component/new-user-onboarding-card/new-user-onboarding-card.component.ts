import { Component, Input, OnInit } from '@angular/core'
import { AnimationOptions } from 'ngx-lottie'
import { NewUserOnboardingStep } from './new-user-onboarding-step'

@Component({
  selector: 'new-user-onboarding-card',
  templateUrl: './new-user-onboarding-card.component.html',
  styleUrls: ['./new-user-onboarding-card.component.scss'],
})
export class NewUserOnboardingCardComponent implements OnInit {
  constructor() {}

  @Input() onboardingStep: NewUserOnboardingStep

  public graphicAnimationOptions: AnimationOptions

  ngOnInit(): void {
    this.graphicAnimationOptions = {
      path: this.onboardingStep.animatedGraphicPath,
    }
  }
}

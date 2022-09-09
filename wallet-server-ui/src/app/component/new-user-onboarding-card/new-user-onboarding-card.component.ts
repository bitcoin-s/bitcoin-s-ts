import { Component, Input, OnInit } from '@angular/core';
import { NewUserOnboardingStep } from './new-user-onboarding-step';

@Component({
  selector: 'new-user-onboarding-card',
  templateUrl: './new-user-onboarding-card.component.html',
  styleUrls: ['./new-user-onboarding-card.component.scss'],
})
export class NewUserOnboardingCardComponent implements OnInit {
  constructor() {}

  @Input() card: NewUserOnboardingStep;

  ngOnInit(): void {}

  cardTitle(): string {
    switch (this.card.onboardingStep) {
      case 1:
        return 'Backup Your Wallet Seed';
      case 2:
        return 'Fund Your Wallet';
      case 3:
        return 'Share Your Tor Address';
      default:
        return '';
    }
  }
}

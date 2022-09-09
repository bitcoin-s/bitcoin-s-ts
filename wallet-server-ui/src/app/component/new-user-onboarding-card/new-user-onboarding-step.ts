export interface NewUserOnboardingStep {
  id: number;
  name?: string;
  menuTitle: string;
  onboardingStep: number;
  descriptionText: string;
}

export const onboardingSteps: NewUserOnboardingStep[] = [
  {
    id: 1,
    menuTitle: 'Wallet Seed Backup',
    onboardingStep: 1,
    descriptionText:
      'Placeholder description text for why users should backup their mnemonic seed — and a brief overview of what that might entail before they select the option to do it.',
  },
  {
    id: 2,
    menuTitle: 'Wallet Funding',
    onboardingStep: 2,
    descriptionText:
      'Placeholder description text for why users should deposit funds into their wallet — and a brief overview of what that might entail before they select the option to do it.',
  },
  {
    id: 3,
    menuTitle: 'Tor Address Sharing',
    onboardingStep: 3,
    descriptionText:
      'Placeholder description text for why users should share their wallet’s Tor address with a peer — and a brief overview of what that might entail before they select the option to do it.',
  },
];

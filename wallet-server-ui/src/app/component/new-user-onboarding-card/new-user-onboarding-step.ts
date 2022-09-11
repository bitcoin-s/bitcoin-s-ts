export interface NewUserOnboardingStep {
  id: number
  name?: string
  menuTitleKey: string
  cardTitleKey: string
  onboardingStep: number
  descriptionTextKey: string
  animatedGraphicPath: string
}

export const onboardingSteps: NewUserOnboardingStep[] = [
  {
    id: 1,
    menuTitleKey: 'Wallet Seed Backup',
    cardTitleKey: 'newUserOnboarding.card.step1.title',
    onboardingStep: 1,
    descriptionTextKey: 'newUserOnboarding.card.step1.description',
    animatedGraphicPath: '/assets/lottie-animations/vault.json',
  },
  {
    id: 2,
    menuTitleKey: 'Wallet Funding',
    cardTitleKey: 'newUserOnboarding.card.step2.title',
    onboardingStep: 2,
    descriptionTextKey: 'newUserOnboarding.card.step2.description',
    animatedGraphicPath: '/assets/lottie-animations/bitcoin-wallet.json',
  },
  {
    id: 3,
    menuTitleKey: 'Tor Address Sharing',
    cardTitleKey: 'newUserOnboarding.card.step3.title',
    onboardingStep: 3,
    descriptionTextKey: 'newUserOnboarding.card.step3.description',
    animatedGraphicPath: '/assets/lottie-animations/share-tor-address-1.json',
  },
  {
    id: 4,
    menuTitleKey: 'Understanding Sync',
    cardTitleKey: 'newUserOnboarding.card.step4.title',
    onboardingStep: 4,
    descriptionTextKey: 'newUserOnboarding.card.step4.description',
    animatedGraphicPath: '/assets/lottie-animations/sync-spinner.json',
  },
]

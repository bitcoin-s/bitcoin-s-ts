export interface NewUserOnboardingStep {
  id: number
  name?: string
  menuIconKey: string
  menuTitleKey: string
  cardTitleKey: string
  stepNumber: number
  descriptionTextKey: string
  animatedGraphicPath: string
}

export const NewUserOnboardingSteps: NewUserOnboardingStep[] = [
  {
    id: 1,
    menuTitleKey: 'Wallet Seed Backup',
    menuIconKey: '1️⃣',
    cardTitleKey: 'newUserOnboarding.card.step1.title',
    stepNumber: 1,
    descriptionTextKey: 'newUserOnboarding.card.step1.description',
    animatedGraphicPath: '/assets/lottie-animations/vault.json',
  },
  {
    id: 2,
    menuTitleKey: 'Wallet Funding',
    menuIconKey: '2️⃣',
    cardTitleKey: 'newUserOnboarding.card.step2.title',
    stepNumber: 2,
    descriptionTextKey: 'newUserOnboarding.card.step2.description',
    animatedGraphicPath: '/assets/lottie-animations/bitcoin-wallet.json',
  },
  {
    id: 3,
    menuTitleKey: 'Tor Address Sharing',
    menuIconKey: '3️⃣',
    cardTitleKey: 'newUserOnboarding.card.step3.title',
    stepNumber: 3,
    descriptionTextKey: 'newUserOnboarding.card.step3.description',
    animatedGraphicPath: '/assets/lottie-animations/share-tor-address-1.json',
  },
  {
    id: 4,
    menuTitleKey: 'Understanding Sync',
    menuIconKey: '4️⃣',
    cardTitleKey: 'newUserOnboarding.card.step4.title',
    stepNumber: 4,
    descriptionTextKey: 'newUserOnboarding.card.step4.description',
    animatedGraphicPath: '/assets/lottie-animations/sync-spinner.json',
  },
]

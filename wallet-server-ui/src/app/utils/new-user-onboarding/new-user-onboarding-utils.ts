export function emojiForOnboardingStepNumber(stepNumber: number): string {
  switch (stepNumber) {
    case 1:
      return '1️⃣'
    case 2:
      return '2️⃣'
    case 3:
      return '3️⃣'
    case 4:
      return '4️⃣'
    default:
      return ''
  }
}


export function dateToSecondsSinceEpoch(date: Date) {
  const secondsSinceEpoch = Math.round(date.getTime() / 1000)
  return secondsSinceEpoch
}


// Krystal Bull Icons

export const KrystalBullImages: string[] = ['/assets/image/300x300/krystal_bull.png', '/assets/image/300x300/krystal_bull_red.png']
// , '/assets/image/300x300/krystal_bull_blue.jpeg', 
// '/assets/image/300x300/krystal_bull_green.jpeg', '/assets/image/300x300/krystal_bull_indigo.jpeg', '/assets/image/300x300/krystal_bull_orange.jpeg',
// '/assets/image/300x300/krystal_bull_purple.jpeg']

export function stringToBoolean(s: string | null) {
  return s === 'true'
}

export function copyToClipboard(s: string|undefined|null) {
  if (s === undefined || s === null) return
  const hiddenta = document.createElement('textarea')
  hiddenta.style.position = 'fixed'
  hiddenta.style.opacity = '0'
  hiddenta.style.left = '0'
  hiddenta.style.top = '0'
  hiddenta.value = s
  document.body.appendChild(hiddenta)
  hiddenta.focus()
  hiddenta.select()
  document.execCommand('copy')
  document.body.removeChild(hiddenta)
}


export function copyToClipboard(s: string) {
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

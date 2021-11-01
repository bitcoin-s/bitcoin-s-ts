
export function validateBoolean(s: boolean, fromFn: string, paramName: string) {
  if (typeof s !== 'boolean') {
    throw(Error(fromFn + ' non-boolean ' + paramName))
  }
}

export function validateString(s: string, fromFn: string, paramName: string) {
  if (typeof s !== 'string') {
    throw(Error(fromFn + ' non-string ' + paramName))
  }
}

export function validateNumber(n: number, fromFn: string, paramName: string) {
  if (typeof n !== 'number') {
    throw(Error(fromFn + ' non-number ' + paramName))
  }
}

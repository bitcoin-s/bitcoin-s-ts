
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

const ISO_DATE_REGEX = /[+-]?\d{4}(-[01]\d(-[0-3]\d(T[0-2]\d:[0-5]\d:?([0-5]\d(\.\d+)?)?[+-][0-2]\d:[0-5]\dZ?)?)?)?/

export function validateISODateString(s: string, fromFn: string, paramName: string) {
  validateString(s, fromFn, paramName)
  // TODO : Validate ISO Date String
  if (!ISO_DATE_REGEX.test(s)) {
    throw(Error(fromFn + 'ISO Date invalid'))
  }
}

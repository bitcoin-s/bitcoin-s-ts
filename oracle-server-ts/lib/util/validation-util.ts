
export function validateString(s: string, fromFn: string, paramName: string) {
  if (typeof s !== 'string') {
    throw(Error(fromFn + ' non-string ' + paramName))
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

export function validateEnumOutcomes(outcomes: string[], fromFn: string) {
  if (outcomes && outcomes.length > 1) {
    const hasEmpty = outcomes.filter(i => i !== '')
    if (hasEmpty.length !== outcomes.length) {
      throw(Error(fromFn + ' outcomes has empty element'))
    }
    const unique = [...new Set(outcomes)] // required --downlevelIteration in tsconfig.json
    if (unique.length !== outcomes.length) {
      throw(Error(fromFn + ' outcomes not unique'))
    }
  } else if (outcomes) {
    throw(Error(fromFn + ' must have at least two outcomes'))
  } else {
    throw(Error(fromFn + ' outcomes invalid'))
  }
}

export function validateNumber(n: number, fromFn: string, paramName: string) {
  if (typeof n !== 'number') {
    throw(Error(fromFn + ' non-number ' + paramName))
  }
}

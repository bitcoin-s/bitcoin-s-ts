
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

export function makeId(length: number) {
  let result = ''
  const characters = '0123456789' // 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

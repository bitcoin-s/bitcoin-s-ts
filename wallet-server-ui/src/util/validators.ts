import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms"
// import { validate } from 'bitcoin-address-validation'

export function regexValidator(regex: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const allowed = regex.test(control.value)
    return allowed ? null : { regexInvalid: { value: control.value }}
  }
}

function positiveNumberValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const isNotOk = Number(control.value) <= 0;
    return isNotOk ? { nonPositive: { value: control.value } } : null
  }
}

export function nonNegativeNumberValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const isNotOk = Number(control.value) < 0;
    return isNotOk ? { negative: { value: control.value } } : null
  }
}


// Get network name to use with bitcoin-address-validation
// export function getValidationNetworkName(network: BitcoinNetwork) {
//   switch (network) {
//     case BitcoinNetwork.main: return 'mainnet'
//     case BitcoinNetwork.test: return 'testnet'
//     case BitcoinNetwork.signet: return 'testnet'
//     case BitcoinNetwork.regnet: return 'regnet'
//   }
// }
// export function bitcoinAddressValidator(network: string): ValidatorFn {
//   return (control: AbstractControl): ValidationErrors | null => {
//     // const allowed = regex.test(control.value)
//     const valid = validate(control.value, <any>network)
//     return valid ? null : { addressInvalid: { value: control.value }}
//   }
// }

export function conditionalValidator(predicate: any, validator: any): ValidatorFn {
  return (formControl: AbstractControl) => {
    if (!formControl.parent) {
      return null
    }
    if (predicate()) {
      return validator(formControl);
    }
    return null
  }
}
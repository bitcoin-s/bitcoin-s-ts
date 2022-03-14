import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms"
import { Network, validate } from 'bitcoin-address-validation'

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

export function bitcoinAddressValidator(network: string | undefined): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const allowed = validate(control.value, <Network>network)
    return allowed ? null : { addressInvalid: { value: control.value } }
  }
}

export function allowEmptybitcoinAddressValidator(network: string | undefined): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === '') {
      // console.debug('allowEmptybitcoinAddressValidator() control.value:', control.value)
      // control.markAsUntouched()
      control.markAsPristine()
      return null
    }
    const allowed = validate(control.value, <Network>network)
    return allowed ? null : { addressInvalid: { value: control.value } }
  }
}

export function dontMatchValidator(s: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const allowed = control.value !== s
    return allowed ? null : { dontMatchInvalid: { value: control.value } }
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
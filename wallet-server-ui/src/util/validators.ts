import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";


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
import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core'
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ValidatorFn } from '@angular/forms'
import { MatInput } from '@angular/material/input'

import { AlertType } from '~app/component/alert/alert.component'

import { MessageService } from '~service/message.service'
import { OracleExplorerService } from '~service/oracle-explorer.service'
import { EventType } from '~type/client-types'
import { OracleServerMessage } from '~type/oracle-server-message'
import { MessageType } from '~type/oracle-server-types'
import { getMessageBody } from '~util/message-util'


/** Validators */

function regexValidator(regex: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const allowed = regex.test(control.value)
    return allowed ? null : { regexInvalid: { value: control.value }}
  }
}

function positiveNumberValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const isNotOk = Number(control.value) <= 0;
    return isNotOk ? { nonPositive: { value: control.value } } : null
  };
}

function nonNegativeNumberValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const isNotOk = Number(control.value) < 0;
    return isNotOk ? { negative: { value: control.value } } : null
  };
}

function conditionalValidator(predicate: any, validator: any): ValidatorFn {
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

function outcomeValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const s = String(control.value)
    if (s) {
      const ret: any = {}
      // Split outcomes on ',' and take out any whitespace
      const outcomes = s.split(',')
      outcomes.forEach(o => o.trim())
      // Validate outcomes
      // Outcomes must not be empty string
      const hasEmpty = outcomes.filter(i => i !== '')
      if (hasEmpty.length !== outcomes.length) {
        ret.outcomeHasEmpty = { value: control.value }
      }
      // Outcomes must be unique
      const unique = [...new Set(outcomes)]
      if (unique.length !== outcomes.length) {
        ret.outcomeUnique = { value: control.value }
      }
      // Must have two
      if (outcomes.length === 0 || outcomes.length === 1) {
        ret.outcomeMinTwo = { value: control.value }
      }
      return ret
    }
    return null
  }
}

@Component({
  selector: 'app-new-event',
  templateUrl: './new-event.component.html',
  styleUrls: ['./new-event.component.scss']
})
export class NewEventComponent implements OnInit {

  @Output() close: EventEmitter<void> = new EventEmitter()

  public AlertType = AlertType
  public EventType = EventType

  form: FormGroup
  @ViewChild('eventNameInput') eventNameInput: MatInput;

  // convenience getter for easy access to form fields
  get f() { return this.form.controls }

  eventTypeOptions = [
    { name: EventType.ENUM, ID: EventType.ENUM, checked: true },
    { name: EventType.NUMERIC, ID: EventType.NUMERIC, checked: false },
    // { name: EventType.DIGIT_DECOMP, ID: EventType.DIGIT_DECOMP, checked: false },
  ]

  eventTypes = [EventType.ENUM, EventType.NUMERIC/*, EventType.DIGIT_DECOMP*/]
  eventType = EventType.ENUM // for binding state

  // Values for testing event form state
  // private setDefaultEventValues() {
  //   this.form.setValue({
  //     eventType: EventType.ENUM,
  //     maturationTime: null,
  //     eventName: '',
  //     outcomes: 'One,Two,Three',
  //     minValue: 0,
  //     maxValue: 127,
  //     unit: 'Unit',
  //     precision: 0,
  //     numdigits: 3, // to match maxValue
  //     base: 2,
  //     signed: false,
  //   })
  // }
  private resetEventValues() {
    this.form.setValue({
      eventType: EventType.ENUM,
      maturationTime: null,
      eventName: null,
      outcomes: null,
      minValue: null,
      maxValue: null,
      unit: null,
      precision: null,
      // numdigits: null,
      // base: null,
      // signed: false,
    })
  }

  oracleName: string

  constructor(private formBuilder: FormBuilder, private messageService: MessageService, private oracleExplorerService: OracleExplorerService) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      eventType: [this.eventType],
      eventName: [null, Validators.required], // TODO : maxlength?
      maturationTime: [null, Validators.required],
      outcomes: [null, [conditionalValidator(() => this.eventType === EventType.ENUM, outcomeValidator())]],
      minValue: [null, [conditionalValidator(() => this.eventType === EventType.NUMERIC,
        Validators.required)]],
      maxValue: [null, [conditionalValidator(() => this.eventType === EventType.NUMERIC,
        Validators.required)]],
      unit: [null], // not required by backend
      precision: [null, conditionalValidator(() => this.eventType === EventType.DIGIT_DECOMP || this.eventType === EventType.NUMERIC, 
        Validators.compose([nonNegativeNumberValidator(), Validators.required]))],
      // base: [null, [conditionalValidator(() => this.eventType === EventType.DIGIT_DECOMP,
      //   positiveNumberValidator())]],
      // numdigits: [null, [conditionalValidator(() => this.eventType === EventType.DIGIT_DECOMP,
      //   positiveNumberValidator())]],
      // signed: [false],
    })

    this.oracleName = this.oracleExplorerService.oracleName.value
    this.oracleExplorerService.oracleName.subscribe(oracleName => {
      this.oracleName = oracleName
    })
  }

  reset() {
    console.debug('reset()')
    this.resetEventValues()
    this.form.markAsUntouched()
  }

  // Clear out invalid state from form items the user can't interact with for EventType selection on change
  wipeInvalidFormStates() {
    console.debug('wipeInvalidFormStates()', this.eventType)
    
    // Seeing ExpressionChangedAfterItHasBeenCheckedError in log sometimes on Create button disable binding related to this
    if (this.eventType === EventType.ENUM) {
      this.f['minValue'].setErrors(null)
      this.f['maxValue'].setErrors(null)
      // this.f['base'].setErrors(null)
      // this.f['numdigits'].setErrors(null)
      this.f['precision'].setErrors(null)

      this.f['outcomes'].updateValueAndValidity()
    } else if (EventType.NUMERIC) {
      this.f['outcomes'].setErrors(null)

      this.f['minValue'].updateValueAndValidity()
      this.f['maxValue'].updateValueAndValidity()
      this.f['precision'].updateValueAndValidity()
    } 
    // else if (EventType.DIGIT_DECOMP) {
    //   this.f['outcomes'].setErrors(null)
      
    //   this.f['base'].updateValueAndValidity()
    //   this.f['numdigits'].updateValueAndValidity()
    //   this.f['precision'].updateValueAndValidity()
    // }
  }

  onCreateEvent() {
    console.debug('onCreateEvent')

    const v = this.form.value
    let m: OracleServerMessage
    switch (v.eventType) {
      case this.EventType.ENUM:
        // TODO : Process outcomes in component / make a custom component - https://netbasal.com/angular-formatters-and-parsers-8388e2599a0e
        const outcomes = <string[]>v.outcomes.split(',')
        outcomes.forEach(o => o.trim())
        m = getMessageBody(MessageType.createenumevent, [v.eventName, v.maturationTime.toISOString(), outcomes])
        break
      case EventType.NUMERIC:
        m = getMessageBody(MessageType.createnumericevent, [v.eventName, v.maturationTime.toISOString(), 
          v.minValue, v.maxValue, v.unit, v.precision])
        break
      // case EventType.DIGIT_DECOMP:
      //   const epochSeconds = Math.round(v.maturationTime.getTime() / 1000)
      //   m = getMessageBody(MessageType.createdigitdecompevent, [v.eventName, epochSeconds, 
      //     v.base, v.signed, v.numdigits, v.unit, v.precision])
      //   break
      default:
        throw Error('onCreateEvent unknown newEventType: ' + v.eventType)
    }
    if (m !== undefined) {
      console.debug('form.value:', v, 'message:', m)
      this.messageService.sendMessage(m).subscribe()
    }
  }

  onClose() {
    console.debug('onClose()')
    this.close.next()
  }

}

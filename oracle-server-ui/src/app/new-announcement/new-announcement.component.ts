import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core'
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ValidatorFn } from '@angular/forms'
import { MatInput } from '@angular/material/input'

import { AlertType } from '~app/component/alert/alert.component'

import { MessageService } from '~service/message.service'
import { OracleExplorerService } from '~service/oracle-explorer.service'
import { OracleStateService } from '~service/oracle-state.service'

import { AnnouncementType } from '~type/client-types'
import { OracleServerMessage } from '~type/oracle-server-message'
import { MessageType } from '~type/oracle-server-types'

import { getMessageBody } from '~util/oracle-server-util'


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
  selector: 'new-announcement',
  templateUrl: './new-announcement.component.html',
  styleUrls: ['./new-announcement.component.scss']
})
export class NewAnnouncementComponent implements OnInit {

  @Output() close: EventEmitter<void> = new EventEmitter()

  public AlertType = AlertType
  public AnnouncementType = AnnouncementType

  form: FormGroup
  @ViewChild('announcementNameInput') announcementNameInput: MatInput;

  // convenience getter for easy access to form fields
  get f() { return this.form.controls }

  loading = false // waiting for the server
  announcementCreated = false // a new event has been created

  announcementTypeOptions = [
    { name: AnnouncementType.ENUM, ID: AnnouncementType.ENUM, checked: true },
    { name: AnnouncementType.NUMERIC, ID: AnnouncementType.NUMERIC, checked: false },
    // { name: AnnouncementType.DIGIT_DECOMP, ID: AnnouncementType.DIGIT_DECOMP, checked: false },
  ]

  announcementTypes = [AnnouncementType.ENUM, AnnouncementType.NUMERIC/*, AnnouncementType.DIGIT_DECOMP*/]
  announcementType = AnnouncementType.ENUM // for binding state

  minDate: Date

  // Values for testing event form state
  // private setDefaultEventValues() {
  //   this.form.setValue({
  //     announcementType: EventType.ENUM,
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
  private resetAnnouncementValues() {
    this.form.setValue({
      announcementType: AnnouncementType.ENUM,
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

  constructor(private formBuilder: FormBuilder, private oracleState: OracleStateService, private messageService: MessageService, private oracleExplorerService: OracleExplorerService) {
    // Set minimum Maturation date to tomorrow
    this.minDate = new Date()
    this.minDate.setDate(this.minDate.getDate() + 1)
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      announcementType: [this.announcementType],
      eventName: [null, Validators.required], // TODO : maxlength?
      maturationTime: [null, Validators.required],
      outcomes: [null, [conditionalValidator(() => this.announcementType === AnnouncementType.ENUM, outcomeValidator())]],
      minValue: [null, [conditionalValidator(() => this.announcementType === AnnouncementType.NUMERIC,
        Validators.required)]],
      maxValue: [null, [conditionalValidator(() => this.announcementType === AnnouncementType.NUMERIC,
        Validators.required)]],
      unit: [null, Validators.required],
      precision: [null, conditionalValidator(() => this.announcementType === AnnouncementType.DIGIT_DECOMP || this.announcementType === AnnouncementType.NUMERIC, 
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
    this.resetAnnouncementValues()
    this.form.markAsUntouched()
  }

  // Clear out invalid state from form items the user can't interact with for EventType selection on change
  wipeInvalidFormStates() {
    console.debug('wipeInvalidFormStates()', this.announcementType)
    
    // Seeing ExpressionChangedAfterItHasBeenCheckedError in log sometimes on Create button disable binding related to this
    if (this.announcementType === AnnouncementType.ENUM) {
      this.f['minValue'].setErrors(null)
      this.f['maxValue'].setErrors(null)
      // this.f['base'].setErrors(null)
      // this.f['numdigits'].setErrors(null)
      this.f['precision'].setErrors(null)

      this.f['outcomes'].updateValueAndValidity()
    } else if (AnnouncementType.NUMERIC) {
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

  onCreateAnnouncement() {
    console.debug('onCreateAnnouncement')

    const v = this.form.value
    let m: OracleServerMessage
    switch (v.announcementType) {
      case AnnouncementType.ENUM:
        // TODO : Process outcomes in component / make a custom component - https://netbasal.com/angular-formatters-and-parsers-8388e2599a0e
        const outcomes = <string[]>v.outcomes.split(',')
        outcomes.forEach(o => o.trim())
        m = getMessageBody(MessageType.createenumannouncement, [v.eventName, v.maturationTime.toISOString(), outcomes])
        break
      case AnnouncementType.NUMERIC:
        m = getMessageBody(MessageType.createnumericannouncement, [v.eventName, v.maturationTime.toISOString(), 
          v.minValue, v.maxValue, v.unit, v.precision])
        break
      // case EventType.DIGIT_DECOMP:
      //   const epochSeconds = Math.round(v.maturationTime.getTime() / 1000)
      //   m = getMessageBody(MessageType.createdigitdecompevent, [v.eventName, epochSeconds, 
      //     v.base, v.signed, v.numdigits, v.unit, v.precision])
      //   break
      default:
        throw Error('onCreateAnnouncement unknown announcementType: ' + v.announcementType)
    }
    if (m !== undefined) {
      console.debug('form.value:', v, 'message:', m)
      this.messageService.sendMessage(m).subscribe(result => {
        if (result) {
          this.announcementCreated = true
        }
        this.loading = false
        // Reload events
        this.oracleState.getAllAnnouncements().subscribe()
        // TODO : close this panel, show event detail ?
      }, error => {
        console.error('error creating announcement')
        this.loading = false
        // TODO : Show error dialog? Probably don't have details
      })
    }
  }

  onClose() {
    console.debug('onClose()')
    this.close.next()
  }

}

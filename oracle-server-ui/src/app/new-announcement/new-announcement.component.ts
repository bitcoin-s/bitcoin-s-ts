import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core'
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, Validators, ValidatorFn, FormControl } from '@angular/forms'
import { MatDatepickerInput } from '@angular/material/datepicker'
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

  enumForm: UntypedFormGroup
  numericForm: UntypedFormGroup
  selectedForm: UntypedFormGroup

  @ViewChild('announcementNameInput') announcementNameInput: MatInput
  @ViewChild('datePicker') datePicker: MatDatepickerInput<Date>

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

  private resetAnnouncementValues() {
    if (this.enumForm) {
      this.enumForm.setValue({
        eventName: null,
        maturationTime: null,
        outcomes: null,
      })
      this.enumForm.reset()
    }
    if (this.numericForm) {
      this.numericForm.setValue({
        eventName: null,
        maturationTime: null,
        minValue: null,
        maxValue: null,
        unit: null,
        precision: 0,
      })
      this.numericForm.reset()
    }
  }

  oracleName: string

  constructor(private formBuilder: UntypedFormBuilder, private oracleState: OracleStateService, private messageService: MessageService, private oracleExplorerService: OracleExplorerService) {
    // Set minimum Maturation date to tomorrow
    this.minDate = new Date()
    this.minDate.setDate(this.minDate.getDate() + 1)
  }

  ngOnInit() {
    this.createForms()

    this.oracleName = this.oracleExplorerService.oracleName.value
    this.oracleExplorerService.oracleName.subscribe(oracleName => {
      this.oracleName = oracleName
    })
  }

  private createForms() {
    this.enumForm = this.formBuilder.group({
      eventName: [null, Validators.required],
      maturationTime: [null, Validators.required],
      outcomes: [null, [Validators.required,outcomeValidator()]],
    })
    this.numericForm = this.formBuilder.group({
      eventName: [null, Validators.required],
      maturationTime: [null, Validators.required],
      minValue: [null, Validators.required],
      maxValue: [null, Validators.required],
      unit: [null, Validators.required],
      precision: [0, [Validators.required, nonNegativeNumberValidator()]],
    })
    this.announcementTypeChange()
  }

  reset() {
    console.debug('reset()')
    this.announcementCreated = false
    this.resetAnnouncementValues()
  }

  // Clear out invalid state from form items the user can't interact with for EventType selection on change
  announcementTypeChange() {
    console.debug('announcementTypeChange()', this.announcementType)

    this.selectedForm = this.announcementType === AnnouncementType.ENUM ? this.enumForm : this.numericForm
  }

  onMaturationTimeAutofill(event: any) {
    console.debug('onMaturationTimeAutofill()', event);
    if (event.isAutofilled && event.target) {
      const date = event.target.value
      this.datePicker.value = new Date(date)
    }
  }

  onCreateAnnouncement() {
    console.debug('onCreateAnnouncement')

    const v = this.selectedForm.value
    let m: OracleServerMessage
    switch (this.announcementType) { 
      case AnnouncementType.ENUM:
        // TODO : Process outcomes in component / make a custom component - https://netbasal.com/angular-formatters-and-parsers-8388e2599a0e
        let outcomes = <string[]>v.outcomes.split(',')
        outcomes = outcomes.map(o => o.trim())
        console.debug('outcomes', outcomes)
        m = getMessageBody(MessageType.createenumannouncement, [v.eventName, v.maturationTime.toISOString(), outcomes])
        break
      case AnnouncementType.NUMERIC:
        m = getMessageBody(MessageType.createnumericannouncement, [v.eventName, v.maturationTime.toISOString(), 
          v.minValue, v.maxValue, v.unit, v.precision])
        break
      default:
        throw Error('onCreateAnnouncement unknown announcementType: ' + v.announcementType)
    }
    if (m !== undefined) {
      console.debug('form.value:', v, 'message:', m)
      this.loading = true
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

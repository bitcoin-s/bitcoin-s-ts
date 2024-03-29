import { AfterViewInit, Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core'
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, Validators, ValidatorFn, FormControl, FormArray } from '@angular/forms'
import { MatDatepickerInput } from '@angular/material/datepicker'
import { MatDialog } from '@angular/material/dialog'
import { MatInput } from '@angular/material/input'

import { AlertType } from '~app/component/alert/alert.component'
import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'

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
  }
}

function nonNegativeNumberValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const isNotOk = Number(control.value) < 0;
    return isNotOk ? { negative: { value: control.value } } : null
  }
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

function outcomesValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const outcomes = <Array<{value: string}>>control.value
    if (outcomes) {
      // console.debug('outcomesValidator()', outcomes)
      const ret: any = {}
      // Outcomes must not be empty string
      const hasEmpty = outcomes.filter(i => i.value !== '')
      if (hasEmpty.length !== outcomes.length) {
        ret.outcomeHasEmpty = { value: control.value }
      }
      // Outcomes must be unique
      const unique = [...new Set(outcomes.map(o => o.value))]
      // console.debug('unique', unique)
      if (unique.length !== outcomes.length) {
        ret.outcomeUnique = { value: control.value }
      }
      // console.debug('ret:', ret)
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
export class NewAnnouncementComponent implements OnInit, AfterViewInit {

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
    if (this.outcomesArray) {
      // Force down to 2 outcomes
      while (this.outcomesArray.length !== 2) {
        this.outcomesArray.removeAt(0, { emitEvent: false })
      }
      // Force outcomes back to empty
      this.outcomesArray.setValue([{value: ''},{value: ''}])
      this.outcomesArray.reset()
    }
    if (this.enumForm) {
      this.enumForm.setValue({
        eventName: null,
        maturationTime: null,
        // outcomes: null,
        // outcomes: [{value: ''},{value: ''}], // This is not resetting when the number of outcomes has changed
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

  constructor(private formBuilder: UntypedFormBuilder, private dialog: MatDialog,
    private oracleState: OracleStateService, private messageService: MessageService, private oracleExplorerService: OracleExplorerService) {
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

  private outcomesArray: FormArray
  private setOutcomeArrayValidators() { this.outcomesArray.setValidators([Validators.required,Validators.minLength(2),outcomesValidator()]) }

  private createForms() {
    this.outcomesArray = this.formBuilder.array([this.newOutcome(), this.newOutcome()])
    this.enumForm = this.formBuilder.group({
      eventName: [null, Validators.required],
      maturationTime: [null, Validators.required],
      // outcomes: [null, [Validators.required,outcomeValidator()]],
      outcomes: this.outcomesArray,
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

  ngAfterViewInit(): void {
    // Have to set these later than init or these will start marked invalid
    this.setOutcomeArrayValidators()
  }

  outcomes(): FormArray {
    return this.enumForm.get('outcomes') as FormArray
  }

  private newOutcome(value = '') {
    return this.formBuilder.group({ value })
  }

  addOutcome() {
    console.debug('addOutcome()')
    this.outcomes().push(this.newOutcome())
  }

  removeOutcome(index: number) {
    console.debug('removeOutcome()', index)
    this.outcomes().removeAt(index)
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
        // let outcomes = <string[]>v.outcomes.split(',')
        // outcomes = outcomes.map(o => o.trim())
        let outcomes = <string[]>v.outcomes.map((o:any) => o.value)
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

  /** Warn user if they are closing a semi-built Announcement then emit close event */
  onClose() {
    console.debug('onClose()')

    if (this.announcementCreated) {
      this.close.next()
    } else if (this.selectedForm.dirty) {
      // Warn before close
      const dialog = this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: 'dialog.closeNewAnnouncement.title',
          content: 'dialog.closeNewAnnouncement.content',
          action: 'action.yes',
          actionColor: 'warn',
          showCancelButton: true,
        }
      }).afterClosed().subscribe(result => {
        console.debug(' onClose():', result)
        if (result) {
          this.close.next()
        }
        // else Canceled, do nothing
      })
    } else {
      this.close.next()
    }
  }

}

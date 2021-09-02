import { AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ValidatorFn } from '@angular/forms';
import { MatInput } from '@angular/material/input';

import { MessageService } from '~service/message.service';
import { EventType } from '~type/client-types';
import { OracleServerMessage } from '~type/oracle-server-message';
import { MessageType } from '~type/oracle-server-types';
import { getMessageBody } from '~util/message-util';


const ISO_DATE_VALIDATOR = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/

export function validateValueAgainstRegex(isoDate: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const allowed = isoDate.test(control.value)
    return allowed ? null : {regexInvalid: {value: control.value}}
  }
}

export function positiveNumberValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const isNotOk = Number(control.value) <= 0;
    return isNotOk ? { nonPositive: { value: control.value } } : null
  };
}

export function nonNegativeNumberValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const isNotOk = Number(control.value) < 0;
    return isNotOk ? { negative: { value: control.value } } : null
  };
}

@Component({
  selector: 'app-new-event',
  templateUrl: './new-event.component.html',
  styleUrls: ['./new-event.component.scss']
})
export class NewEventComponent implements OnInit, AfterViewInit {

  @Output() close: EventEmitter<void> = new EventEmitter()

  public EventType = EventType

  form: FormGroup
  @ViewChild('eventNameInput') eventNameInput: MatInput;

  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  eventTypeOptions = [
    { name: EventType.ENUM, ID: EventType.ENUM, checked: true },
    { name: EventType.NUMERIC, ID: EventType.NUMERIC, checked: false },
    { name: EventType.DIGIT_DECOMP, ID: EventType.DIGIT_DECOMP, checked: false },
  ]

  eventTypes = [EventType.ENUM, EventType.NUMERIC, EventType.DIGIT_DECOMP]

  newEventType = EventType.ENUM
  newEventName = ''
  maturationTime = '2030-01-01T00:00:00.000Z'
  // Enum Event
  outcomes = 'One,Two,Three'
  // Numeric Event
  minValue = 0
  maxValue = 127
  unit = 'Unit'
  precision = 0
  // Digit Decomp Event
  maturationTimeSeconds = 1893456000
  numdigits = 3 // to match maxValue
  base = 2
  signed = false

  private setDefaultEventValues() {
    this.newEventType = EventType.ENUM
    this.newEventName = ''
    this.maturationTime = '2030-01-01T00:00:00.000Z'
    // Enum Event
    this.outcomes = 'One,Two,Three'
    // Numeric Event
    this.minValue = 0
    this.maxValue = 127
    this.unit = 'Unit'
    this.precision = 0
    // Digit Decomp Event
    this.maturationTimeSeconds = 1893456000
    this.numdigits = 3 // to match maxValue
    this.base = 2
    this.signed = false
  }

  constructor(private messageService: MessageService, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      eventTypes: [this.newEventType],
      newEventName: [null, Validators.required], // TODO : maxlength?
      maturationTime: [null, Validators.pattern(ISO_DATE_VALIDATOR)],
      maturationTimeSeconds: [null, positiveNumberValidator()],
      outcomes: [null], // TODO : Validate
      minValue: [null],
      maxValue: [null],
      base: [null, positiveNumberValidator()],
      numdigits: [null, positiveNumberValidator()],
      unit: [null], // not required by backend
      precision: [null, nonNegativeNumberValidator()],
      signed: [null],
    })
  }

  ngAfterViewInit() {
    console.debug('ngAfterViewInit()')
  }

  onEventTypeChange(type: any) {
    console.debug('onEventTypeChange()', type)

  }

  onCreateEvent() {
    console.debug('onCreateEvent')

    let m: OracleServerMessage
    switch (this.newEventType) {
      case this.EventType.ENUM:
        const outcomes = this.outcomes.split(',')
        outcomes.forEach(o => o.trim())
        if (outcomes.length === 0 || outcomes.length === 1) {
          throw Error('onCreateEvent must have outcomes')
        }
        m = getMessageBody(MessageType.createenumevent, [this.newEventName, this.maturationTime, outcomes])
        break;
      case EventType.NUMERIC:
        m = getMessageBody(MessageType.createnumericevent, [this.newEventName, this.maturationTime, this.minValue, this.maxValue, this.unit, this.precision])
        break;
      case EventType.DIGIT_DECOMP:
        m = getMessageBody(MessageType.createdigitdecompevent, [this.newEventName, this.maturationTimeSeconds, this.base, this.signed, this.numdigits, this.unit, this.precision])
        break;
      default:
        throw Error('onCreateEvent unknown newEventType: ' + this.newEventType)
    }
    if (m !== undefined) {
      this.messageService.sendMessage(m).subscribe()
    }
  }

  onClose() {
    console.debug('onClose()')
    this.close.next()
  }

}

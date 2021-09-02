import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { MessageService } from '~service/message.service';
import { MessageType } from '~type/oracle-server-types';
import { getMessageBody } from '~util/message-util';


@Component({
  selector: 'app-sign-message',
  templateUrl: './sign-message.component.html',
  styleUrls: ['./sign-message.component.scss']
})
export class SignMessageComponent implements OnInit {

  @Output() close: EventEmitter<void> = new EventEmitter()

  form: FormGroup
  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  signMessageInput = ''
  signedMessage = ''

  constructor(private formBuilder: FormBuilder, private messageService: MessageService) { }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      signMessageInput: [null]
    })
  }

  onClose() {
    console.debug('onClose()')
    this.close.next()
  }

  onSignMessage() {
    console.debug('onSignMessage', this.signMessageInput)
    const m = getMessageBody(MessageType.signmessage, [this.signMessageInput])
    this.messageService.sendMessage(m).subscribe(result => {
      if (result.result) {
        this.signedMessage = result.result
      }
    })
  }

}

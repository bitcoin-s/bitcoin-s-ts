import { Component, EventEmitter, OnInit, Output } from '@angular/core'

import { MessageService } from '~service/message.service'

import { MessageType } from '~type/oracle-server-types'

import { getMessageBody } from '~util/oracle-server-util'


@Component({
  selector: 'app-sign-message',
  templateUrl: './sign-message.component.html',
  styleUrls: ['./sign-message.component.scss']
})
export class SignMessageComponent implements OnInit {

  @Output() close: EventEmitter<void> = new EventEmitter()

  signMessageInput = ''
  signedMessage = ''

  constructor(private messageService: MessageService) { }

  ngOnInit(): void { }

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

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core'

import { MessageService } from '~service/message.service'
import { CoreMessageType } from '~type/wallet-server-types'
import { getMessageBody } from '~util/wallet-server-util'


@Component({
  selector: 'app-build-accept-offer',
  templateUrl: './build-accept-offer.component.html',
  styleUrls: ['./build-accept-offer.component.scss']
})
export class BuildAcceptOfferComponent implements OnInit {

  @ViewChild('buildOfferInput') buildOfferInput: ElementRef;
  @ViewChild('acceptOfferInput') acceptOfferInput: ElementRef;

  constructor(private messageService: MessageService) { }

  ngOnInit(): void {
  }

  onBuildOfferPaste(event: ClipboardEvent) {
    console.debug('onBuildOfferPaste()', event)
    const clipboardData = event.clipboardData
    if (clipboardData) {
      const trimmedPastedText = clipboardData.getData('text').trim()
      console.debug('trimmedPastedText:', trimmedPastedText)

      // Sanity check on pastedText first?

      this.onBuildOffer(trimmedPastedText)
    }
    
  }

  onBuildOfferInput(event: Event) {
    console.debug('onBuildOfferInput()', event)
    const text = this.buildOfferInput.nativeElement.value
    this.onBuildOffer(text)
  }

  onBuildOffer(hex: string) {
    console.debug('onBuildOffer()', hex)
    if (hex) {

      // Need to suppress error handling so any of these calls can fail gracefully

      this.messageService.sendMessage(getMessageBody(CoreMessageType.decodeannouncement, [hex])).subscribe(r => {
        console.debug('decodeannouncement', r)

        if (r.result) {
          this.clearBuildOfferInput()
        } else {
          // Try another
          this.messageService.sendMessage(getMessageBody(CoreMessageType.decodecontractinfo, [hex])).subscribe(r => {
            console.debug('decodecontractinfo', r)

            if (r.result) {

            } else {
              // Try another
              this.messageService.sendMessage(getMessageBody(CoreMessageType.decodeoffer, [hex])).subscribe(r => {
                console.debug('decodeoffer', r)

                if (r.result) {

                } else {
                  // No more to try
                }
              })
            }
          })
        }
      })
    }
  }

  private clearBuildOfferInput() {
    this.buildOfferInput.nativeElement.value = ''
  }

  onAcceptOfferPaste(event: ClipboardEvent) {
    console.debug('onAcceptOfferPaste()', event)
    const clipboardData = event.clipboardData
    if (clipboardData) {
      const trimmedPastedText = clipboardData.getData('text').trim()
      console.debug('patrimmedPastedTexttedText:', trimmedPastedText)
      this.onAcceptOffer(trimmedPastedText)
    }
  }

  onAcceptOffer(hex: string) {
    console.debug('onAcceptOffer()', hex)
    if (hex) {
    }
  }

  onAcceptOfferInput(event: Event) {
    console.debug('onAcceptOfferInput()', event)
    const text = this.buildOfferInput.nativeElement.value
    this.onAcceptOffer(text)
  }

  private clearAcceptOfferInput() {
    this.acceptOfferInput.nativeElement.value = ''
  }

}

import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import * as FileSaver from 'file-saver'
import { of } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { CoreMessageType, WalletMessageType } from '~type/wallet-server-types'
import { OfferWithHex } from '~type/wallet-ui-types'
import { validateHexString } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'


@Component({
  selector: 'app-dlc-file',
  templateUrl: './dlc-file.component.html',
  styleUrls: ['./dlc-file.component.scss']
})
export class DlcFileComponent implements OnInit {

  @Output() onOffer: EventEmitter<string> = new EventEmitter()
  @Output() onAccept: EventEmitter<string> = new EventEmitter()
  @Output() onSign: EventEmitter<string> = new EventEmitter()

  offerDLCInput: string = ''
  acceptedDLCInput: string = ''
  // acceptedDLCInputDisplay: string = ''

  signedDLCInput: string = ''

  executing = false

  result: string

  constructor(private messageService: MessageService, private walletStateService: WalletStateService, private dialog: MatDialog) { }

  ngOnInit(): void {
  }

  private handleFileLoad(f: File, writeTo?: string, callback?: Function) {
    const reader = new FileReader()
    reader.addEventListener("load", () => {
      console.debug('load reader', location) //, reader.result)
      if (writeTo) {
        (<any>this)[writeTo] = reader.result
      }
      if (callback) {
        callback()
      }
    })
    reader.readAsText(f)
  }

  acceptInputChange(fileInputEvent: any) {
    console.debug('acceptInputChange()', fileInputEvent, fileInputEvent.target.files[0])

    if (fileInputEvent.target.files && fileInputEvent.target.files[0]) {
      this.handleFileLoad(fileInputEvent.target.files[0], 'offerDLCInput', this.onAcceptDLC.bind(this))
    }
  }

  onAcceptDLC() {
    console.debug('onAcceptDLC()')

    if (this.offerDLCInput) {
      const offerDLC = this.offerDLCInput.trim()
      if (!offerDLC || !validateHexString(offerDLC)) {
        // TODO
        return
      }
      this.onOffer.emit(offerDLC)
    }
  }

  signInputChange(fileInputEvent: any) {
    console.debug('signInputChange()', fileInputEvent, fileInputEvent.target.files[0])

    if (fileInputEvent.target.files && fileInputEvent.target.files[0]) {
      this.handleFileLoad(fileInputEvent.target.files[0], 'acceptedDLCInput', this.onSignDLC.bind(this))
    }
  }

  onSignDLC() {
    console.debug('onSignDLC()')

    if (this.acceptedDLCInput) {
      const acceptedDLC = this.acceptedDLCInput.trim()

      if (!acceptedDLC || !validateHexString(acceptedDLC)) {
        // TODO
        return
      }

      this.executing = true
      this.messageService.sendMessage(getMessageBody(CoreMessageType.decodeaccept, [acceptedDLC]), false)
      .pipe(catchError(error => of({ result: null }))).subscribe(r => {
        console.debug('decodeaccept', r)

        if (r.result) {
          // const offer = <OfferWithHex>{ offer: r.result, hex: acceptedDLC }

        }
      })

      return

      const filename = 'Signed Accept.txt'

      this.executing = true
      this.messageService.sendMessage(getMessageBody(WalletMessageType.signdlc, [acceptedDLC])).subscribe(r => {
        console.debug('signdlc', r)

        if (r.result) {
          this.result = 'Success'

          // Save to file
          const blob = new Blob([r.result], {type: "text/plain;charset=utf-8"});
          FileSaver.saveAs(blob, filename)
          // works fine, but I'm not sure if this is decodable on the other side...

          // See https://github.com/AtomicFinance/node-dlc/blob/master/packages/messaging/lib/messages/DlcSign.ts
          // Should be able to decode at Node and map contractId to show local key data

          // Bitcoin-S equivalent functionality issue https://github.com/bitcoin-s/bitcoin-s/issues/3847

          this.walletStateService.refreshDLCStates()

          this.executing = false
        }
      })
    }
    
  }

  // onSignAcceptFromFile() {
  //   console.debug('onSignAcceptFromFile()')

  //   // TODO : Get File Path

  //   return

  //   this.messageService.sendMessage(getMessageBody(WalletMessageType.signdlcfromfile, [])).subscribe(r => {
  //     console.debug('signdlcfromfile', r)
  //   })
  // }

  broadcastInputChange(fileInputEvent: any) {
    console.debug('broadcastInputChange()', fileInputEvent, fileInputEvent.target.files[0])

    if (fileInputEvent.target.files && fileInputEvent.target.files[0]) {
      this.handleFileLoad(fileInputEvent.target.files[0], 'signedDLCInput', this.onBroadcastSignedDLC.bind(this))
    }
  }

  onBroadcastSignedDLC() {
    console.debug('onBroadcastSignedDLC()')

    // return

    if (this.signedDLCInput) {
      const signedDLCInput = this.signedDLCInput.trim()

      if (!signedDLCInput || !validateHexString(signedDLCInput)) {
        // TODO
        return
      }

      const filename = 'Broadcast Signed.txt'

      this.messageService.sendMessage(getMessageBody(WalletMessageType.adddlcsigsandbroadcast, [])).subscribe(r => {
        console.debug('adddlcsigsandbroadcast', r)

        if (r.result) {
          this.result = 'Success'

          // Save to file
          const blob = new Blob([r.result], {type: "text/plain;charset=utf-8"});
          FileSaver.saveAs(blob, filename)

          this.walletStateService.refreshDLCStates()

          this.executing = false
        }
      })
    }
    
  }

  // onBroadcastSignedDLCFromFile() {
  //   console.debug('onBroadcastSignedDLCFromFile()')

  //   // TODO : Get File Path

  //   // return

  //   this.messageService.sendMessage(getMessageBody(WalletMessageType.adddlcsigsandbroadcastfromfile, [])).subscribe(r => {
  //     console.debug('adddlcsigsandbroadcastfromfile', r)
  //   })
  // }


}

import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { of } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'

import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { CoreMessageType, DLCState } from '~type/wallet-server-types'
import { AcceptWithHex, SignWithHex } from '~type/wallet-ui-types'
import { validateHexString } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'


@Component({
  selector: 'app-dlc-file',
  templateUrl: './dlc-file.component.html',
  styleUrls: ['./dlc-file.component.scss']
})
export class DlcFileComponent implements OnInit {

  @Output() offer: EventEmitter<string> = new EventEmitter()
  @Output() accept: EventEmitter<AcceptWithHex> = new EventEmitter()
  @Output() sign: EventEmitter<SignWithHex> = new EventEmitter()

  offerDLCInput: string = ''
  acceptedDLCInput: string = ''
  signedDLCInput: string = ''

  executing = false
  result: string

  constructor(private messageService: MessageService, private walletStateService: WalletStateService, 
    private dialog: MatDialog) { }

  ngOnInit(): void {
  }

  private handleFileLoad(f: File, writeTo?: string, callback?: Function) {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      console.debug('load reader', location)
      // Store data
      if (writeTo) {
        (<any>this)[writeTo] = reader.result
      }
      // Call callback
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
      // hex will be validated elsewhere
      this.offer.emit(offerDLC)
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
        const dialog = this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'dialog.invalidHexError.title',
            content: 'dialog.invalidHexError.content',
          }
        })
        return
      }

      this.executing = true
      this.messageService.sendMessage(getMessageBody(CoreMessageType.decodeaccept, [acceptedDLC]), false)
      .pipe(catchError(error => of({ result: null }))).subscribe(r => {
        console.debug('decodeaccept', r)

        if (r.result) {
          const accept = r.result
          const acceptWithHex = <AcceptWithHex>{ accept, hex: acceptedDLC }
          this.accept.emit(acceptWithHex)
        } else {
          const dialog = this.dialog.open(ErrorDialogComponent, {
            data: {
              title: 'dialog.decodingDLCError.title',
              content: 'dialog.decodingDLCError.content',
              params: { state: DLCState.accepted },
            }
          })
        }
        this.executing = false
      })
    }
  }

  broadcastInputChange(fileInputEvent: any) {
    console.debug('broadcastInputChange()', fileInputEvent, fileInputEvent.target.files[0])

    if (fileInputEvent.target.files && fileInputEvent.target.files[0]) {
      this.handleFileLoad(fileInputEvent.target.files[0], 'signedDLCInput', this.onBroadcastSignedDLC.bind(this))
    }
  }

  onBroadcastSignedDLC() {
    console.debug('onBroadcastSignedDLC()')

    if (this.signedDLCInput) {
      const signedDLCInput = this.signedDLCInput.trim()
      if (!signedDLCInput || !validateHexString(signedDLCInput)) {
        const dialog = this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'dialog.invalidHexError.title',
            content: 'dialog.invalidHexError.content',
          }
        })
        return
      }

      this.executing = true
      this.messageService.sendMessage(getMessageBody(CoreMessageType.decodesign, [signedDLCInput]), false)
      .pipe(catchError(error => of({ result: null }))).subscribe(r => {
        console.debug('decodesign', r)

        if (r.result) {
          const sign = r.result
          const signWithHex = <SignWithHex>{ sign, hex: signedDLCInput }
          this.sign.emit(signWithHex)
        } else {
          const dialog = this.dialog.open(ErrorDialogComponent, {
            data: {
              title: 'dialog.decodingDLCError.title',
              content: 'dialog.decodingDLCError.content',
              params: { state: DLCState.signed },
            }
          })
        }
        this.executing = false
      })
    }
    
  }

}

import { Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { Observable, of, ReplaySubject, Subject } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { ErrorDialogComponent } from '~app/dialog/error/error.component'
import { CoreMessageType, DLCState } from '~type/wallet-server-types'

import { AcceptWithHex, OfferWithHex, SignWithHex } from '~type/wallet-ui-types'
import { validateHexString } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'
import { MessageService } from './message.service'
import { WalletStateService } from './wallet-state-service'


// Maybe this should just be DLCState
export enum DLCFileType {
  offer = 'offer',
  accept = 'accept',
  sign = 'sign',
}

@Injectable({ providedIn: 'root' })
export class DLCFileService {

  private offer: Subject<OfferWithHex|null> = new ReplaySubject()
  offer$: Observable<OfferWithHex|null>
  clearOffer() { this.offer.next(null) }

  private accept: Subject<AcceptWithHex|null> = new ReplaySubject()
  accept$: Observable<AcceptWithHex|null>
  clearAccept() { this.accept.next(null) }

  private sign: Subject<SignWithHex|null> = new ReplaySubject()
  sign$: Observable<SignWithHex|null>
  clearSign() { this.sign.next(null) }

  // File data that has been loaded
  tempFile: string|null

  executing = false

  constructor(private dialog: MatDialog,
    private messageService: MessageService, public walletStateService: WalletStateService) {
      this.offer$ = this.offer.asObservable()
      this.accept$ = this.accept.asObservable()
      this.sign$ = this.sign.asObservable()
    }

  private handleFileLoad(f: File, fileType: DLCFileType) {
    const reader = new FileReader()
    // Load file
    reader.addEventListener('load', () => {
      console.debug('load reader', location)
      // Store data
      const tempFile = <string>reader.result
      if (tempFile) {
        this.tempFile = tempFile.trim()
        const valid = this.validateTempFileHex()
        if (valid) {
          // Call callback
          switch (fileType) { // Use DLCState instead?
            case DLCFileType.offer:
              this.onAcceptDLC()
              break
            case DLCFileType.accept:
              this.onSignDLC()
              break
            case DLCFileType.sign:
              this.onBroadcastSignedDLC()
              break
            default:
              console.error('unknown fileType', fileType)
          }
        }
      } else {
        console.error('file was empty')
        this.tempFile = null
        // TODO : Any other state cleanup
        // TODO : File was empty dialog?
      }
    })
    reader.readAsText(f)
  }

  private validateTempFileHex() {
    let valid = true
    const dlc = this.tempFile
    if (!dlc || !validateHexString(dlc)) {
      console.error('validateTempFileHex() failed')
      const dialog = this.dialog.open(ErrorDialogComponent, {
        data: {
          title: 'dialog.invalidHexError.title',
          content: 'dialog.invalidHexError.content',
        }
      })
      valid = false
    }
    return valid
  }

  // Loads file data and calls back appropriate handler function
  onFileSelection(fileInputEvent: any, fileType: DLCFileType) {
    console.debug('onFileSelection()', fileInputEvent, fileType)

    if (fileInputEvent.target.files && fileInputEvent.target.files[0]) {
      this.handleFileLoad(fileInputEvent.target.files[0], fileType)
      // let callback
      // switch (fileType) { // Use DLCState instead?
      //   case DLCFileType.offer:
      //     callback = this.onAcceptDLC.bind(this)
      //     break;
      //   case DLCFileType.accept:
      //     callback = this.onSignDLC.bind(this)
      //     break;
      //   case DLCFileType.sign:
      //     callback = this.onBroadcastSignedDLC.bind(this)
      //     break;
      //   default:
      //     console.error('unknown fileType', fileType)
      // }
      // if (callback) {
      //   this.handleFileLoad(fileInputEvent.target.files[0], callback)
      // }
    }
  }

  onAcceptDLC() {
    console.debug('onAcceptDLC()')

    // if (this.tempFile) {
    //   // hex will be validated elsewhere
    //   this.offer.emit(this.tempFile)
    //   this.tempFile = null
    // }

    this.executing = true
    this.messageService.sendMessage(getMessageBody(CoreMessageType.decodeoffer, [this.tempFile]), false)
    .pipe(catchError(error => of({ result: null }))).subscribe(r => {
      console.debug('decodeoffer', r)
      if (r.result) {
        const offerWithHex = <OfferWithHex>{ offer: r.result, hex: this.tempFile }
        this.offer.next(offerWithHex)
        this.tempFile = null
      } else {
        const dialog = this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'dialog.decodingDLCError.title',
            content: 'dialog.decodingDLCError.content',
            params: { state: DLCState.offered },
          }
        })
      }
      this.executing = false
    })
  }

  onSignDLC() {
    console.debug('onSignDLC()')

    // if (!this.validateTempFileHex()) return

    this.executing = true
    this.messageService.sendMessage(getMessageBody(CoreMessageType.decodeaccept, [this.tempFile]), false)
    .pipe(catchError(error => of({ result: null }))).subscribe(r => {
      console.debug('decodeaccept', r)
      if (r.result) {
        const acceptWithHex = <AcceptWithHex>{ accept: r.result, hex: this.tempFile }
        this.accept.next(acceptWithHex)
        this.tempFile = null
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

  onBroadcastSignedDLC() {
    console.debug('onBroadcastSignedDLC()')

    // if (!this.validateTempFileHex()) return
  
    this.executing = true
    this.messageService.sendMessage(getMessageBody(CoreMessageType.decodesign, [this.tempFile]), false)
    .pipe(catchError(error => of({ result: null }))).subscribe(r => {
      console.debug('decodesign', r)
      if (r.result) {
        const signWithHex = <SignWithHex>{ sign: r.result, hex: this.tempFile }
        this.sign.next(signWithHex)
        this.tempFile = null
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

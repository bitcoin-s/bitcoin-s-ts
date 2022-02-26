import { Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { BehaviorSubject, forkJoin, of } from 'rxjs'
import { catchError, map, tap } from 'rxjs/operators'

import { MessageService } from '~service/message.service'

import { CoreMessageType, DLCState, IncomingOffer } from '~type/wallet-server-types'
import { OfferWithHex } from '~type/wallet-ui-types'

import { validateHexString } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'


@Injectable({ providedIn: 'root' })
export class OfferService {

  initialized: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  offers: BehaviorSubject<IncomingOffer[]> = new BehaviorSubject<IncomingOffer[]>([])
  decodedOffers: BehaviorSubject<{ [offerHash: string]: OfferWithHex }> = 
    new BehaviorSubject<{ [offerHash: string]: OfferWithHex }>({})

  constructor(private dialog: MatDialog, private messageService: MessageService) {}

  uninitialize() {
    this.initialized.next(false)
    // Could clear state
  }

  loadIncomingOffers() {
    return this.messageService.sendMessage(getMessageBody('offers-list'))
    .pipe(tap(r => {
      console.warn('offers-list', r)
      if (r.result) {
        const offers = r.result
        this.offers.next(offers)
        this.decodeOffers(offers)
      }
    }))
  }

  private decodeOffers(offers: IncomingOffer[]) {
    console.debug('decodeOffers()')
    if (offers.length === 0) {
      // No additional data to load
      this.initialized.next(true)
    }
    return forkJoin(offers.map(offer => this.decodeOffer(offer.offerTLV)))
      .subscribe((results: Array<OfferWithHex|null>) => {
        for (let i = 0; i < results.length; i++) {
          if (results[i])
           this.decodedOffers.value[offers[i].hash] = <OfferWithHex>results[i]
        }
        this.decodedOffers.next(this.decodedOffers.value)
        this.initialized.next(true)
      })
  }

  decodeOffer(offerTLV: string) {
    console.debug('decodeOffer()')
    if (!validateHexString(offerTLV)) {
      console.error('addManualOffer() validate offer hex failed')
      const dialog = this.dialog.open(ErrorDialogComponent, {
        data: {
          title: 'dialog.invalidHexError.title',
          content: 'dialog.invalidHexError.content',
        }
      })
      return of(null)
    }
    return this.messageService.sendMessage(getMessageBody(CoreMessageType.decodeoffer, [offerTLV]), false)
    .pipe(catchError(error => of({ result: null })), map(r => {
      console.debug('decodeoffer', r)
      if (r.result) {
        const offerWithHex = <OfferWithHex>{ offer: r.result, hex: offerTLV }
        return offerWithHex
      } else {
        const dialog = this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'dialog.decodingDLCError.title',
            content: 'dialog.decodingDLCError.content',
            params: { state: DLCState.offered },
          }
        })
        return null
      }
    }))
  }

  addIncomingOffer(offerTLV: string, peer: string, message: string) {
    return this.messageService.sendMessage(getMessageBody('offer-add', [offerTLV, peer, message]))
    .pipe(tap(r => {
      console.debug('offer-add', r)
      if (r.result) { // hash.hex
        
      }
    }))
  }

  removeIncomingOffer(hash: string) {
    return this.messageService.sendMessage(getMessageBody('offer-remove', [hash]))
    .pipe(tap(r => {
      console.debug('offer-remove', r)
      if (r.result) { // hash.hex
        const hash = r.result
        delete this.decodedOffers.value[hash]
        this.decodedOffers.next(this.decodedOffers.value)
      }
    }))
  }

}

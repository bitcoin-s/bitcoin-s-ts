import { Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { BehaviorSubject, forkJoin, of } from 'rxjs'
import { catchError, map, tap } from 'rxjs/operators'

import { MessageService } from '~service/message.service'

import { CoreMessageType, DLCState, IncomingOffer, WalletMessageType } from '~type/wallet-server-types'
import { OfferWithHex } from '~type/wallet-ui-types'

import { getMessageBody } from '~util/wallet-server-util'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'


@Injectable({ providedIn: 'root' })
export class OfferService {

  initialized: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  offers: BehaviorSubject<IncomingOffer[]> = new BehaviorSubject<IncomingOffer[]>([])
  decodedOffers: BehaviorSubject<{ [offerHash: string]: OfferWithHex }> = 
    new BehaviorSubject<{ [offerHash: string]: OfferWithHex }>({})

  private getOfferHashByTemporaryContractId(temporaryContractId: string): string|undefined {
    for (const hash of Object.keys(this.decodedOffers.value)) {
      if (this.decodedOffers.value[hash].offer.temporaryContractId === temporaryContractId) {
        return hash
      }
    }
    return undefined
  }

  constructor(private dialog: MatDialog, private messageService: MessageService) {}

  uninitialize() {
    this.initialized.next(false)
    this.offers.next([])
    this.decodedOffers.next({})
  }

  loadIncomingOffers() {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.offerslist))
    .pipe(tap(r => {
      // console.debug('offers-list', r)
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

  private decodeOffer(offerTLV: string) {
    // console.debug('decodeOffer()')
    return this.messageService.sendMessage(getMessageBody(CoreMessageType.decodeoffer, [offerTLV]), false)
    .pipe(catchError(error => of({ result: null })), map(r => {
      // console.debug(' decodeoffer', r)
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
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.offeradd, [offerTLV, peer, message]))
    .pipe(tap(r => {
      console.debug(' offer-add', r)
      if (r.result) { // hash.hex
        
      }
    }))
  }

  removeIncomingOffer(hash: string) {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.offerremove, [hash]))
    .pipe(tap(r => {
      console.debug(' offer-remove', r)
      if (r.result) { // hash.hex
        const hash = r.result
        delete this.decodedOffers.value[hash]
        this.decodedOffers.next(this.decodedOffers.value)
      }
    }))
  }

  removeIncomingOfferByTemporaryContractId(temporaryContractId: string) {
    const hash = this.getOfferHashByTemporaryContractId(temporaryContractId)
    if (hash) {
      this.removeIncomingOffer(hash).subscribe()
    }
  }

  sendIncomingOffer(offerTLVorTempId: string, peer: string, message: string) {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.offersend, [offerTLVorTempId, peer, message]))
    .pipe(tap(r => {
      console.debug(' offer-send', r)
      if (r.error) { // 'Cannot connect to ...onion:2862 via Tor'
        // Handling via websocket dlcoffersendfailed now
      } else if (r.result) { // hash.hex
        
      }
    }))
  }

  incomingOfferReceived(offer: IncomingOffer) {
    this.offers.value.push(offer)
    this.offers.next(this.offers.value)
    return this.decodeOffer(offer.offerTLV).subscribe(r => {
      if (r) {
        this.decodedOffers.value[offer.hash] = <OfferWithHex>r
        this.decodedOffers.next(this.decodedOffers.value)
      }
    })
  }

  incomingOfferRemoved(hash: string) {
    const index = this.offers.value.findIndex(o => o.hash === hash)
    if (index !== -1) {
      this.offers.value.splice(index, 1)
      this.offers.next(this.offers.value)
    }
    delete this.decodedOffers.value[hash]
    this.decodedOffers.next(this.decodedOffers.value)
  }

}

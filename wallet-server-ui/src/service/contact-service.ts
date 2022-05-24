import { Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { BehaviorSubject, forkJoin, of } from 'rxjs'
import { catchError, map, tap } from 'rxjs/operators'

import { MessageService } from '~service/message.service'

import { Contact, WalletMessageType } from '~type/wallet-server-types'
import { OfferWithHex } from '~type/wallet-ui-types'

import { getMessageBody } from '~util/wallet-server-util'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'


@Injectable({ providedIn: 'root' })
export class ContactService {

  initialized: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  contacts: BehaviorSubject<Contact[]> = new BehaviorSubject<Contact[]>([])

  getContact(address: string): Contact|undefined {
    return this.contacts.value.find(c => c.address === address)
  }
  getContactAlias(address: string): string {
    const contact = this.getContact(address)
    if (contact) return contact.alias
    return ''
  }

  constructor(private dialog: MatDialog, private messageService: MessageService) {}

  uninitialize() {
    this.initialized.next(false)
    // Could clear state
  }

  loadContacts() {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.contactslist))
    .pipe(tap(r => {
      // console.debug('contacts-list', r)
      if (r.result) {
        const contacts = r.result
        this.contacts.next(contacts)
        this.initialized.next(true)
      }
    }))
  }

  addContact(alias: string, address: string, memo: string) {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.contactadd, [alias, address, memo]))
    .pipe(tap(r => {
      console.debug('contact-add', r)
      if (r.result) { // "ok"
        this.contacts.value.push({ alias, address, memo })
        this.contacts.next(this.contacts.value)
      }
      // TODO : Handle error
    }))
  }

  removeContact(address: string) {
    return this.messageService.sendMessage(getMessageBody(WalletMessageType.contactremove, [address]))
    .pipe(tap(r => {
      console.debug('contact-remove', r)
      if (r.result) { // "ok"
        const i = this.contacts.value.findIndex(c => c.address === address)
        if (i !== -1) {
          this.contacts.value.splice(i, 1)
          this.contacts.next(this.contacts.value)
        }
      }
    }))
  }
  
}

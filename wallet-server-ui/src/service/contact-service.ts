import { Injectable } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { BehaviorSubject } from 'rxjs'
import { tap } from 'rxjs/operators'

import { MessageService } from '~service/message.service'

import { Contact, DLCMessageType, WalletMessageType } from '~type/wallet-server-types'

import { getMessageBody } from '~util/wallet-server-util'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'


interface ConnectionCheckType {
  success: boolean|undefined
  time: number
}

@Injectable({ providedIn: 'root' })
export class ContactService {

  initialized: BehaviorSubject<boolean> = new BehaviorSubject(false)

  contacts: BehaviorSubject<Contact[]> = new BehaviorSubject<Contact[]>([])

  connectionCheck: BehaviorSubject<{[address: string]: ConnectionCheckType}> = new BehaviorSubject({})
  setConnectionCheck(address: string, success?: boolean): void {
    this.connectionCheck.value[address] = { success, time: new Date().getTime() }
  }
  clearConnectionCheck(address: string): void {
    delete this.connectionCheck.value[address]
  }
  getLastConnectionChecked(contact: Contact): string {
    const c = this.connectionCheck.value[contact.address]
    if (c && c.time) {
      return new Date(c.time).toLocaleString()
    }
    return this.never
  }
  getConnectionChecking(contact: Contact): boolean {
    const c = this.connectionCheck.value[contact.address]
    if (c && c.success === undefined) {
      return true
    }
    return false
  }
  getConnectionStatus(contact: Contact): string {
    const c = this.connectionCheck.value[contact.address]
    if (c) {
      if (c.success === true) return 'Success' // TODO : These need to get translated
      if (c.success === false) return 'Failed'
      if (c.success === undefined) return 'Initiated'
    }
    return ''
  }

  getContact(address: string): Contact|undefined {
    return this.contacts.value.find(c => c.address === address)
  }
  getContactAlias(address: string): string {
    const contact = this.getContact(address)
    if (contact) return contact.alias
    return ''
  }

  private never: string = 'Never' // TODO : These need to get translated

  constructor(private dialog: MatDialog, private messageService: MessageService) {}

  uninitialize() {
    this.initialized.next(false)
    this.contacts.next([])
    this.connectionCheck.next({})
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
      } else if (r.error) {
        const dialog = this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'dialog.error',
            content: r.error,
          }
        })
      }
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
      } else if (r.error) {
        const dialog = this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'dialog.error',
            content: r.error,
          }
        })
      }
    }))
  }

  checkConnection(address: string) {
    return this.messageService.sendMessage(getMessageBody(DLCMessageType.checkconnection, [address]))
    .pipe(tap(r => {
      console.debug('checkconnection', r)
      if (r.error) {
        console.error('error in checkconnection')
        const dialog = this.dialog.open(ErrorDialogComponent, {
          data: {
            title: 'dialog.error',
            content: r.error,
          }
        })
        // this.connectionCheck.value[address] = { success: false, time: new Date().getTime() } // TEMP
      } else if (r.result) { // 'initiated'
        // There is no data in the immediate return
      }
    }))
  }
  
}

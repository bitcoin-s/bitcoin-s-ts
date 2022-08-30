import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms'
import { MatSort } from '@angular/material/sort'
import { MatTable, MatTableDataSource } from '@angular/material/table'
import { Subscription } from 'rxjs'

import { ContactService } from '~service/contact-service'

import { Contact } from '~type/wallet-server-types'

import { copyToClipboard, TOR_V3_ADDRESS, trimAndStripHTTPOnPaste, trimOnPaste } from '~util/utils'
import { regexValidator } from '~util/validators'

import { environment } from '~environments'

import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'


@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit, AfterViewInit, OnDestroy {

  public copyToClipboard = copyToClipboard
  public trimOnPaste = trimOnPaste
  public trimAndStripHTTPOnPaste = trimAndStripHTTPOnPaste

  debug = environment.debug

  // New Contact
  form: UntypedFormGroup
  get f() { return this.form.controls }
  set aliasValue(alias: string) { this.form.patchValue({ alias }) }
  set addressValue(address: string) { this.form.patchValue({ address }) }
  get memoValue() { return this.form.get('memo')?.value }
  set memoValue(memo: string) { this.form.patchValue({ memo }) }

  @ViewChild(MatTable) table: MatTable<Contact>
  @ViewChild(MatSort) sort: MatSort

  // Grid config
  dataSource = new MatTableDataSource(<Contact[]>[])
  displayedColumns = ['alias', 'address', 'memo', 'actions']

  selectedContact: Contact|null

  private contacts$: Subscription

  constructor(private formBuilder: UntypedFormBuilder, private dialog: MatDialog,
    public contactService: ContactService) { }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      alias: ['', [Validators.required]],
      address: ['', [Validators.required, regexValidator(TOR_V3_ADDRESS)]],
      memo: [''],
    })
  }

  ngOnDestroy(): void {
    this.contacts$.unsubscribe()
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort

    this.contacts$ = this.contactService.contacts.subscribe(_ => {
      this.dataSource.data = this.contactService.contacts.value
      this.table.renderRows()
    })
  }

  onMemoPaste(event: ClipboardEvent) {
    // Only trimOnPaste() if there is no value in the field already
    if (!this.memoValue) this.memoValue = trimOnPaste(event)
  }

  addContact() {
    const v = this.form.value
    const alias = v.alias
    const address = v.address
    const memo = v.memo

    console.debug('addContact()', alias, address, memo)

    this.contactService.addContact(alias, address, memo).subscribe()
    // May want to check for error first...
    this.clearOfferForm()
  }

  private clearOfferForm() {
    this.form.patchValue({
      alias: '',
      address: '',
      memo: ''
    })
    this.form.reset()
  }

  onRowClick(contact: Contact) {
    this.selectedContact = contact
  }

  clearSelection() {
    this.selectedContact = null
  }

  onDelete(contact: Contact) {
    console.debug('onDelete()', contact)
    const dialog = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'dialog.deleteContact.title',
        content: 'dialog.deleteContact.content',
        params: { alias: contact.alias },
        action: 'action.yes',
        showCancelButton: true,
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.contactService.removeContact(contact.address).subscribe()
      }
    })
  }

}

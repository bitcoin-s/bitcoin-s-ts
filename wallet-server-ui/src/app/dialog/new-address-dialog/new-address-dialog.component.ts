import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA } from '@angular/material/dialog'

import { copyToClipboard } from '~util/utils'


export interface NewAddressDialogContent {
  title: string
  content: string
  params: any // { key: value }
  action: string
  actionColor: string
}

@Component({
  selector: 'new-address-dialog',
  templateUrl: './new-address-dialog.component.html',
  styleUrls: ['./new-address-dialog.component.scss']
})
export class NewAddressDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: NewAddressDialogContent) { }

  copyToClipboard() {
    console.debug('copyToClipboard()', this.data.params.address)

    copyToClipboard(this.data.params.address)
  }
}

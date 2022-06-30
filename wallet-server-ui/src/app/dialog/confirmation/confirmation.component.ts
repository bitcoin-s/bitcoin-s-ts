import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';


export interface ConfirmationDialogContent {
  title: string
  content: string
  list: string[]
  params: any // { key: value }
  linksContent: string
  links: string[]
  action: string
  actionColor: string
  showCancelButton: boolean
}

@Component({
  selector: 'confirmation-dialog',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.scss']
})
export class ConfirmationDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogContent) { }
}

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';


export interface ErrorDialogContent {
  title: string
  content: string
  params: any // { key: value }
  // action: string
  class: string
}

@Component({
  selector: 'error-dialog',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: ErrorDialogContent) { }
}

import { Component, Input, OnInit } from '@angular/core';


export enum AlertType {
  error = 'error',
  warn = 'warn',
  info = 'info',
  success = 'success',
}

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements OnInit {

  @Input() type: AlertType
  @Input() message: string
  @Input() params: any
  @Input() icon: string

  public AlertType = AlertType

  constructor() { }

  ngOnInit(): void { }

}

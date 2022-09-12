import { Component, EventEmitter, OnInit, Output } from '@angular/core'


@Component({
  selector: 'app-import-export',
  templateUrl: './import-export.component.html',
  styleUrls: ['./import-export.component.scss']
})
export class ImportExportComponent implements OnInit {

  @Output() close: EventEmitter<void> = new EventEmitter()

  constructor() { }

  ngOnInit(): void {}

  onClose() {
    console.debug('onClose()')
    this.close.next()
  }

}

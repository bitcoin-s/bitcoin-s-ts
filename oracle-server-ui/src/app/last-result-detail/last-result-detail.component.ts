import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

import { MessageService } from '~service/message.service';


@Component({
  selector: 'app-last-result-detail',
  templateUrl: './last-result-detail.component.html',
  styleUrls: ['./last-result-detail.component.scss']
})
export class LastResultDetailComponent implements OnInit {

  // @Output() close: EventEmitter<void> = new EventEmitter()

  constructor(public messageService: MessageService) { }

  ngOnInit(): void {
  }

  onClose() {
    console.debug('onClose()')
  }

}

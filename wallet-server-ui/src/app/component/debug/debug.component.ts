import { Component, EventEmitter, OnInit, Output } from '@angular/core'

import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { WalletMessageType } from '~type/wallet-server-types'
import { getMessageBody } from '~util/wallet-server-util'


@Component({
  selector: 'app-debug',
  templateUrl: './debug.component.html',
  styleUrls: ['./debug.component.scss']
})
export class DebugComponent implements OnInit {

  @Output() close: EventEmitter<void> = new EventEmitter()
  @Output() rootClassName: EventEmitter<boolean> = new EventEmitter()

  constructor(private messageService: MessageService, private walletStateService: WalletStateService) { }

  ngOnInit(): void {
    
  }

  onClose() {
    console.debug('onClose()')
    this.close.next()
  }

  unreserveAllUTXOs() {
    console.debug('unreserveAllUTXOs()')

    this.messageService.sendMessage(getMessageBody(WalletMessageType.lockunspent, [true])).subscribe(r => {
      console.debug('r:', r)

      if (r.result) {
        // TODO : Dialog / message

        this.walletStateService.refreshBalances()
      }
    })
  }

  rescan() {
    console.debug('rescan()')

    // Could expose these to the user, but would need to validate
    // [0,0,0,true,true] results in infinite loop in backend
    const batchSize = null // 0
    const startBlock = null // 0
    const endBlock = null // this.walletStateService.info.blockHeight
    const force = true
    const ignoreCreationTime = false // forces full rescan regardless of wallet creation time

    this.messageService.sendMessage(getMessageBody(WalletMessageType.rescan, [batchSize, startBlock, endBlock, force, ignoreCreationTime])).subscribe(r => {
      console.debug('r:', r)

      if (r.result) { // "Rescan started."
        // TODO : Started dialog / message

        // this.walletStateService.refreshBalances()
      }
    })
  }

}

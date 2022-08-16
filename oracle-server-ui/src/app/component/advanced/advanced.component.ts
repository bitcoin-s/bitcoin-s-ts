import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import * as FileSaver from 'file-saver'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'
import { MessageService } from '~service/message.service'
import { OracleStateService } from '~service/oracle-state.service'

import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'


@Component({
  selector: 'app-advanced',
  templateUrl: './advanced.component.html',
  styleUrls: ['./advanced.component.scss']
})
export class AdvancedComponent implements OnInit {

  @Output() close: EventEmitter<void> = new EventEmitter()

  executing = false
  backupExecuting = false

  constructor(private dialog: MatDialog, private messageService: MessageService, private oracleStateService: OracleStateService) { }

  ngOnInit(): void {
  }

  onClose() {
    console.debug('onClose()')
    this.close.next()
  }

  private showDownloadError() {
    const dialog = this.dialog.open(ErrorDialogComponent, {
      data: {
        title: 'dialog.backupError.title',
        content: 'dialog.backupError.content'
      }
    })
  }

  // TODO Once backend is in place
  downloadBackup() {
    console.debug('downloadBackup()')

    // Currently not user editable
    const filename = 'krystalbull-backup.zip'

    this.executing = true
    this.backupExecuting = true
    this.messageService.downloadBackup().subscribe(blob => {
      if (!blob || (blob && blob.size === 0)) {
        console.error('downloadBackup blob was null or empty', blob)
        this.showDownloadError()
      } else {
        FileSaver.saveAs(blob, filename)
      }
      this.executing = false
      this.backupExecuting = false
    }, err => {
      this.executing = false
      this.backupExecuting = false
    })
  }

  downloadOracleServerLog() {
    console.debug('downloadOracleServerLog()')

    const filename = 'bitcoin-s.log'

    this.executing = true
    this.messageService.downloadOracleServerLog().subscribe(blob => {
      if (!blob || (blob && blob.size === 0)) {
        console.error('downloadBackup blob was null or empty', blob)
        this.showDownloadError()
      } else {
        FileSaver.saveAs(blob, filename)
      }
      this.executing = false
    })
  }

  downloadProxyLog() {
    console.debug('downloadProxyLog()')

    const filename = 'oracle-server-ui-proxy.log'

    this.executing = true
    this.messageService.downloadProxyLog().subscribe(blob => {
      if (!blob || (blob && blob.size === 0)) {
        console.error('downloadBackup blob was null or empty', blob)
        this.showDownloadError()
      } else {
        FileSaver.saveAs(blob, filename)
      }
      this.executing = false
    })
  }

  exportStakingAddressWIF() {
    console.debug('exportStakingAddressWIF()')

    this.executing = true
    this.oracleStateService.exportStakingAddress().subscribe(r => {
      console.debug('r', r)
      if (r.result) {
        const wif = <string>r.result
        const dialog = this.dialog.open(ConfirmationDialogComponent, {
          data: {
            title: 'dialog.exportStakingAddressWIF.title',
            content: 'dialog.exportStakingAddressWIF.content',
            params: { wif },
            action: 'action.close',
            showCancelButton: false,
          }
        })
      } else if (r.error) {

      }
      this.executing = false
    }, err => { this.executing = false })
  }

}

import { AfterViewInit, Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSort } from '@angular/material/sort'
import { MatTable, MatTableDataSource } from '@angular/material/table'
import { forkJoin } from 'rxjs'

import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'
import { BlockstreamService } from '~service/blockstream-service'
import { MessageService } from '~service/message.service'
import { OracleExplorerService } from '~service/oracle-explorer.service'
import { OracleStateService } from '~service/oracle-state.service'
import { OracleAnnouncementsResponse } from '~type/oracle-explorer-types'
import { MessageType, OracleEvent } from '~type/oracle-server-types'
import { BuildConfig } from '~type/proxy-server-types'
import { getMessageBody } from '~util/message-util'
import { KrystalBullImages } from '~util/ui-util'


@Component({
  selector: 'app-oracle',
  templateUrl: './oracle.component.html',
  styleUrls: ['./oracle.component.scss']
})
export class OracleComponent implements OnInit, AfterViewInit {

  @Output() showCreateEvent: EventEmitter<void> = new EventEmitter();
  @Output() showEventDetail: EventEmitter<OracleEvent> = new EventEmitter();
  @Output() showConfiguration: EventEmitter<void> = new EventEmitter();
  @Output() showSignMessage: EventEmitter<void> = new EventEmitter();

  public KrystalBullImages = KrystalBullImages

  hideRawButtons = true

  @ViewChild(MatTable) table: MatTable<OracleEvent>
  @ViewChild(MatSort) sort: MatSort

  bullIndex = 0
  bullSrc = KrystalBullImages[0]

  // Oracle Info
  oracleName = ''
  oracleNameReadOnly = true // don't allow editing until checking for a name
  publicKey = ''
  stakingAddress = ''
  stakedAmount = ''

  buildConfig: BuildConfig
  oracleServerVersion = ''

  // Grid config
  dataSource = new MatTableDataSource(<OracleEvent[]>[])
  displayedColumns = ['eventName','announcement', 'outcomes', 'maturationTime', 'signedOutcome']

  constructor(public dialog: MatDialog, public oracleState: OracleStateService, private messageService: MessageService, 
    public oracleExplorerService: OracleExplorerService, private blockstreamService: BlockstreamService) { }

  ngOnInit() {
    this.oracleExplorerService.oracleName.subscribe(name => {
      this.oracleName = name
    })
    this.oracleExplorerService.serverOracleName.subscribe(serverSet => {
      this.oracleNameReadOnly = serverSet
    })
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;

    this.messageService.getOracleServerVersion().subscribe(result => {
      console.debug('messageService.getOracleServerVersion()', result)
      if (result && result.result) {
        this.oracleServerVersion = result.result.version
      }
    })

    this.onGetPublicKey()
    this.onGetStakingAddress()

    this.oracleState.flatEvents.subscribe(_ => {
      this.dataSource.data = this.oracleState.flatEvents.value
      this.table.renderRows()
    })

    this.oracleState.getAllEvents().subscribe()

    this.messageService.buildConfig().subscribe(result => {
      console.debug('messageService.buildConfig()', result)
      if (result) {
        result.dateString = new Date(result.committedOn * 1000).toLocaleDateString()
        this.buildConfig = result
      }
    })
  }

  /** Oracle Explorer handlers */

  listAnnouncements() {
    this.oracleExplorerService.listAnnouncements().subscribe(result => {
      console.debug('listAnnouncements()', result)
      if (result) {
        // TODO
      }
    })
  }

  private getOracleName(publicKey: string) {
    this.oracleExplorerService.getLocalOracleName(publicKey).subscribe(result => {
      console.debug('getOracleName()', result)
    })
  }

  /** Blockstream handlers */

  getStakingBalance(address: string) {
    this.blockstreamService.getBalance(address).subscribe(result => {
      this.stakedAmount = this.blockstreamService.balanceFromGetBalance(result).toString()
    })
  }

  /** Debug button handlers */

  onOracleHeartbeat() {
    console.debug('onOracleHeartbeateartbeat')
    this.messageService.oracleHeartbeat().subscribe(result => {
      console.debug('oracle heartbeat:', result)
    })
  }

  onGetPublicKey() {
    console.debug('onGetPublicKey')
    this.messageService.sendMessage(getMessageBody(MessageType.getpublickey)).subscribe(result => {
      if (result.result) {
        this.publicKey = result.result
        if (!this.oracleName) {
          this.getOracleName(this.publicKey)
        }
      }
    })
  }

  onGetStakingAddress() {
    console.debug('onGetStakingAddress')
    this.messageService.sendMessage(getMessageBody(MessageType.getstakingaddress)).subscribe(result => {
      if (result.result) {
        this.stakingAddress = result.result
        this.getStakingBalance(this.stakingAddress)
      }
    })
  }

  /* UI Functions */

  onImageClick() {
    console.debug('onImageClick()')
    let t = this.bullIndex + 1
    if (t === KrystalBullImages.length) t = 0
    this.bullIndex = t
  }

  onOracleNameEnter(event: any) {
    event.target.blur()
    return false
  }

  onOracleName() {
    console.debug('onOracleName()', this.oracleName)
    if (this.oracleName && this.oracleName !== this.oracleExplorerService.oracleName.value) {
      const dialog = this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: 'dialog.confirmOracleName.title',
          content: 'dialog.confirmOracleName.content',
          params: { oracleName: this.oracleName },
          action: 'dialog.confirmOracleName.action',
        }
      }).afterClosed().subscribe(result => {
        console.debug(' set oracleName:', result)
        if (result) {
          // TODO : Test how Oracle Explorer handles uniqueness
          this.oracleExplorerService.setOracleName(this.oracleName)
        } else {
          this.oracleName = this.oracleExplorerService.oracleName.value
        }
      })
    } else {
      this.oracleName = this.oracleExplorerService.oracleName.value
    }
  }

  onShowCreateEvent() {
    console.debug('onShowCreateEvent()')
    this.showCreateEvent.next()
  }

  onShowConfiguration() {
    console.debug('onShowConfiguration()')
    this.showConfiguration.next()
  }

  onShowSignMessage() {
    console.debug('onShowSignMessage()')
    this.showSignMessage.next()
  }

  onShowDebug() {
    console.debug('onShowDebug()')
    this.hideRawButtons = !this.hideRawButtons
  }

  formatOutcomes(outcomes: [any]): string {
    if (outcomes && outcomes.length > 0) {
      const head = outcomes[0]
      if (Array.isArray(head) && head.length === 2) {
        // numeric outcomes
        const signed = head[0] === '+' && head[1] === '-'
        const exp = signed ? outcomes.length - 1 : outcomes.length
        const outcome = (2 ** exp) - 1
        return signed ? '-' + outcome + '..' + outcome : '0..' + outcome
      } else {
        // enum and all other outcomes
        return '' + outcomes
      }
    } else {
      return ''
    }
  }

  onRowClick(event: OracleEvent) {
    console.debug('onRowClick()', event)
    this.showEventDetail.next(event)
  }

  onAnnouncementClick(event: OracleEvent) {
    console.debug('onAnnouncementClick()', event)
    if (!this.oracleState.announcements.value[event.eventName]) {
      this.oracleExplorerService.createAnnouncement(event).subscribe(result => {
        if (result) {
          this.oracleState.getAnnouncement(event).subscribe() // Update oracleState
        }
      })
    } else {
      console.warn('Oracle Explorer announcement already exists for', event)
    }
  }

  onAnnouncementLinkClick(event: OracleEvent) {
    console.debug('onAnnouncementLinkClick()', event)
    const url = `https://${this.oracleExplorerService.oracleExplorer.value.host}/announcement/${event.announcementTLVsha256}`
    window.open(url, '_blank')
  }

  onAnnounceOutcome(event: OracleEvent) {
    console.debug('onAnnounceOutcome()', event)
    this.oracleExplorerService.createAttestations(event).subscribe(result => {
      if (result) {
        this.oracleState.getAnnouncement(event).subscribe() // Update oracleState
      }
    })
  }

}

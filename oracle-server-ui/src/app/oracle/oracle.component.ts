import { AfterViewInit, Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatSort } from '@angular/material/sort'
import { MatTable, MatTableDataSource } from '@angular/material/table'

import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'

import { BlockstreamService } from '~service/blockstream-service'
import { MessageService } from '~service/message.service'
import { OracleExplorerService } from '~service/oracle-explorer.service'
import { OracleStateService } from '~service/oracle-state.service'

import { OracleAnnouncement } from '~type/oracle-server-types'
import { BuildConfig } from '~type/proxy-server-types'

import { formatOutcomes } from '~util/oracle-server-util'
import { KrystalBullImages } from '~util/ui-util'


@Component({
  selector: 'app-oracle',
  templateUrl: './oracle.component.html',
  styleUrls: ['./oracle.component.scss']
})
export class OracleComponent implements OnInit, AfterViewInit {

  @Output() showCreateAnnouncement: EventEmitter<void> = new EventEmitter();
  @Output() showAnnouncementDetail: EventEmitter<OracleAnnouncement> = new EventEmitter();
  @Output() showConfiguration: EventEmitter<void> = new EventEmitter();
  @Output() showSignMessage: EventEmitter<void> = new EventEmitter();

  public KrystalBullImages = KrystalBullImages
  public formatOutcomes = formatOutcomes

  hideRawButtons = true

  @ViewChild(MatTable) table: MatTable<OracleAnnouncement>
  @ViewChild(MatSort) sort: MatSort

  bullIndex = 0
  bullSrc = KrystalBullImages[0]

  // Oracle Info
  oracleName = ''
  oracleNameReadOnly = true // don't allow editing until checking for a name

  serverVersion = ''
  buildConfig: BuildConfig

  // Grid config
  dataSource = new MatTableDataSource(<OracleAnnouncement[]>[])
  displayedColumns = ['eventName','announcement', 'outcomes', 'maturationTime', 'signedOutcome']

  loading = true

  constructor(public dialog: MatDialog, public oracleState: OracleStateService, private messageService: MessageService, 
    public oracleExplorerService: OracleExplorerService, private blockstreamService: BlockstreamService) { }

  ngOnInit() {
    this.oracleExplorerService.oracleName.subscribe(name => {
      this.oracleName = name
    })
    this.oracleExplorerService.serverOracleName.subscribe(serverSet => {
      this.oracleNameReadOnly = serverSet
    })
    this.oracleState.announcementsReceived.subscribe(received => {
      console.debug('announcementsReceived', received)
      this.loading = !received
    })

    this.messageService.getServerVersion().subscribe(result => {
      if (result && result.result) {
        this.serverVersion = result.result.version
      }
    })
    this.messageService.buildConfig().subscribe(result => {
      if (result) {
        result.dateString = new Date(result.committedOn * 1000).toLocaleDateString()
        this.buildConfig = result
      }
    })
    this.oracleState.getAllAnnouncements().subscribe(_ => {
      console.debug('initial getAllAnnouncements() complete')
    })
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;

    this.oracleState.flatAnnouncements.subscribe(_ => {
      this.dataSource.data = this.oracleState.flatAnnouncements.value
      this.table.renderRows()
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

  /** Debug button handlers */

  onOracleHeartbeat() {
    console.debug('onOracleHeartbeateartbeat')
    this.messageService.oracleHeartbeat().subscribe(result => {
      console.debug('oracle heartbeat:', result)
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

  onShowCreateAnnouncement() {
    console.debug('onShowCreateAnnouncement()')
    this.showCreateAnnouncement.next()
  }

  onRefreshAnnouncements() {
    console.debug('onRefreshAnnouncements()')
    this.loading = true
    this.oracleState.getAllAnnouncements().subscribe()
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

  onRowClick(event: OracleAnnouncement) {
    console.debug('onRowClick()', event)
    this.showAnnouncementDetail.next(event)
  }

  onAnnouncementClick(event: OracleAnnouncement) {
    console.debug('onAnnouncementClick()', event)
    if (!this.oracleState.oeAnnouncements.value[event.eventName]) {
      this.oracleExplorerService.createAnnouncement(event).subscribe(result => {
        if (result) {
          this.oracleState.getAnnouncement(event).subscribe() // Update oracleState
        }
      })
    } else {
      console.warn('Oracle Explorer announcement already exists for', event)
    }
  }

  onAnnouncementLinkClick(a: OracleAnnouncement) {
    console.debug('onAnnouncementLinkClick()', a)
    this.oracleExplorerService.openAnnouncementTab(a)
  }

  onAnnounceOutcome(event: OracleAnnouncement) {
    console.debug('onAnnounceOutcome()', event)
    this.oracleExplorerService.createAttestations(event).subscribe(result => {
      if (result) {
        this.oracleState.getAnnouncement(event).subscribe() // Update oracleState
      }
    })
  }

}

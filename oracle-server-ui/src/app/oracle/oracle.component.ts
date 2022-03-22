import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatDrawer } from '@angular/material/sidenav'
import { MatSort } from '@angular/material/sort'
import { MatTable, MatTableDataSource } from '@angular/material/table'
import { of } from 'rxjs'
import { catchError } from 'rxjs/operators'

import { ConfirmationDialogComponent } from '~app/dialog/confirmation/confirmation.component'
import { NewAnnouncementComponent } from '~app/new-announcement/new-announcement.component'

import { BlockstreamService } from '~service/blockstream-service'
import { MessageService } from '~service/message.service'
import { OracleExplorerService } from '~service/oracle-explorer.service'
import { OracleStateService } from '~service/oracle-state.service'

import { OracleAnnouncement } from '~type/oracle-server-types'

import { formatOutcomes } from '~util/oracle-server-util'
import { KrystalBullImages } from '~util/ui-util'


@Component({
  selector: 'app-oracle',
  templateUrl: './oracle.component.html',
  styleUrls: ['./oracle.component.scss']
})
export class OracleComponent implements OnInit, AfterViewInit {

  public KrystalBullImages = KrystalBullImages
  public formatOutcomes = formatOutcomes

  @ViewChild('leftDrawer') leftDrawer: MatDrawer
  @ViewChild('rightDrawer') rightDrawer: MatDrawer
  @ViewChild('newAnnouncement') newAnnouncement: NewAnnouncementComponent

  @ViewChild(MatTable) table: MatTable<OracleAnnouncement>
  @ViewChild(MatSort) sort: MatSort

  // Left side
  showNewAnnouncement = false
  // Right side
  showAnnouncementDetail = false

  detailAnnouncement: OracleAnnouncement|undefined

  hideRawButtons = true

  bullIndex = 0
  bullSrc = KrystalBullImages[0]

  // Oracle Info
  oracleName = ''
  oracleNameReadOnly = true // don't allow editing until checking for a name

  // Grid config
  dataSource = new MatTableDataSource(<OracleAnnouncement[]>[])
  displayedColumns = ['eventName','announcement', 'outcomes', 'maturationTime', 'signedOutcome']
  selectedAnnouncement: OracleAnnouncement

  loading = false

  constructor(public dialog: MatDialog, public oracleState: OracleStateService, private messageService: MessageService, 
    public oracleExplorerService: OracleExplorerService, private blockstreamService: BlockstreamService) { }

  ngOnInit() {
    this.oracleExplorerService.oracleName.subscribe(name => {
      this.oracleName = name
    })
    this.oracleExplorerService.serverOracleName.subscribe(serverSet => {
      this.oracleNameReadOnly = serverSet
    })
    this.onRefreshAnnouncements()
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;

    this.oracleState.flatAnnouncements.subscribe(_ => {
      this.dataSource.data = this.oracleState.flatAnnouncements.value
      this.table.renderRows()
    })
  }

  closeLeftDrawer() {
    console.debug('closeLeftDrawer()')
    this.leftDrawer.close()
    this.hideLeftDrawerItems()
  }

  private hideLeftDrawerItems() {
    this.showNewAnnouncement = false
  }

  closeRightDrawer() {
    console.debug('closeRightDrawer()')
    this.rightDrawer.close()
    this.hideRightDrawerItems()
  }

  private hideRightDrawerItems() {
    this.showAnnouncementDetail = false

    this.detailAnnouncement = undefined
  }

  onShowCreateAnnouncement() {
    console.debug('onShowCreateAnnouncement()')
    if (this.leftDrawer.opened && this.showNewAnnouncement) {
      return
    }
    this.hideLeftDrawerItems()
    this.showNewAnnouncement = true
    this.leftDrawer.open()
  }

  onShowAnnouncementDetail(announcement: OracleAnnouncement) {
    console.debug('onShowAnnouncementDetail()', announcement, 'detailEvent', this.detailAnnouncement)

    if (!announcement || this.detailAnnouncement === announcement) {
      this.rightDrawer.close()
      this.detailAnnouncement = undefined
    } else {
      this.hideRightDrawerItems()
      this.detailAnnouncement = announcement
      this.showAnnouncementDetail = true
      this.rightDrawer.open()
    }
  }

  backdropClick() {
    console.debug('backdropClick()')
    this.detailAnnouncement = undefined
    if (this.newAnnouncement)
      this.newAnnouncement.reset()
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
    this.messageService.oracleHeartbeat()
      .pipe(catchError(e => of({success: false})))
      .subscribe(result => {
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

  onRefreshAnnouncements() {
    console.debug('onRefreshAnnouncements()')
    this.loading = true
    this.oracleState.getAllAnnouncements().subscribe(_ => {
      this.loading = false
    })
  }

  onShowDebug() {
    console.debug('onShowDebug()')
    this.hideRawButtons = !this.hideRawButtons
  }

  onRowClick(a: OracleAnnouncement) {
    console.debug('onRowClick()', a)
    this.onShowAnnouncementDetail(a)
  }

  onAnnouncementClick(a: OracleAnnouncement) {
    console.debug('onAnnouncementClick()', a)
    if (!this.oracleState.oeAnnouncements.value[a.eventName]) {
      this.oracleExplorerService.createAnnouncement(a).subscribe(result => {
        if (result && result.result) {
          this.oracleState.getOEAnnouncement(a).subscribe() // Update oracleState
        }
      })
    } else {
      console.warn('Oracle Explorer announcement already exists for', a)
    }
  }

  onAnnouncementLinkClick(a: OracleAnnouncement) {
    console.debug('onAnnouncementLinkClick()', a)
    this.oracleExplorerService.openAnnouncementTab(a)
  }

  onAnnounceOutcome(a: OracleAnnouncement) {
    console.debug('onAnnounceOutcome()', a)
    this.oracleExplorerService.createAttestations(a).subscribe(result => {
      if (result && result.result) {
        this.oracleState.getOEAnnouncement(a).subscribe() // Update oracleState
      }
    })
  }

}

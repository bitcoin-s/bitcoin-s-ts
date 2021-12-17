import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatDrawer } from '@angular/material/sidenav'
import { MatSort, MatSortable } from '@angular/material/sort'
import { MatTable, MatTableDataSource } from '@angular/material/table'
import { Subscription } from 'rxjs'

import { DLCFileService } from '~service/dlc-file.service'
import { WalletStateService } from '~service/wallet-state-service'

import { ContractInfo, DLCContract } from '~type/wallet-server-types'
import { AcceptWithHex, SignWithHex } from '~type/wallet-ui-types'

import { copyToClipboard, formatISODate, formatNumber, formatPercent, formatShortHex } from '~util/utils'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'


export type DLCContractInfo = { dlc: DLCContract, contractInfo: ContractInfo }

// const DEFAULT_SORT = <MatSortable>{ id: 'lastUpdated', start: 'desc'}

@Component({
  selector: 'app-contracts',
  templateUrl: './contracts.component.html',
  styleUrls: ['./contracts.component.scss']
})
export class ContractsComponent implements OnInit, AfterViewInit, OnDestroy {

  public copyToClipboard = copyToClipboard
  public formatNumber = formatNumber
  public formatISODate = formatISODate
  public formatPercent = formatPercent
  public formatShortHex = formatShortHex

  @ViewChild(MatTable) table: MatTable<DLCContract>
  @ViewChild(MatSort) sort: MatSort
  @ViewChild('rightDrawer') rightDrawer: MatDrawer

  @Input() clearSelection() {
    console.debug('clearSelection()')
    this.selectedDLCContract = <DLCContract><unknown>null
  }
  @Output() selectedDLC: EventEmitter<DLCContractInfo> = new EventEmitter()

  // Grid config
  dataSource = new MatTableDataSource(<DLCContract[]>[])
  displayedColumns = ['eventId', 'contractId', 'state', 'realizedPNL', 'rateOfReturn', 
    'collateral', 'counterpartyCollateral', 'totalCollateral', 'lastUpdated']

  selectedDLCContract: DLCContract|null
  selectedDLCContractInfo: ContractInfo|null
  selectedAccept: AcceptWithHex|null
  selectedSign: SignWithHex|null

  contractDetailsVisible = false

  getContractInfo(dlcId: string) {
    return this.walletStateService.contractInfos.value[dlcId]
  }

  getContractId(dlcId: string) {
    const dlc = this.walletStateService.dlcs.value.find(d => d.dlcId === dlcId)
    if (dlc) return dlc.contractId
    return null
  }

  private dlc$: Subscription
  private acceptSub: Subscription
  private signSub: Subscription

  constructor(public walletStateService: WalletStateService, private dlcFileService: DLCFileService,
    private dialog: MatDialog) { }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.dlc$.unsubscribe()
    this.acceptSub.unsubscribe()
    this.signSub.unsubscribe()
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort

    this.dlc$ = this.walletStateService.dlcs.subscribe(_ => {
      this.dataSource.data = this.walletStateService.dlcs.value
      this.table.renderRows()
    })

    this.acceptSub = this.dlcFileService.accept$.subscribe(accept => {
      if (accept) {
        console.debug('contracts on accept', accept)
        const dlc = this.walletStateService.dlcs.value.find(d => d.tempContractId === accept.accept.temporaryContractId)
        if (dlc) {
          this.selectedAccept = accept
          this.onRowClick(dlc)
        } else {
          this.onDLCNotFound()
        }
        this.dlcFileService.clearAccept()
      }
    })
    this.signSub = this.dlcFileService.sign$.subscribe(sign => {
      if (sign) {
        console.debug('contracts on sign', sign)
        const dlc = this.walletStateService.dlcs.value.find(d => d.contractId === sign.sign.contractId)
        if (dlc) {
          this.selectedSign = sign
          this.onRowClick(dlc)
        } else {
          this.onDLCNotFound()
        }
        this.dlcFileService.clearSign()
      }
    })
  }

  private onDLCNotFound() {
    console.error('could not find matching dlc contract')
    const dialog = this.dialog.open(ErrorDialogComponent, {
      data: {
        title: 'dialog.dlcNotFound.title',
        content: 'dialog.dlcNotFound.content',
      }
    })
  }

  // TODO : Reset focused item post-refresh
  onRefresh() {
    console.debug('onRefresh()')
    // Force update DLC list
    this.walletStateService.refreshDLCStates()
  }

  onRowClick(dlcContract: DLCContract) {
    console.debug('onRowClick()', dlcContract, this.walletStateService.contractInfos.value[dlcContract.dlcId])

    this.selectedDLCContract = dlcContract
    this.selectedDLCContractInfo = this.walletStateService.contractInfos.value[dlcContract.dlcId]
    this.selectedDLC.emit(<DLCContractInfo>{
      dlc: dlcContract,
      contractInfo: this.selectedDLCContractInfo,
    })

    this.contractDetailsVisible = true
    this.rightDrawer.open()
  }

  rightDrawerOpened(opened: boolean) {
    console.debug('rightDrawerOpened()', opened)
    // Clean up state on close
    if (!opened) {
      this.contractDetailsVisible = false
    }
  }

}

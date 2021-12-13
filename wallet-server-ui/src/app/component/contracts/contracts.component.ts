import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core'
import { MatDrawer } from '@angular/material/sidenav'
import { MatSort, MatSortable } from '@angular/material/sort'
import { MatTable, MatTableDataSource } from '@angular/material/table'
import { Subscription } from 'rxjs'

import { WalletStateService } from '~service/wallet-state-service'
import { ContractInfo, DLCContract } from '~type/wallet-server-types'
import { AcceptWithHex, SignWithHex } from '~type/wallet-ui-types'

import { copyToClipboard, formatISODate, formatNumber, formatPercent, formatShortHex } from '~util/utils'


export type DLCContractInfo = { dlc: DLCContract, contractInfo: ContractInfo }

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

  constructor(public walletStateService: WalletStateService) { }

  ngOnInit(): void {
    
  }

  ngOnDestroy(): void {
    this.dlc$.unsubscribe()
  }

  ngAfterViewInit() {
    // Set default sort
    this.sort.sort(<MatSortable>{ id: 'lastUpdated', start: 'desc'})
    this.dataSource.sort = this.sort;

    this.dlc$ = this.walletStateService.dlcs.subscribe(_ => {
      this.dataSource.data = this.walletStateService.dlcs.value
      this.table.renderRows()
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

import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core'
import { MatSort, MatSortable } from '@angular/material/sort'
import { MatTable, MatTableDataSource } from '@angular/material/table'

import { WalletStateService } from '~service/wallet-state-service'
import { ContractInfo, DLCContract } from '~type/wallet-server-types'

import { formatISODate, formatPercent, formatShortHex } from '~util/utils'


export type DLCContractInfo = { dlc: DLCContract, contractInfo: ContractInfo }

@Component({
  selector: 'app-contracts',
  templateUrl: './contracts.component.html',
  styleUrls: ['./contracts.component.scss']
})
export class ContractsComponent implements OnInit, AfterViewInit {

  public formatISODate = formatISODate
  public formatPercent = formatPercent
  public formatShortHex = formatShortHex

  @ViewChild(MatTable) table: MatTable<DLCContract>
  @ViewChild(MatSort) sort: MatSort

  @Input() clearSelection() {
    console.debug('clearSelection()')
    this.selectedDLCContract = <DLCContract><unknown>null
  }
  @Output() selectedDLC: EventEmitter<DLCContractInfo> = new EventEmitter()

  // Grid config
  dataSource = new MatTableDataSource(<DLCContract[]>[])
  displayedColumns = ['eventId', 'contractId', 'state', 'realizedPNL', 'rateOfReturn', 
    'collateral', 'counterpartyCollateral', 'totalCollateral', 'lastUpdated']

  selectedDLCContract: DLCContract
  // selectedContractInfo: ContractInfo

  getContractInfo(dlcId: string) {
    return this.walletStateService.contractInfos.value[dlcId]
  }

  getContractId(dlcId: string) {
    const dlc = this.walletStateService.dlcs.value.find(d => d.dlcId === dlcId)
    if (dlc) return dlc.contractId
    return null
  }

  constructor(public walletStateService: WalletStateService) { }

  ngOnInit(): void {
    
  }

  ngAfterViewInit() {
    // Set default sort
    this.sort.sort(<MatSortable>{ id: 'lastUpdated', start: 'desc'})
    this.dataSource.sort = this.sort;

    this.walletStateService.dlcs.subscribe(_ => {
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

    this.selectedDLC.emit(<DLCContractInfo>{
      dlc: dlcContract,
      contractInfo: this.walletStateService.contractInfos.value[dlcContract.dlcId],
    })

    // this.showContractDetail(dlcContract)
  }

  // showContractDetail(dlcContract: DLCContract) {
  //   console.debug('showContractDetail()', dlcContract)

  //   this.selectedContractInfo = this.walletStateService.contractInfos.value[dlcContract.dlcId]
  //   console.debug('selectedContractInfo:', this.selectedContractInfo)
  // }

  // onCloseContractDetail() {
  //   console.debug('onCloseContractDetail()')
  //   this.selectedDLC = <DLCContract><unknown>undefined
  //   this.selectedContractInfo = <ContractInfo><unknown>undefined
  // }

}

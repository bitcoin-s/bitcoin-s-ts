import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core'
import { MatSort } from '@angular/material/sort'
import { MatTable, MatTableDataSource } from '@angular/material/table'
import { BehaviorSubject } from 'rxjs'

import { WalletStateService } from '~service/wallet-state-service'
import { ContractInfo, DLCContract } from '~type/wallet-server-types'


export type DLCContractInfo = { dlc: DLCContract, contractInfo: ContractInfo }

@Component({
  selector: 'app-contracts',
  templateUrl: './contracts.component.html',
  styleUrls: ['./contracts.component.scss']
})
export class ContractsComponent implements OnInit, AfterViewInit {

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

  constructor(public walletStateService: WalletStateService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;

    this.walletStateService.dlcs.subscribe(_ => {
      this.dataSource.data = this.walletStateService.dlcs.value
      this.table.renderRows()
    })
  }

  onRowClick(dlcContract: DLCContract) {
    console.debug('onRowClick()', dlcContract)

    this.selectedDLCContract = dlcContract

    this.selectedDLC.emit(<DLCContractInfo>{
      dlc: dlcContract,
      contractInfo: this.walletStateService.contractInfos.value[dlcContract.dlcId],
    })

    // this.showContractDetail(dlcContract)
  }

  formatDate(isoDate: string) {
    return new Date(isoDate).toLocaleDateString()
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

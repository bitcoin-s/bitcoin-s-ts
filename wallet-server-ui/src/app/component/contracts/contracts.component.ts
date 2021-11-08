import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core'
import { MatSort } from '@angular/material/sort'
import { MatTable, MatTableDataSource } from '@angular/material/table'

import { WalletStateService } from '~service/wallet-state-service'
import { ContractInfo, DLCContract } from '~type/wallet-server-types'


@Component({
  selector: 'app-contracts',
  templateUrl: './contracts.component.html',
  styleUrls: ['./contracts.component.scss']
})
export class ContractsComponent implements OnInit, AfterViewInit {

  @ViewChild(MatTable) table: MatTable<DLCContract>
  @ViewChild(MatSort) sort: MatSort

  // Grid config
  dataSource = new MatTableDataSource(<DLCContract[]>[])
  displayedColumns = ['eventId', 'contractId', 'state', 'realizedPNL', 'rateOfReturn', 
    'collateral', 'counterpartyCollateral', 'totalCollateral', 'lastUpdated']

  selectedDLC: DLCContract
  selectedContractInfo: ContractInfo

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

    this.selectedDLC = dlcContract
    this.showContractDetail(dlcContract)
  }

  showContractDetail(dlcContract: DLCContract) {
    console.debug('showContractDetail()', dlcContract)

    this.selectedContractInfo = this.walletStateService.contractInfos.value[dlcContract.dlcId]
    console.debug('selectedContractInfo:', this.selectedContractInfo)
  }

  onCloseContractDetail() {
    console.debug('onCloseContractDetail()')
    this.selectedDLC = <DLCContract><unknown>undefined
    this.selectedContractInfo = <ContractInfo><unknown>undefined
  }

}

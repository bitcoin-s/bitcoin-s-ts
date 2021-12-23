import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatDrawer } from '@angular/material/sidenav'
import { MatSort, MatSortable } from '@angular/material/sort'
import { MatTable, MatTableDataSource } from '@angular/material/table'
import { ActivatedRoute, Params, Router } from '@angular/router'
import { Subscription } from 'rxjs'
import { filter } from 'rxjs/operators'

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

  private initialDLCId: string|null

  private dlc$: Subscription
  private contractInfo$: Subscription
  private acceptSub: Subscription
  private signSub: Subscription

  constructor(public walletStateService: WalletStateService, private dlcFileService: DLCFileService,
    private dialog: MatDialog, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.route.queryParams.pipe(filter(params => params.dlcId))
      .subscribe((params: Params) => {
        this.initialDLCId = params.dlcId
      })
  }

  ngOnDestroy(): void {
    this.dlc$.unsubscribe()
    this.contractInfo$.unsubscribe()
    this.acceptSub.unsubscribe()
    this.signSub.unsubscribe()
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort

    this.dlc$ = this.walletStateService.dlcs.subscribe(_ => {
      this.dataSource.data = this.walletStateService.dlcs.value
      this.table.renderRows()
      this.loadInitialDLC()
    })

    this.contractInfo$ = this.walletStateService.contractInfos.subscribe(_ => {
      this.loadInitialDLC()
    })

    this.acceptSub = this.dlcFileService.accept$.subscribe(accept => {
      if (accept) {
        console.debug('contracts on accept', accept.accept)
        const dlc = this.walletStateService.dlcs.value.find(d => d.tempContractId === accept.accept.temporaryContractId)
        if (dlc) {
          this.selectedAccept = accept
          this.onRowClick(dlc)
        } else {
          this.onDLCNotFound(accept.accept.temporaryContractId)
        }
        this.dlcFileService.clearAccept()
      }
    })
    this.signSub = this.dlcFileService.sign$.subscribe(sign => {
      if (sign) {
        console.debug('contracts on sign', sign.sign)
        const dlc = this.walletStateService.dlcs.value.find(d => d.contractId === sign.sign.contractId)
        if (dlc) {
          this.selectedSign = sign
          this.onRowClick(dlc)
        } else {
          this.onDLCNotFound(sign.sign.contractId)
        }
        this.dlcFileService.clearSign()
      }
    })
  }

  private loadInitialDLC() {
    if (this.initialDLCId && this.walletStateService.dlcs.value.length > 0 && Object.keys(this.walletStateService.contractInfos.value).length > 0) {
      console.warn('loading initial dlcId:', this.initialDLCId)
      const dlc = this.walletStateService.dlcs.value.find(d => d.dlcId === this.initialDLCId)
      if (dlc) this.onRowClick(dlc)
      else console.error('Could not find local DLC for id', this.initialDLCId)
      // Don't clear initialDLCId so future dlc$ updates will load new DLC states during Tor contract completion
      // this.initialDLCId = null 
    }
  }

  private onDLCNotFound(contractId: string) {
    console.error('could not find matching dlc contractId:', contractId)
    const dialog = this.dialog.open(ErrorDialogComponent, {
      data: {
        title: 'dialog.dlcNotFound.title',
        content: 'dialog.dlcNotFound.content',
      }
    })
  }

  // onRefresh() {
  //   console.debug('onRefresh()')
  //   this.walletStateService.loadDLCs()
  // }

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
    this.router.navigate(['/contracts'], { queryParams: { dlcId: dlcContract.dlcId }})
  }

  rightDrawerOpened(opened: boolean) {
    console.debug('rightDrawerOpened()', opened)
    // Clean up state on close
    if (!opened) {
      this.contractDetailsVisible = false
      this.selectedDLCContract = null
      this.selectedDLCContractInfo = null
      this.initialDLCId = null
      this.router.navigate(['/contracts'])
    }
  }

}

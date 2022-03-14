import { AfterViewInit, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatDrawer } from '@angular/material/sidenav'
import { MatSort } from '@angular/material/sort'
import { MatTable, MatTableDataSource } from '@angular/material/table'
import { ActivatedRoute, Params, Router } from '@angular/router'
import { Subscription } from 'rxjs'

import { DLCFileService } from '~service/dlc-file.service'
import { DLCService } from '~service/dlc-service'
import { LocalStorageService } from '~service/localstorage.service'
import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'

import { ContractInfo, DLCContract, DLCState, EnumContractDescriptor } from '~type/wallet-server-types'
import { AcceptWithHex, SignWithHex } from '~type/wallet-ui-types'

import { copyToClipboard, formatISODate, formatNumber, formatPercent, formatShortHex } from '~util/utils'

import { ErrorDialogComponent } from '~app/dialog/error/error.component'
import { DLCPayoutDialogComponent } from '~app/dialog/dlc-payload-dialog/dlc-payload-dialog.component'


export type DLCContractInfo = { dlc: DLCContract, contractInfo: ContractInfo }

const SHOW_FORWARD_BUTTON = true // Show Forward to THNDR Games button
const FORWARDED_LOCALSTORAGE_KEY = 'FORWARDED'

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

  public showForwardButton = SHOW_FORWARD_BUTTON
  forwardedMap: { [txId: string]: boolean }

  @ViewChild(MatTable) table: MatTable<DLCContract>
  @ViewChild(MatSort) sort: MatSort
  @ViewChild('rightDrawer') rightDrawer: MatDrawer

  // Grid config
  dataSource = new MatTableDataSource(<DLCContract[]>[])
  displayedColumns = ['eventId', 'flags', 'contractId', 'state', 'realizedPNL', 'rateOfReturn', 
    'totalCollateral', 'collateral', 'counterpartyCollateral', 'lastUpdated']

  private selectedDLCId: string|undefined
  selectedDLCContract: DLCContract|null
  selectedDLCContractInfo: ContractInfo|null
  selectedAccept: AcceptWithHex|null
  selectedSign: SignWithHex|null

  contractDetailsVisible = false

  getContractInfo(dlcId: string) {
    return this.dlcService.contractInfos.value[dlcId]
  }

  getContractId(dlcId: string) {
    const dlc = this.dlcService.dlcs.value.find(d => d.dlcId === dlcId)
    if (dlc) return dlc.contractId
    return null
  }

  private queryParams$: Subscription
  private dlc$: Subscription
  private contractInfo$: Subscription
  private accept$: Subscription
  private sign$: Subscription

  constructor(public walletStateService: WalletStateService, private dlcService: DLCService, private dlcFileService: DLCFileService,
    private dialog: MatDialog, private route: ActivatedRoute, private router: Router,
    private messageService: MessageService, private localStorageService: LocalStorageService) {
      this.forwardedMap = this.localStorageService.getObject(FORWARDED_LOCALSTORAGE_KEY) || {}
      console.debug('forwardedMap:', this.forwardedMap)
    }

  ngOnInit(): void {
    // Keeps state in sync with route changes
    this.queryParams$ = this.route.queryParams
      .subscribe((params: Params) => {
        this.selectedDLCId = params.dlcId
        // console.debug('queryParams set selectedDLCId', this.selectedDLCId)
      })
  }

  ngOnDestroy(): void {
    this.queryParams$.unsubscribe()
    this.dlc$.unsubscribe()
    this.contractInfo$.unsubscribe()
    this.accept$.unsubscribe()
    this.sign$.unsubscribe()
  }

  ngAfterViewInit() {
    this.dataSource.sortingDataAccessor = (dlc: DLCContract, property: string) => {
      switch (property) {
        case 'eventId':
          return this.getContractInfo(dlc.dlcId)?.oracleInfo?.announcement?.event?.eventId;
        default:
          return (<any>dlc)[property];
      }
    }
    this.dataSource.sort = this.sort

    this.dlc$ = this.dlcService.dlcs.subscribe(_ => {
      this.dataSource.data = this.dlcService.dlcs.value
      this.table.renderRows()
      this.loadSelectedDLC()
    })

    this.contractInfo$ = this.dlcService.contractInfos.subscribe(_ => {
      this.loadSelectedDLC()
    })

    this.accept$ = this.dlcFileService.accept$.subscribe(accept => {
      if (accept) {
        console.debug('contracts on accept', accept.accept)
        const dlc = this.dlcService.dlcs.value.find(d => d.temporaryContractId === accept.accept.temporaryContractId)
        if (dlc) {
          this.selectedAccept = accept
          this.onRowClick(dlc)
        } else {
          this.onDLCNotFound(accept.accept.temporaryContractId)
        }
        this.dlcFileService.clearAccept()
      }
    })
    this.sign$ = this.dlcFileService.sign$.subscribe(sign => {
      if (sign) {
        console.debug('contracts on sign', sign.sign)
        const dlc = this.dlcService.dlcs.value.find(d => d.contractId === sign.sign.contractId)
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

  private loadSelectedDLC() {
    if (this.selectedDLCId && 
      this.dlcService.dlcs.value.length > 0 && 
      Object.keys(this.dlcService.contractInfos.value).length > 0) {
      console.warn('loadSelectedDLC()', this.selectedDLCId)
      const dlc = this.dlcService.dlcs.value.find(d => d.dlcId === this.selectedDLCId)
      if (dlc) this.onRowClick(dlc)
      else console.error('Could not find local DLC for id', this.selectedDLCId)
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
    console.debug('onRowClick()', dlcContract, this.dlcService.contractInfos.value[dlcContract.dlcId])

    this.selectedDLCContract = dlcContract
    this.selectedDLCContractInfo = this.dlcService.contractInfos.value[dlcContract.dlcId]
    // this.selectedDLC.emit(<DLCContractInfo>{
    //   dlc: dlcContract,
    //   contractInfo: this.selectedDLCContractInfo,
    // })

    this.contractDetailsVisible = true
    this.rightDrawer.open()
    // Update queryParams and set selectedDLCId via subscription
    this.router.navigate(['/contracts'], { queryParams: { dlcId: dlcContract.dlcId }})
  }

  rightDrawerOpened(opened: boolean) {
    console.debug('rightDrawerOpened()', opened)
    // Clean up state on close
    if (!opened) {
      this.contractDetailsVisible = false
      this.selectedDLCContract = null
      this.selectedDLCContractInfo = null
      // Update queryParams and set selectedDLCId via subscription
      this.router.navigate(['/contracts'])
    }
  }

  enableContractForward(dlcContract: DLCContract) {
    return [DLCState.broadcast, DLCState.confirmed].includes(dlcContract.state)
  }

  // This only works for EnumContractDescriptors
  forwardContractDetails(dlc: DLCContract) {
    const contractInfo = this.dlcService.contractInfos.value[dlc.dlcId]
    const outcomes = { ...(<EnumContractDescriptor>contractInfo.contractDescriptor).outcomes }
    // Flip outcome values for non-initiator
    if (!dlc.isInitiator) {
      for (const key of Object.keys(outcomes)) {
        outcomes[key] = dlc.totalCollateral - outcomes[key]
      }
    }
    // Assume highest outcome value is user's bet
    let outcome = ''
    let highestOutcome = 0
    for (const key of Object.keys(outcomes)) {
      if (outcomes[key] > highestOutcome) {
        highestOutcome = outcomes[key]
        outcome = key
      }
    }
    console.debug('forwardContractDetails()', dlc, contractInfo, outcome)

    if (outcome) {
      const fundingTxId = <string>dlc.fundingTxId
      const data = {
        eventId: contractInfo.oracleInfo.announcement.event.eventId,
        outcome: outcome,
        amount: dlc.localCollateral,
        payoutAddress: dlc.payoutAddress.address,
        txId: fundingTxId,
        timestamp: dlc.lastUpdated,
        bettor: '',
        message: '',
      }

      const dialog = this.dialog.open(DLCPayoutDialogComponent, { data }).afterClosed()
      .subscribe(payload => {
        console.debug('payload:', payload)
        if (payload) {
          this.messageService.forward(payload).subscribe(r => {
            console.debug(' forwarded', payload)
            this.forwardedMap[fundingTxId] = true
            this.localStorageService.set(FORWARDED_LOCALSTORAGE_KEY, this.forwardedMap)
          })
        }
      })
    } else {
      console.error('there was an error processing outcome')
    }
  }

}

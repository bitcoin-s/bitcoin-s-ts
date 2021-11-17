import { Component, Input, OnInit } from '@angular/core'

import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { CoreMessageType, DLCMessageType, EnumContractDescriptor, EnumEventDescriptor, Event, NumericContractDescriptor, NumericEventDescriptor, PayoutFunctionPoint, WalletMessageType } from '~type/wallet-server-types'
import { AnnouncementWithHex, ContractInfoWithHex } from '~type/wallet-ui-types'
import { copyToClipboard } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'


const DEFAULT_FEE_RATE = 1 // sats/vbyte

@Component({
  selector: 'app-new-offer',
  templateUrl: './new-offer.component.html',
  styleUrls: ['./new-offer.component.scss']
})
export class NewOfferComponent implements OnInit {

  private _announcement!: AnnouncementWithHex
  @Input() set announcement (announcement: AnnouncementWithHex) {
    this._announcement = announcement
    this.event = announcement.announcement.event
    this.reset()
  }
  get announcement() { return this._announcement }

  private _contractInfo!: ContractInfoWithHex
  @Input() set contractInfo (contractInfo: ContractInfoWithHex) {
    this._contractInfo = contractInfo
    this.event = contractInfo.contractInfo.oracleInfo.announcement.event
    this.reset()
  }
  get contractInfo() { return this._contractInfo }

  private _event: Event
  set event(event: Event) {
    this._event = event
  }
  get event() { return this._event }

  get hex() {
    if (this.announcement) return this.announcement.hex
    if (this.contractInfo) return this.contractInfo.hex
    return ''
  }

  get enumEventDescriptor() {
    return <EnumEventDescriptor>this.event.descriptor
  }

  get numericEventDescriptor() {
    return <NumericEventDescriptor>this.event.descriptor
  }

  // ContractInfo

  get enumContractDescriptor() {
    return <EnumContractDescriptor>this.contractInfo.contractInfo.contractDescriptor
  }

  get numericContractDescriptor() {
    return <NumericContractDescriptor>this.contractInfo.contractInfo.contractDescriptor
  }

  // getEventDescriptor() {
  //   if (this.isEnum())
  //     return <EnumEventDescriptor>this.announcement.announcement.event.descriptor
  //   else // if (this.isNumeric())
  //     return <NumericEventDescriptor>this.announcement.announcement.event.descriptor
  // }

  private reset() {
    this.outcomeValues = {}
    this.points = []
    if (this.isEnum()) {
      // Announcement reveals outcome values only, ContractInfo comes with values
      if (this.announcement) {
        for (const label of this.enumEventDescriptor.outcomes) {
          this.outcomeValues[label] = null
        }
      } else if (this.contractInfo) {
        for (const label of Object.keys(this.enumContractDescriptor.outcomes)) {
          this.outcomeValues[label] = this.enumContractDescriptor.outcomes[label]
        }
      }
    } else if (this.isNumeric()) {
      if (this.announcement) {
        const ed = <NumericEventDescriptor>this.numericEventDescriptor // this.announcement.announcement.event.descriptor
        const nounceCount = this.event.nonces.length // numDigits
        const maxValue = Math.pow(ed.base, nounceCount) -1
        const minValue = ed.isSigned ? -maxValue : 0
  
        this.points.push(this.getPoint(<number><unknown>minValue, <number><unknown>null, 0, true))
        this.points.push(this.getPoint(<number><unknown>maxValue, <number><unknown>null, 0, true))
      } else if (this.contractInfo) {
        this.points = this.numericContractDescriptor.payoutFunction.points
      }
    }

    this.yourCollateral = <number><unknown>null
    this.feeRate = DEFAULT_FEE_RATE
    this.newOfferResult = ''
  }

  // enum
  outcomeValues: { [label: string]: number|null } = {}
  // numeric
  points: PayoutFunctionPoint[] = []

  getPoint(outcome: number, payout: number, extraPrecision: number, isEndpoint: boolean) {
    return { outcome, payout, extraPrecision, isEndpoint }
  }

  roundingIntervals: any[] = []

  getRoundingInterval(outcome: number, roundingInterval: number) {
    return { outcome, roundingInterval }
  }

  yourCollateral: number // wallet users funds in contract
  feeRate: number = DEFAULT_FEE_RATE // TODO : From estimated fee rate

  newOfferResult: string = ''

  constructor(private messageService: MessageService, private walletStateService: WalletStateService) { }

  ngOnInit(): void {
  }

  isEnum() {
    let cd: EnumEventDescriptor
    if (this.announcement) {
      cd = <EnumEventDescriptor>this.announcement.announcement.event.descriptor
    } else { // contractInfo
      cd = <EnumEventDescriptor>this.contractInfo.contractInfo.oracleInfo.announcement.event.descriptor
    }
    return cd.outcomes !== undefined
  }

  isNumeric() {
    let cd: NumericEventDescriptor
    if (this.announcement) {
      cd = <NumericEventDescriptor>this.announcement.announcement.event.descriptor
    } else {
      cd = <NumericEventDescriptor>this.contractInfo.contractInfo.oracleInfo.announcement.event.descriptor
    }
    return cd.base !== undefined
  }

  onExecute() {
    console.debug('onExecute()')

    // this.contractInfo.hex is no good, need announcement hex from this.contractInfo
    const hex = this.announcement ? this.announcement.hex : this.contractInfo.contractInfo.oracleInfo.announcement.hex

    if (this.isEnum()) {
      const payoutVals = this.buildPayoutVals()
      const maxCollateral = this.computeMaxCollateral(payoutVals)
  
      console.debug('payoutVals:', payoutVals, 'maxCollateral:', maxCollateral)
  
      this.messageService.sendMessage(getMessageBody(DLCMessageType.createcontractinfo, 
        [hex, maxCollateral, payoutVals])).subscribe(r => {
          console.debug('createcontractinfo', r)
  
          if (r.result) {
            const contractInfoTLV = <string>r.result

            // TESTING
            // this.messageService.sendMessage(getMessageBody(CoreMessageType.decodecontractinfo, [contractInfoTLV])).subscribe(r => {
            //   console.warn('new contract info:', r)
            // })

            const collateral = this.yourCollateral
            const feeRate = this.feeRate
            const now = new Date()
            const secondsSinceEpoch = Math.round(now.getTime() / 1000) // TODO : Use common-ts fn
            // TODO : What should these values be?
            const locktime = secondsSinceEpoch
            const refundLT = secondsSinceEpoch + 1000000
            this.messageService.sendMessage(getMessageBody(WalletMessageType.createdlcoffer, 
              [contractInfoTLV, collateral, feeRate, locktime, refundLT])).subscribe(r => {
              console.warn('CreateDLCOffer()', r)
              if (r.result) {
                this.newOfferResult = r.result
                this.walletStateService.refreshDLCStates()
              }
            })
          }
        })
    } else if (this.isNumeric()) {
      const numericPayoutVals = this.points
      const maxCollateral = this.computeNumericMaxCollateral(numericPayoutVals)

      console.warn('numericPayoutVals:', numericPayoutVals, 'maxCollateral:', maxCollateral, 'yourCollateral:', this.yourCollateral)
      
      // console.debug('numericAnnouncementHex:', numericAnnouncementHex, 'totalCollateral:', totalCollateral, 'numericPayoutVals:', numericPayoutVals)
      this.messageService.sendMessage(getMessageBody(DLCMessageType.createcontractinfo, 
        [hex, maxCollateral, numericPayoutVals])).subscribe(r => {
        console.warn('createcontractinfo', r)

        // Testing
        // if (r.result) {
        //   this.messageService.sendMessage(getMessageBody(CoreMessageType.decodecontractinfo, 
        //     [r.result])).subscribe(r => {
        //     console.warn('decodecontractinfo', r)
        //   })
        // }
        // return

        if (r.result) {
          const contractInfoTLV = <string>r.result
          const collateral = this.yourCollateral
          const feeRate = this.feeRate
          // TODO : Date input
          const now = new Date()
          const secondsSinceEpoch = Math.round(now.getTime() / 1000) // TODO : dateToSecondsSinceEpoch(new Date())
          const locktime = secondsSinceEpoch
          const refundLT = secondsSinceEpoch + 1000000
          this.messageService.sendMessage(getMessageBody(WalletMessageType.createdlcoffer, 
            [contractInfoTLV, collateral, feeRate, locktime, refundLT])).subscribe(r => {
            console.warn('CreateDLCOffer()', r)
            if (r.result) {
              this.newOfferResult = r.result
              this.walletStateService.refreshDLCStates()
            }
          })
        }
        
      })
    }
    
  }

  private buildPayoutVals() {
    const payoutVals = <EnumContractDescriptor>{ outcomes: { } }
    for (const label of Object.keys(this.outcomeValues)) {
      payoutVals.outcomes[label] = <number>this.outcomeValues[label]
    }
    return payoutVals
  }
  private computeMaxCollateral(payoutVals: EnumContractDescriptor) {
    let maxCollateral = 0
    for (const label of Object.keys(this.outcomeValues)) {
      maxCollateral = Math.max(maxCollateral, payoutVals.outcomes[label])
    }
    return maxCollateral
  }
  private computeNumericMaxCollateral(points: PayoutFunctionPoint[]) {
    let maxCollateral = 0
    for (const p of points) {
      maxCollateral = Math.max(maxCollateral, p.payout)
    }
    return maxCollateral
  }

  inputsValid() {
    let validInputs = true

    // Values must exist and be positive
    if (!this.yourCollateral || this.yourCollateral <= 0) {
      validInputs = false
    }
    if (!this.feeRate || this.feeRate <= 0) {
      validInputs = false
    }

    if (this.isEnum()) {
      // Values must exist and be non-negative
      for (const label of Object.keys(this.outcomeValues)) {
        if (this.outcomeValues[label] === null || <number>this.outcomeValues[label] < 0) {
          validInputs = false
          break
        }
      }
      const maxCollateral = this.computeMaxCollateral(this.buildPayoutVals())
      if (this.yourCollateral > maxCollateral) {
        validInputs = false
      }
    } else if (this.isNumeric()) {
      for (const p of this.points) {
        if (p.payout === null || p.payout < 0) {
          validInputs = false
          break
        }
        // TODO : Any Endpoint logic to check
      }

      const maxCollateral = this.computeNumericMaxCollateral(this.points)
      if (this.yourCollateral > maxCollateral) {
        validInputs = false
      }
    }

    return validInputs
  }

  onCopyResult() {
    console.debug('onCopyResult()')

    copyToClipboard(this.newOfferResult)
  }

  // Numeric

  addNewPoint() {
    console.debug('addNewPoint()')
    const newPoint = this.getPoint(<number><unknown>null, <number><unknown>null, 0, true)
    const where = this.points.length>0 ? this.points.length-1 : 0
    this.points.splice(where, 0, newPoint)
  }

  onRemovePointClicked(point: PayoutFunctionPoint) {
    console.debug('onRemovePointClicked()')
    const i = this.points.findIndex(i => i === point)
    if (i !== -1) {
      this.points.splice(i, 1)
    }
  }

  addNewRoundingInterval() {
    console.debug('addNewRoundingInterval()')

    // https://github.com/bitcoin-s/bitcoin-s/blob/aa748c012fc03e6bde6435092505e3c17a70437a/app-commons/src/main/scala/org/bitcoins/commons/serializers/Picklers.scala#L287
    // Structure like
    // { "intervals" : [{"beginInterval": 123 , "roundingMod" :456 }, ...]}
  }

}

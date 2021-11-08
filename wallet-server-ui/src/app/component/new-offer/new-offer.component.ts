import { Component, Input, OnInit } from '@angular/core'

import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { Announcement, DLCMessageType, EnumContractDescriptor, EnumEventDescriptor, NumericContractDescriptor, NumericEventDescriptor, PayoutFunctionPoint, WalletMessageType } from '~type/wallet-server-types'
import { AnnouncementWithHex } from '~type/wallet-ui-types'
import { copyToClipboard } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'

@Component({
  selector: 'app-new-offer',
  templateUrl: './new-offer.component.html',
  styleUrls: ['./new-offer.component.scss']
})
export class NewOfferComponent implements OnInit {

  private _announcement!: AnnouncementWithHex
  @Input() set announcement (announcement: AnnouncementWithHex) {
    this._announcement = announcement
    this.reset()
  }
  get announcement() { return this._announcement }

  get enumEventDescriptor() {
    return <EnumEventDescriptor>this.announcement.announcement.event.descriptor
  }

  get numericEventDescriptor() {
    return <NumericEventDescriptor>this.announcement.announcement.event.descriptor
  }

  getEventDescriptor() {
    if (this.isEnum())
      return <EnumEventDescriptor>this.announcement.announcement.event.descriptor
    else if (this.isNumeric())
      return <NumericEventDescriptor>this.announcement.announcement.event.descriptor
    return undefined
  }

  private reset() {
    this.outcomeValues = {}
    this.points = []
    if (this.isEnum()) {
      for (const label of this.enumEventDescriptor.outcomes) {
        this.outcomeValues[label] = null
      }
    } else if (this.isNumeric()) {
      // TODO : Bounds from base
      this.points.push(this.getPoint(0, <number><unknown>null, 0, true))
      this.points.push(this.getPoint(127, <number><unknown>null, 0, true))
    }
  }

  // enum
  outcomeValues: { [label: string]: number|null } = {}
  // numeric
  points: PayoutFunctionPoint[] = []

  getPoint(outcome: number, payout: number, extraPrecision: number, isEndpoint: boolean) {
    return { outcome, payout, extraPrecision, isEndpoint }
  }

  yourCollateral: number = 100000
  feeRate: number = 1

  newOfferResult: string = ''

  constructor(private messageService: MessageService, private walletStateService: WalletStateService) { }

  ngOnInit(): void {
  }

  isEnum() {
    const cd = <EnumEventDescriptor><unknown>this.announcement.announcement.event.descriptor
    return cd.outcomes !== undefined
  }

  isNumeric() {
    const cd = <NumericEventDescriptor><unknown>this.announcement.announcement.event.descriptor
    return cd.base !== undefined
  }

  onExecute() {
    console.debug('onExecute()')

    // Data : https://test.oracle.suredbits.com/announcement/63fa7885e3c6052e97956961698cde2b286dc1621544bbd8fcfbd78b2b1dbdcf
    // const enumAnnouncementHex = 'fdd824a8823cf7a3e449260f46d3d9a5bb0ddf1a367e0d3c9ce8858e16cd783392560bd1c9671314d54b6cb258bc6d85ab8fe238a27feb5a27d75323524a54d712a80b70a305b66d790ea4afe15b3fb61cae4d77f050e57b41f10f530c48a23dddbe335afdd822440001c3b0ecdaeaa3bbbd53386dec623b3a884b0ca2e2777cc62f0b6f891d9226114d614ebae0fdd80611000205546f64617908546f6d6f72726f7708546f6d6f72726f77'
    // const totalCollateral = 200003
    // const payoutVals = { outcomes: { 'Today': 200003, 'Tomorrow': 0 } }

    // TODO : Serialize outcomes
    // TODO : Compute total collateral
    if (this.isEnum()) {
      const payoutVals = this.buildPayoutVals()
      const maxCollateral = this.computeMaxCollateral(payoutVals)
  
      console.debug('payoutVals:', payoutVals, 'maxCollateral:', maxCollateral)
  
      this.messageService.sendMessage(getMessageBody(DLCMessageType.createcontractinfo, 
        [this.announcement.hex, maxCollateral, payoutVals])).subscribe(r => {
          console.debug('createcontractinfo', r)
  
          if (r.result) {
            const contractInfoTLV = <string>r.result
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

      // console.debug('numericAnnouncementHex:', numericAnnouncementHex, 'totalCollateral:', totalCollateral, 'numericPayoutVals:', numericPayoutVals)
      this.messageService.sendMessage(getMessageBody(DLCMessageType.createcontractinfo, 
        [this.announcement.hex, maxCollateral, numericPayoutVals])).subscribe(r => {
        console.warn('createcontractinfo', r)

        if (r.result) {
          const contractInfoTLV = <string>r.result
          const collateral = 100000
          const feeRate = 1
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

    if (this.isEnum()) {
      // Values must exist and be non-negative
      for (const label of Object.keys(this.outcomeValues)) {
        if (this.outcomeValues[label] === null || <number>this.outcomeValues[label] < 0) {
          validInputs = false
          break
        }
      }
      // Values must exist and be positive
      if (!this.yourCollateral || this.yourCollateral <= 0) {
        validInputs = false
      }
      if (!this.feeRate || this.feeRate <= 0) {
        validInputs = false
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
    this.points.push(this.getPoint(<number><unknown>null, <number><unknown>null, 0, true))
  }

}

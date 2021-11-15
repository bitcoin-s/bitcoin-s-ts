import { Component, Input, OnInit } from '@angular/core'

import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'
import { CoreMessageType, DLCMessageType, EnumContractDescriptor, EnumEventDescriptor, NumericEventDescriptor, PayoutFunctionPoint, WalletMessageType } from '~type/wallet-server-types'
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
    else // if (this.isNumeric())
      return <NumericEventDescriptor>this.announcement.announcement.event.descriptor
  }

  private reset() {
    this.outcomeValues = {}
    this.points = []
    if (this.isEnum()) {
      for (const label of this.enumEventDescriptor.outcomes) {
        this.outcomeValues[label] = null
      }
    } else if (this.isNumeric()) {
      const ed = <NumericEventDescriptor>this.announcement.announcement.event.descriptor
      const nounceCount = this.announcement.announcement.event.nonces.length // numDigits
      const maxValue = Math.pow(ed.base, nounceCount) -1
      const minValue = (<NumericEventDescriptor>this.announcement.announcement.event.descriptor).isSigned ? -maxValue : 0

      this.points.push(this.getPoint(<number><unknown>minValue, <number><unknown>null, 0, true))
      this.points.push(this.getPoint(<number><unknown>maxValue, <number><unknown>null, 0, true))
    }
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
  feeRate: number = 1 // TODO : From estimated fee rate

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
        [this.announcement.hex, maxCollateral, numericPayoutVals])).subscribe(r => {
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
          const feeRate = 1
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

import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MatDatepickerInput } from '@angular/material/datepicker'
import { ChartData, ChartOptions } from 'chart.js'
import { TranslateService } from '@ngx-translate/core'
import { BaseChartDirective } from 'ng2-charts'

import { ChartService } from '~service/chart.service'
import { DarkModeService } from '~service/dark-mode.service'
import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service'

import { DLCMessageType, EnumContractDescriptor, EnumEventDescriptor, Event, NumericContractDescriptor, NumericEventDescriptor, PayoutFunctionPoint, WalletMessageType } from '~type/wallet-server-types'
import { AnnouncementWithHex, ContractInfoWithHex } from '~type/wallet-ui-types'

import { copyToClipboard, datePlusDays, dateToSecondsSinceEpoch, formatDateTime } from '~util/utils'
import { getMessageBody } from '~util/wallet-server-util'

import { AlertType } from '../alert/alert.component'


const DEFAULT_DAYS_UNTIL_REFUND = 7

@Component({
  selector: 'app-new-offer',
  templateUrl: './new-offer.component.html',
  styleUrls: ['./new-offer.component.scss']
})
export class NewOfferComponent implements OnInit {

  public AlertType = AlertType
  public copyToClipboard = copyToClipboard

  @ViewChild(BaseChartDirective) chart: BaseChartDirective

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

  get enumContractDescriptor() {
    return <EnumContractDescriptor>this.contractInfo.contractInfo.contractDescriptor
  }
  get numericContractDescriptor() {
    return <NumericContractDescriptor>this.contractInfo.contractInfo.contractDescriptor
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
    } else { // contractInfo
      cd = <NumericEventDescriptor>this.contractInfo.contractInfo.oracleInfo.announcement.event.descriptor
    }
    return cd.base !== undefined
  }

  get hex() {
    if (this.announcement) return this.announcement.hex
    if (this.contractInfo) return this.contractInfo.hex
    return ''
  }

  private _event: Event
  set event(event: Event) {
    this._event = event
  }
  get event() { return this._event }

  get enumEventDescriptor() {
    return <EnumEventDescriptor>this.event.descriptor
  }
  get numericEventDescriptor() {
    return <NumericEventDescriptor>this.event.descriptor
  }

  @Output() close: EventEmitter<void> = new EventEmitter()

  form: FormGroup
  get f() { return this.form.controls }

  @ViewChild('datePicker') datePicker: MatDatepickerInput<Date>

  maturityDate: string
  minDate: Date
  units: string

  theirCollateral: number|'' = ''

  // enum
  outcomeValues: { [label: string]: number|null } = {}
  updateOutcomeValue(label: string, event: any) {
    console.debug('updateOutcomeValue()', label, event)
    let v = event.target.valueAsNumber
    // isNaN is blank case and v < 0 is invalid, handling here
    if (isNaN(v) || v < 0) v = null
    this.outcomeValues[label] = v
    this.validatePayoutInputs()
  }
  // numeric
  points: PayoutFunctionPoint[] = []
  updatePointOutcome(p: PayoutFunctionPoint, event: any) {
    console.debug('updatePointOutcome()', p, event)
    let v = event.target.valueAsNumber
    // isNaN is blank case and v < 0 is invalid, handling here
    if (isNaN(v) || v < 0) v = null
    p.outcome = v
    this.validatePayoutInputs()
    this.updateChartData()
  }
  updatePointPayout(p: PayoutFunctionPoint, event: any) {
    console.debug('updatePointPayout()', p, event)
    let v = event.target.valueAsNumber
    // isNaN is blank case and v < 0 is invalid, handling here
    if (isNaN(v) || v < 0) v = null
    p.payout = v
    this.validatePayoutInputs()
    this.updateChartData()
  }
  // roundingIntervals: any[] = []

  payoutInputsInvalid = false
  payoutValidationError: string = ''

  chartData: ChartData<'scatter'>
  chartOptions: ChartOptions

  buildChart() {
    if (this.isNumeric()) {
      this.chartData = this.chartService.getChartData()
      this.chartOptions = this.chartService.getChartOptions(this.units)
      this.updateChartData()
    }
  }
  updateChartData() {
    const data = []
    for (const p of this.points) {
      data.push({ x: p.outcome, y: p.payout })
    }
    this.chartData.datasets[0].data = data
    if (this.chart) {
      this.chart.chart?.update()
    }
  }

  executing = false
  offerCreated = false

  newOfferResult: string = ''

  private reset() {
    this.maturityDate = formatDateTime(dateToSecondsSinceEpoch(new Date(this.event.maturity)))
    this.minDate = new Date(this.event.maturity)
    if (this.isNumeric()) {
      this.units = this.numericEventDescriptor.unit
    } else {
      this.units = ''
    }
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
        const ed = this.numericEventDescriptor
        const nounceCount = this.event.nonces.length // numDigits
        const maxValue = Math.pow(ed.base, nounceCount) -1
        const minValue = ed.isSigned ? -maxValue : 0
  
        this.points.push(this.getPoint(<number><unknown>minValue, <number><unknown>null, 0, true))
        this.points.push(this.getPoint(<number><unknown>maxValue, <number><unknown>null, 0, true))
      } else if (this.contractInfo) {
        this.points = this.numericContractDescriptor.payoutFunction.points
      }
      this.buildChart()
    }

    this.newOfferResult = ''

    if (this.form) {
      this.form.patchValue({
        refundDate: datePlusDays(new Date(this.event.maturity), DEFAULT_DAYS_UNTIL_REFUND),
        yourCollateral: null,
        totalCollateral: null,
        feeRate: this.walletStateService.feeEstimate,
      })
    }
  }

  getPoint(outcome: number, payout: number, extraPrecision: number, isEndpoint: boolean) {
    return { outcome, payout, extraPrecision, isEndpoint }
  }

  getRoundingInterval(outcome: number, roundingInterval: number) {
    return { outcome, roundingInterval }
  }

  constructor(private messageService: MessageService, public walletStateService: WalletStateService,
    private formBuilder: FormBuilder, private translate: TranslateService,
    private chartService: ChartService, private darkModeService: DarkModeService) { }

  ngOnInit(): void {
    let totalCollateral = null
    if (this.contractInfo) {
      totalCollateral = this.contractInfo.contractInfo.totalCollateral
    }
    this.form = this.formBuilder.group({
      refundDate: [datePlusDays(new Date(this.event.maturity), DEFAULT_DAYS_UNTIL_REFUND), Validators.required],
      yourCollateral: [null, Validators.required],
      totalCollateral: [totalCollateral, Validators.required],
      feeRate: [this.walletStateService.feeEstimate, Validators.required],
      // outcomes?
    })
    if (this.contractInfo) {
      this.onTotalCollateral()
      this.setTheirCollateral()
    }
    this.darkModeService.darkModeChanged.subscribe(() => this.buildChart()) // this doesn't always seem to be necessary, but here to protect us
  }

  onClose() {
    this.close.next()
  }

  onRefundDateAutofill(event: any) {
    console.debug('onRefundDateAutofill()', event);
    if (event.isAutofilled && event.target) {
      const date = event.target.value
      this.datePicker.value = new Date(date)
    }
  }

  // Show 'Their' collateral value.
  setTheirCollateral() {
    const v = this.form.value
    const your = v.yourCollateral
    const total = v.totalCollateral
    let their: number|'' = ''
    if (total !== null && your !== null) {
      their = total - your
    }
    this.theirCollateral = their
  }

  onExecute() {
    console.debug('onExecute()')

    // this.contractInfo.hex is no good, need announcement hex from this.contractInfo
    const hex = this.announcement ? this.announcement.hex : this.contractInfo.contractInfo.oracleInfo.announcement.hex
    const v = this.form.value

    this.executing = true
    // TODO : Error handlers to unset executing in failure cases

    if (this.isEnum()) {
      const payoutVals = this.buildPayoutVals()
      const totalCollateral = v.totalCollateral
      // const maxCollateral = this.computeMaxCollateral(payoutVals)
  
      console.debug('payoutVals:', payoutVals, 'totalCollateral:', totalCollateral)
  
      this.messageService.sendMessage(getMessageBody(DLCMessageType.createcontractinfo, 
        [hex, totalCollateral, payoutVals])).subscribe(r => {
          console.debug('createcontractinfo', r)
  
          if (r.result) {
            const contractInfoTLV = <string>r.result
            const collateral = v.yourCollateral
            const feeRate = v.feeRate
            const locktime = dateToSecondsSinceEpoch(new Date(this.event.maturity))
            const refundLT = dateToSecondsSinceEpoch(v.refundDate)

            // console.debug('collateral:', collateral, 'feeRate:', feeRate, 'locktime:', locktime, 'refundLT:', refundLT)

            this.messageService.sendMessage(getMessageBody(WalletMessageType.createdlcoffer, 
              [contractInfoTLV, collateral, feeRate, locktime, refundLT])).subscribe(r => {
              console.warn('CreateDLCOffer()', r)
              if (r.result) {
                this.newOfferResult = r.result
                // this.walletStateService.refreshDLCStates() // via websocket now
                this.offerCreated = true
              }
              this.executing = false
            })
          }
        })
    } else if (this.isNumeric()) {
      const numericPayoutVals = this.points
      const totalCollateral = v.totalCollateral
      // const maxCollateral = this.computeNumericMaxCollateral(numericPayoutVals)

      console.warn('numericPayoutVals:', numericPayoutVals, 'totalCollateral:', totalCollateral, 'yourCollateral:', v.yourCollateral)
      
      // console.debug('numericAnnouncementHex:', numericAnnouncementHex, 'totalCollateral:', totalCollateral, 'numericPayoutVals:', numericPayoutVals)
      this.messageService.sendMessage(getMessageBody(DLCMessageType.createcontractinfo, 
        [hex, totalCollateral, numericPayoutVals])).subscribe(r => {
        console.warn('createcontractinfo', r)

        if (r.result) {
          const contractInfoTLV = <string>r.result
          const collateral = v.yourCollateral
          const feeRate = v.feeRate
          const locktime = dateToSecondsSinceEpoch(new Date(this.event.maturity))
          const refundLT = dateToSecondsSinceEpoch(v.refundDate)

          console.debug('collateral:', collateral, 'feeRate:', feeRate, 'locktime:', locktime, 'refundLT:', refundLT)

          this.messageService.sendMessage(getMessageBody(WalletMessageType.createdlcoffer, 
            [contractInfoTLV, collateral, feeRate, locktime, refundLT])).subscribe(r => {
            console.warn('CreateDLCOffer()', r)
            if (r.result) {
              this.newOfferResult = r.result
              // this.walletStateService.refreshDLCStates() // via websocket now
              this.offerCreated = true
            }
            this.executing = false
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

  // Validate enum/numeric payouts
  validatePayoutInputs() {
    const v = this.form.value
    let validInputs = true

    // console.debug('outcomeValues:', this.outcomeValues)
    // console.debug('points:', this.points)

    // TODO : May want to produce compound error messages, currently stop at first
    let errorString = ''

    if (this.isEnum()) {
      // Values must exist and be non-negative
      for (const label of Object.keys(this.outcomeValues)) {
        if (this.outcomeValues[label] === null) {
          validInputs = false
          errorString = this.translate.instant('newOfferValidation.payoutRequired') // 'payout values must be populated'
          break
        }
        if (<number>this.outcomeValues[label] < 0) {
          validInputs = false
          errorString = this.translate.instant('newOfferValidation.payoutNonNegative')
          break
        }
      }
      if (validInputs) {
        const maxCollateral = this.computeMaxCollateral(this.buildPayoutVals())
        // if (v.yourCollateral > maxCollateral) {
        //   validInputs = false
        //   errorString = this.translate.instant('newOfferValidation.yourCollateralMustBeLessThanMax', { yourCollateral: v.yourCollateral, maxCollateral })
        // }
        if (v.totalCollateral < maxCollateral) {
          validInputs = false
          errorString = this.translate.instant('newOfferValidation.maxCollateralMustBeLessThanTotal', 
          { totalCollateral: v.totalCollateral || 0, 
            maxCollateral: maxCollateral || 0,
          })
        }
      }
    } else if (this.isNumeric()) {
      // With min="0", it's leaving the value on the control at null, an erroring required when it should error non-negative
      for (const p of this.points) {
        if (p.outcome === null) {
          validInputs = false
          errorString = this.translate.instant('newOfferValidation.outcomeRequired')
          break
        }
        if (p.outcome < 0) {
          validInputs = false
          errorString = this.translate.instant('newOfferValidation.outcomeNonNegative')
          break
        }
        if (p.payout === null) {
          validInputs = false
          errorString = this.translate.instant('newOfferValidation.payoutRequired')
          break
        }
        if (p.payout < 0) {
          validInputs = false
          errorString = this.translate.instant('newOfferValidation.payoutNonNegative')
          break
        }
        // TODO : Any Endpoint logic to check
      }

      if (validInputs) {
        const maxCollateral = this.computeNumericMaxCollateral(this.points)
        // if (v.yourCollateral > maxCollateral) {
        //   validInputs = false
        //   errorString = this.translate.instant('newOfferValidation.yourCollateralMustBeLessThanMax', { yourCollateral: v.yourCollateral, maxCollateral }) // `yourCollateral (${v.yourCollateral}) must be equal to maxCollateral (${maxCollateral}) or less`
        // }
        if (v.totalCollateral < maxCollateral) {
          validInputs = false
          errorString = this.translate.instant('newOfferValidation.maxCollateralMustBeLessThanTotal',
          { totalCollateral: v.totalCollateral || 0, 
            maxCollateral: maxCollateral || 0
          })
        }
      }
    }

    if (validInputs) {
      if (v.yourCollateral > v.totalCollateral) {
        validInputs = false
        errorString = this.translate.instant('newOfferValidation.yourCollateralMoreThanTotal')
      }
    }

    // This is causing binding issues
    if (errorString) this.payoutValidationError = errorString
    else this.payoutValidationError = ''

    this.payoutInputsInvalid = !validInputs
  }

  onTotalCollateral() {
    const tc = this.form.value.totalCollateral
    const yc = this.form.value.yourCollateral
    console.debug('onTotalCollateral()', tc, yc)
    // If Total Collateral is being populated and Your Collateral is not yet set, set it to half of total
    if (tc && yc === null) {
      const half = Math.floor(this.form.value.totalCollateral / 2)
      this.form.patchValue({ yourCollateral: half })
    }
  }

  // Numeric

  addNewPoint() {
    console.debug('addNewPoint()')
    const newPoint = this.getPoint(<number><unknown>null, <number><unknown>null, 0, true)
    const where = this.points.length>0 ? this.points.length-1 : 0
    this.points.splice(where, 0, newPoint)
    this.validatePayoutInputs()
  }

  removePoint(point: PayoutFunctionPoint) {
    console.debug('removePoint()', point)
    const i = this.points.findIndex(i => i === point)
    if (i !== -1) {
      this.points.splice(i, 1)
    }
    this.validatePayoutInputs()
  }

  addNewRoundingInterval() {
    console.debug('addNewRoundingInterval()')

    // https://github.com/bitcoin-s/bitcoin-s/blob/aa748c012fc03e6bde6435092505e3c17a70437a/app-commons/src/main/scala/org/bitcoins/commons/serializers/Picklers.scala#L287
    // Structure like
    // { "intervals" : [{"beginInterval": 123 , "roundingMod" :456 }, ...]}
  }

}

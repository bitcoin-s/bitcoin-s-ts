import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { MatDrawer } from '@angular/material/sidenav'
import { MatSort } from '@angular/material/sort'
import { MatTable, MatTableDataSource } from '@angular/material/table'
import { ActivatedRoute, Params, Router } from '@angular/router'
import { Subscription } from 'rxjs'

import { OfferService } from '~service/offer-service'

import { IncomingOffer } from '~type/wallet-server-types'
import { OfferWithHex } from '~type/wallet-ui-types'

import { copyToClipboard, formatISODateTime, formatNumber, formatShortHex, TOR_V3_ADDRESS, trimOnPaste, UPPERLOWER_CASE_HEX } from '~util/utils'

import { environment } from '~environments'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { regexValidator } from '~util/validators'


@Component({
  selector: 'app-offers',
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.scss']
})
export class OffersComponent implements OnInit, AfterViewInit, OnDestroy {

  public copyToClipboard = copyToClipboard
  public formatNumber = formatNumber
  public formatISODateTime = formatISODateTime
  public formatShortHex = formatShortHex
  public trimOnPaste = trimOnPaste

  // New Incoming Offer
  form: FormGroup
  get f() { return this.form.controls }
  set messageValue(message: string) { this.form.patchValue({ message }) }
  set peerValue(peer: string) { this.form.patchValue({ peer }) }
  set offerTLVValue(offerTLV: string) { this.form.patchValue({ offerTLV }) }

  @ViewChild(MatTable) table: MatTable<IncomingOffer>
  @ViewChild(MatSort) sort: MatSort
  @ViewChild('rightDrawer') rightDrawer: MatDrawer

  debug = environment.debug

  // Grid config
  dataSource = new MatTableDataSource(<IncomingOffer[]>[])
  displayedColumns = ['message', 'peer', 'eventId', 'maturity',
    'totalCollateral', 'collateral', 'counterpartyCollateral',
    /*'feeRate',*/ 'offerTLV', 'hash', 'receivedAt', 'actions']

  private selectedOfferHash: string
  selectedIncomingOffer: IncomingOffer|null
  selectedOfferWithHex: OfferWithHex|null

  private queryParams$: Subscription
  private offers$: Subscription
  private decodedOffer$: Subscription

  constructor(private route: ActivatedRoute, private router: Router, private formBuilder: FormBuilder,
    public offerService: OfferService) { }

  ngOnInit(): void {
    // Keeps state in sync with route changes
    this.queryParams$ = this.route.queryParams
      .subscribe((params: Params) => {
        this.selectedOfferHash = params.offerHash
        console.debug('queryParams set selectedOfferHash', this.selectedOfferHash)
      })
    this.form = this.formBuilder.group({
      message: [''],
      peer: ['', [Validators.required, regexValidator(TOR_V3_ADDRESS)]],
      offerTLV: ['', [Validators.required, regexValidator(UPPERLOWER_CASE_HEX)]],
    })
  }

  ngOnDestroy(): void {
    this.queryParams$.unsubscribe()
    this.offers$.unsubscribe()
    this.decodedOffer$.unsubscribe()
  }

  ngAfterViewInit() {
    this.dataSource.sortingDataAccessor = (offer: IncomingOffer, property: string) => {
      switch (property) {
        case 'eventId':
          return this.getOffer(offer.hash)?.offer.contractInfo.oracleInfo.announcement.event.eventId
        case 'maturity':
          return this.getOffer(offer.hash)?.offer.contractInfo.oracleInfo.announcement.event.maturity
        case 'totalCollateral':
          return this.getOffer(offer.hash)?.offer?.contractInfo?.totalCollateral
        case 'collateral':
          return this.yourCollateral(offer)
        case 'counterpartyCollateral':
          return this.getOffer(offer.hash)?.offer?.offerCollateral
        // case 'feeRate':
        //   return this.getOffer(offer.hash)?.offer?.feeRatePerVb
        default:
          return (<any>offer)[property];
      }
    }
    this.dataSource.sort = this.sort

    this.offers$ = this.offerService.offers.subscribe(_ => {
      this.dataSource.data = this.offerService.offers.value
      this.table.renderRows()
    })
    this.decodedOffer$ = this.offerService.decodedOffers.subscribe(_ => {
      this.loadSelectedOffer()
    })
  }

  getOffer(hash: string) {
    return this.offerService.decodedOffers.value[hash]
  }

  yourCollateral(incomingOffer: IncomingOffer) {
    const offer = this.getOffer(incomingOffer.hash)
    // These load async, so they might not be defined yet
    if (offer) {
      return offer.offer.contractInfo.totalCollateral - offer.offer.offerCollateral
    }
    return undefined
  }

  addManualOffer() {
    const v = this.form.value
    const message = v.message
    const peer = v.peer
    const offerTLV = v.offerTLV

    console.debug('addManualOffer()', message, peer, offerTLV)

    this.offerService.addIncomingOffer(offerTLV, peer, message).subscribe()
    this.clearOfferForm()
  }

  sendManualOffer() {
    const v = this.form.value
    const message = v.message
    const peer = v.peer
    const offerTLV = v.offerTLV

    console.debug('sendManualOffer()', message, peer, offerTLV)

    this.offerService.sendIncomingOffer(offerTLV, peer, message).subscribe()
    this.clearOfferForm()
  }

  private clearOfferForm() {
    this.form.patchValue({
      message: '',
      peer: '',
      offerTLV: ''
    })
    this.form.reset()
  }

  private loadSelectedOffer() {
    if (this.selectedOfferHash && this.offerService.offers.value.length > 0) {
      console.debug('loadSelectedOffer()', this.selectedOfferHash)

      const offer = this.offerService.offers.value.find(o => o.hash === this.selectedOfferHash)
      if (offer) {
        this.onRowClick(offer)
      }
    }
  }

  onRowClick(offer: IncomingOffer) {
    this.selectedIncomingOffer = offer
    this.selectedOfferWithHex = this.offerService.decodedOffers.value[offer.hash]

    console.debug('onRowClick()', offer, this.selectedOfferWithHex)
    console.warn('equal?', offer.offerTLV === this.selectedOfferWithHex.hex)

    this.rightDrawer.open()
    // Update queryParams
    this.router.navigate(['/offers'], { queryParams: { offerHash: offer.hash }})
  }

  rightDrawerOpened(opened: boolean) {
    console.debug('rightDrawerOpened()', opened)
    // Clean up state on close
    if (!opened) {
      this.selectedIncomingOffer = null
      this.selectedOfferWithHex = null
      // Update queryParams
      this.router.navigate(['/offers'])
    }
  }

  clearSelection() {
    this.rightDrawer.close()
    this.selectedIncomingOffer = null
    this.selectedOfferWithHex = null
  }

  onDelete(offer: IncomingOffer) {
    console.debug('onDelete()', offer)
    this.offerService.removeIncomingOffer(offer.hash).subscribe()
  }

}

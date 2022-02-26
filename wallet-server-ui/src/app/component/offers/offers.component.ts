import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { MatDrawer } from '@angular/material/sidenav'
import { MatSort } from '@angular/material/sort'
import { MatTable, MatTableDataSource } from '@angular/material/table'
import { ActivatedRoute, Params, Router } from '@angular/router'
import { Subscription } from 'rxjs'

import { IncomingOffer, Offer } from '~type/wallet-server-types'
import { OfferWithHex } from '~type/wallet-ui-types'

import { copyToClipboard, formatISODateTime, formatNumber, formatShortHex, trimOnPaste } from '~util/utils'

import { environment } from '~environments'
import { OfferService } from '~service/offer-service'


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

  @ViewChild('peer') peer: ElementRef
  @ViewChild('message') message: ElementRef
  @ViewChild('offer') offer: ElementRef

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
  selectedOffer: Offer|null
  selectedOfferWithHex: OfferWithHex|null

  offerDetailVisible = false

  private queryParams$: Subscription
  private offers$: Subscription

  constructor(private route: ActivatedRoute, private router: Router, 
    public offerService: OfferService) { }

  ngOnInit(): void {
    // Keeps state in sync with route changes
    this.queryParams$ = this.route.queryParams
      .subscribe((params: Params) => {
        this.selectedOfferHash = params.offerHash
        console.debug('queryParams set selectedOfferHash', this.selectedOfferHash)
      })

    // Probably should happen after getIncomingOffers() clears decodes
    setTimeout(() => {
      this.loadSelectedOffer()
    }, 1000)
  }

  ngOnDestroy(): void {
    this.queryParams$.unsubscribe()
    this.offers$.unsubscribe()
  }

  ngAfterViewInit() {
    // TODO : Sort on all decoded offer columns
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
          return this.getOffer(offer.hash)?.offer?.offerCollateralSatoshis
        case 'feeRate':
          return this.getOffer(offer.hash)?.offer?.feeRatePerVb
        default:
          return (<any>offer)[property];
      }
    }
    this.dataSource.sort = this.sort

    this.offers$ = this.offerService.offers.subscribe(_ => {
      this.dataSource.data = this.offerService.offers.value
      this.table.renderRows()
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
      return offer.offer.contractInfo.totalCollateral - offer.offer.offerCollateralSatoshis
    }
    return undefined
  }

  addManualOffer() {
    const peer = this.peer.nativeElement.value
    const message = this.message.nativeElement.value
    const offerTLV = this.offer.nativeElement.value

    this.offerService.decodeOffer(offerTLV).subscribe(r => {
      console.debug('decodeOffer()', r)
      if (r) {
        this.peer.nativeElement.value = ''
        this.message.nativeElement.value = ''
        this.offer.nativeElement.value = ''

        this.offerService.addIncomingOffer(offerTLV, peer, message).subscribe(r => {
          console.debug('saveIncomingOffer()', r)
          if (r.result) {
            this.offerService.loadIncomingOffers().subscribe()
          }
        })
      }
    })
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

    this.offerDetailVisible = true
    this.rightDrawer.open()
    // Update queryParams and set selectedDLCId via subscription
    this.router.navigate(['/offers'], { queryParams: { offerHash: offer.hash }})
  }

  rightDrawerOpened(opened: boolean) {
    console.debug('rightDrawerOpened()', opened)
    // Clean up state on close
    if (!opened) {
      this.offerDetailVisible = false
      this.selectedIncomingOffer = null
      this.selectedOffer = null
      this.selectedOfferWithHex = null
      // Update queryParams and set selectedDLCId via subscription
      this.router.navigate(['/offers'])
    }
  }

  clearSelection() {
    this.rightDrawer.close()
    this.selectedIncomingOffer = null
    this.selectedOffer = null
    this.selectedOfferWithHex = null
  }

  onDelete(offer: IncomingOffer) {
    console.debug('onDelete()', offer)
    this.offerService.removeIncomingOffer(offer.hash).subscribe(r => {
      console.debug('onDelete()', r)
      this.offerService.loadIncomingOffers().subscribe()
    })
  }

}

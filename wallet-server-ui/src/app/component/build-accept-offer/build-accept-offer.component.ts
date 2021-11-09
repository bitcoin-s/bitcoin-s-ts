import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core'

import { MessageService } from '~service/message.service'
import { WalletStateService } from '~service/wallet-state-service';
import { Announcement, ContractInfo, CoreMessageType, DLCMessageType, Offer, WalletMessageType } from '~type/wallet-server-types'
import { AnnouncementWithHex, ContractInfoWithHex, OfferWithHex } from '~type/wallet-ui-types';
import { getMessageBody } from '~util/wallet-server-util'


@Component({
  selector: 'app-build-accept-offer',
  templateUrl: './build-accept-offer.component.html',
  styleUrls: ['./build-accept-offer.component.scss']
})
export class BuildAcceptOfferComponent implements OnInit {

  @ViewChild('buildOfferInput') buildOfferInput: ElementRef;
  @ViewChild('acceptOfferInput') acceptOfferInput: ElementRef;

  @Output() announcement: EventEmitter<AnnouncementWithHex> = new EventEmitter<AnnouncementWithHex>()
  @Output() contractInfo: EventEmitter<ContractInfoWithHex> = new EventEmitter<ContractInfoWithHex>()
  @Output() offer: EventEmitter<OfferWithHex> = new EventEmitter<OfferWithHex>()

  @Output() acceptOffer: EventEmitter<OfferWithHex> = new EventEmitter<OfferWithHex>()


  // Data : https://test.oracle.suredbits.com/announcement/63fa7885e3c6052e97956961698cde2b286dc1621544bbd8fcfbd78b2b1dbdcf
  enumAnnouncementHex = 'fdd824a8823cf7a3e449260f46d3d9a5bb0ddf1a367e0d3c9ce8858e16cd783392560bd1c9671314d54b6cb258bc6d85ab8fe238a27feb5a27d75323524a54d712a80b70a305b66d790ea4afe15b3fb61cae4d77f050e57b41f10f530c48a23dddbe335afdd822440001c3b0ecdaeaa3bbbd53386dec623b3a884b0ca2e2777cc62f0b6f891d9226114d614ebae0fdd80611000205546f64617908546f6d6f72726f7708546f6d6f72726f77'
  // Data : https://test.oracle.suredbits.com/announcement/b4663b7a3aa43d228f350b74f8bbe30a96c9aaf344f8f7589e713863d419f3a2
  numericAnnouncementHex = 'fdd824fd016beb851d39afa08cc3d3445ee2696c105f3717bb087346acb95a77dacb9aba17f5f944e6ea8db22f926b7dfd17a306ab927f51b7b26b92c9f9cca4e83d28fb7861a305b66d790ea4afe15b3fb61cae4d77f050e57b41f10f530c48a23dddbe335afdd822fd01050007a5a92a821927337b40a30e152052482f894ff8ecfe3f5a1aa4aa3b6720bf7a2d61d7b210ecd7217d4d342c5e78a99360f920876e461fea671950622ec6a23b9d1c04bc48c6332bfe089fac15b600721f3120cc8d721ba387b59385cef7ea788e7e1cf1bc6cb8d45cf594e7af811bed009c1899439c58a82527684d50b9ed150c1127a45a7e2c93edeb9307e1c2daac7cf6658a488b7159e29e551b9dac141f42e9f41989a0e2bd4064ecf8a09d81285504ae2ec425ff2ab98feb975b4e7e64e70e4e4016a857044d634af12f361f264272a526c08fa39d2116d9136ef00024d870dbd880fdd80a0e00020004556e69740000000000070c6e756d657269634576656e74'

  constructor(private messageService: MessageService, private walletStateService: WalletStateService) { }

  ngOnInit(): void {
  }

  onBuildOfferPaste(event: ClipboardEvent) {
    console.debug('onBuildOfferPaste()', event)
    const clipboardData = event.clipboardData
    if (clipboardData) {
      const trimmedPastedText = clipboardData.getData('text').trim()
      console.debug('trimmedPastedText:', trimmedPastedText)

      // Sanity check on pastedText first?

      this.onBuildOffer(trimmedPastedText)
    }
    
  }

  onBuildOfferInput(event: Event) {
    console.debug('onBuildOfferInput()', event)
    const text = this.buildOfferInput.nativeElement.value
    this.onBuildOffer(text)
  }

  onBuildOffer(hex: string) {
    console.debug('onBuildOffer()', hex)
    if (hex) {

      // Need to suppress error handling so any of these calls can fail gracefully

      this.messageService.sendMessage(getMessageBody(CoreMessageType.decodeannouncement, [hex])).subscribe(r => {
        console.debug('decodeannouncement', r)

        if (r.result) {
          const announcementWithHex = <AnnouncementWithHex>{ announcement: r.result, hex }
          this.announcement.next(announcementWithHex)
          this.clearBuildOfferInput()
        } else {
          // Try another
          this.messageService.sendMessage(getMessageBody(CoreMessageType.decodecontractinfo, [hex])).subscribe(r => {
            console.debug('decodecontractinfo', r)

            if (r.result) {
              const contractInfo = <ContractInfoWithHex>{ contractInfo: r.result, hex }
              this.contractInfo.next(contractInfo)
            } else {
              // Try another
              this.messageService.sendMessage(getMessageBody(CoreMessageType.decodeoffer, [hex])).subscribe(r => {
                console.debug('decodeoffer', r)

                if (r.result) {
                  const offer = <OfferWithHex>{ offer: r.result, hex }
                  this.offer.next(offer)
                } else {
                  // No more to try
                }
              })
            }
          })
        }
      })
    }
  }

  private clearBuildOfferInput() {
    this.buildOfferInput.nativeElement.value = ''
  }

  onAcceptOfferPaste(event: ClipboardEvent) {
    console.debug('onAcceptOfferPaste()', event)
    const clipboardData = event.clipboardData
    if (clipboardData) {
      const trimmedPastedText = clipboardData.getData('text').trim()
      console.debug('patrimmedPastedTexttedText:', trimmedPastedText)
      this.onAcceptOffer(trimmedPastedText)
    }
  }

  onAcceptOffer(hex: string) {
    console.debug('onAcceptOffer()', hex)
    if (hex) {
      this.messageService.sendMessage(getMessageBody(CoreMessageType.decodeoffer, [hex])).subscribe(r => {
        console.debug('decodeoffer', r)

        if (r.result) {
          const offer = <OfferWithHex>{ offer: r.result, hex }
          this.acceptOffer.next(offer)
          this.clearAcceptOfferInput()
        } else {
          // No more to try
        }
      })
    }
  }

  onAcceptOfferInput(event: Event) {
    console.debug('onAcceptOfferInput()', event)
    const text = this.buildOfferInput.nativeElement.value
    this.onAcceptOffer(text)
  }

  private clearAcceptOfferInput() {
    this.acceptOfferInput.nativeElement.value = ''
  }

  // Static new Contract functions

  onNewEnum() {
    console.debug('onNewEnum()')

    // Data : https://test.oracle.suredbits.com/announcement/63fa7885e3c6052e97956961698cde2b286dc1621544bbd8fcfbd78b2b1dbdcf
    const enumAnnouncementHex = 'fdd824a8823cf7a3e449260f46d3d9a5bb0ddf1a367e0d3c9ce8858e16cd783392560bd1c9671314d54b6cb258bc6d85ab8fe238a27feb5a27d75323524a54d712a80b70a305b66d790ea4afe15b3fb61cae4d77f050e57b41f10f530c48a23dddbe335afdd822440001c3b0ecdaeaa3bbbd53386dec623b3a884b0ca2e2777cc62f0b6f891d9226114d614ebae0fdd80611000205546f64617908546f6d6f72726f7708546f6d6f72726f77'
    const totalCollateral = 200003
    const payoutVals = { outcomes: { 'Today': 200003, 'Tomorrow': 0 } }
    
    this.messageService.sendMessage(getMessageBody(DLCMessageType.createcontractinfo, 
      [enumAnnouncementHex, totalCollateral, payoutVals])).subscribe(r => {
        console.debug('createcontractinfo', r)

        if (r.result) {
          const contractInfoTLV = <string>r.result
          const collateral = 100002
          const feeRate = 1
          const now = new Date()
          // ERROR IS HERE - The server is unhappy with this secondsSinceEpoch
          const secondsSinceEpoch = Math.round(now.getTime() / 1000)
          const locktime = secondsSinceEpoch
          const refundLT = secondsSinceEpoch + 1000000
          this.messageService.sendMessage(getMessageBody(WalletMessageType.createdlcoffer, 
            [contractInfoTLV, collateral, feeRate, locktime, refundLT])).subscribe(r => {
            console.warn('CreateDLCOffer()', r)
            if (r.result) {
              this.walletStateService.refreshDLCStates()
            }
          })
        }
      })
  }

  onNewNumeric() {
    console.debug('onNewNumeric()')

    // Data : https://test.oracle.suredbits.com/announcement/b4663b7a3aa43d228f350b74f8bbe30a96c9aaf344f8f7589e713863d419f3a2
    const numericAnnouncementHex = 'fdd824fd016beb851d39afa08cc3d3445ee2696c105f3717bb087346acb95a77dacb9aba17f5f944e6ea8db22f926b7dfd17a306ab927f51b7b26b92c9f9cca4e83d28fb7861a305b66d790ea4afe15b3fb61cae4d77f050e57b41f10f530c48a23dddbe335afdd822fd01050007a5a92a821927337b40a30e152052482f894ff8ecfe3f5a1aa4aa3b6720bf7a2d61d7b210ecd7217d4d342c5e78a99360f920876e461fea671950622ec6a23b9d1c04bc48c6332bfe089fac15b600721f3120cc8d721ba387b59385cef7ea788e7e1cf1bc6cb8d45cf594e7af811bed009c1899439c58a82527684d50b9ed150c1127a45a7e2c93edeb9307e1c2daac7cf6658a488b7159e29e551b9dac141f42e9f41989a0e2bd4064ecf8a09d81285504ae2ec425ff2ab98feb975b4e7e64e70e4e4016a857044d634af12f361f264272a526c08fa39d2116d9136ef00024d870dbd880fdd80a0e00020004556e69740000000000070c6e756d657269634576656e74'
    const totalCollateral = 200003
    const numericPayoutVals = [{ outcome: 0, payout: 0, isEndpoint: true, extraPrecision: 0 }, { outcome: 127, payout: totalCollateral, isEndpoint: true, extraPrecision: 0 }]
    console.debug('numericAnnouncementHex:', numericAnnouncementHex, 'totalCollateral:', totalCollateral, 'numericPayoutVals:', numericPayoutVals)
    this.messageService.sendMessage(getMessageBody(DLCMessageType.createcontractinfo, 
      [numericAnnouncementHex, totalCollateral, numericPayoutVals])).subscribe(r => {
      console.warn('createcontractinfo', r)

      if (!(typeof r === 'string')) { // !== 'failure') {
        const contractInfoTLV = <string>r.result
        const collateral = 100000
        const feeRate = 1
        const now = new Date()
        const secondsSinceEpoch = Math.round(now.getTime() / 1000) // dateToSecondsSinceEpoch(new Date())
        const locktime = secondsSinceEpoch
        const refundLT = secondsSinceEpoch + 1000000
        this.messageService.sendMessage(getMessageBody(WalletMessageType.createdlcoffer, 
          [contractInfoTLV, collateral, feeRate, locktime, refundLT])).subscribe(r => {
          console.warn('CreateDLCOffer()', r)
          if (r.result) {
            this.walletStateService.refreshDLCStates()
          }
        })
      }
      
    })
  }
}

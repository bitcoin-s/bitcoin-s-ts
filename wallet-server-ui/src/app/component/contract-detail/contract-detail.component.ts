import { Component, Input, OnInit } from '@angular/core';
import { ContractInfo, DLCContract } from '~type/wallet-server-types';

@Component({
  selector: 'app-contract-detail',
  templateUrl: './contract-detail.component.html',
  styleUrls: ['./contract-detail.component.scss']
})
export class ContractDetailComponent implements OnInit {

  _dlc!: DLCContract
  get dlc(): DLCContract { return this._dlc }
  @Input() set dlc(e: DLCContract) { this.reset(); this._dlc = e }

  _contractInfo!: ContractInfo
  get contractInfo(): ContractInfo { return this._contractInfo }
  @Input() set contractInfo(e: ContractInfo) { this._contractInfo = e }

  constructor() { }

  ngOnInit(): void {
  }

  reset() {

  }

}

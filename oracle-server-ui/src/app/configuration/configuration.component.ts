import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import { FormControl } from '@angular/forms'
import { MatCheckboxChange } from '@angular/material/checkbox'

import { OracleExplorerService, ORACLE_EXPLORERS } from '~service/oracle-explorer.service'
import { OracleStateService } from '~service/oracle-state.service'
import { TorService } from '~service/tor.service'


const CSS_DARK_MODE = 'CSS_DARK_MODE'

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {

  public ORACLE_EXPLORERS = ORACLE_EXPLORERS

  @Output() close: EventEmitter<void> = new EventEmitter()
  @Output() rootClassName: EventEmitter<boolean> = new EventEmitter()

  toggleControl: FormControl = new FormControl(false)

  oracleExplorer: string // 'test', 'prod'
  useTor: boolean

  constructor(private oracleExplorerService: OracleExplorerService, private torService: TorService, private oracleState: OracleStateService) { }

  ngOnInit(): void {
    this.toggleControl.valueChanges.subscribe((darkMode: boolean) => {
      this.rootClassName.next(darkMode)
    })
    this.toggleControl.setValue(localStorage.getItem(CSS_DARK_MODE) !== null)

    this.oracleExplorer = this.oracleExplorerService.oracleExplorer.value.value
    this.useTor = this.torService.useTor
  }

  onClose() {
    console.debug('onClose()')
    this.close.next()
  }

  oracleExplorerChanged(value: string) {
    console.debug('oracleExplorerChanged()', value)
    const oracleExplorer = ORACLE_EXPLORERS.find(o => o.value === value)
    if (oracleExplorer) {
      this.oracleExplorerService.setOracleExplorer(oracleExplorer)
    }
  }

  useTorChanged(change: MatCheckboxChange) {
    console.debug('useTorChanged()', change)
    this.torService.useTor = change.checked
  }

  // Refresh oracleExplorer / Blockstream data that may not have loaded over tor previously
  onRefreshOracleData() {
    console.debug('onRefreshOracleData()')
    this.oracleState.getOracleNameFromOracleExplorer()
    this.oracleState.getStakingBalance()
  }

}

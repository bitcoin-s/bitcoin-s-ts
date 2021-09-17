import { Component, EventEmitter, OnInit, Output } from '@angular/core'

import { OracleExplorerService, ORACLE_EXPLORERS } from '~service/oracle-explorer.service'


@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {

  @Output() close: EventEmitter<void> = new EventEmitter()

  public ORACLE_EXPLORERS = ORACLE_EXPLORERS

  oracleExplorer: string // 'test', 'prod'

  constructor(private oracleExplorerService: OracleExplorerService) { }

  ngOnInit(): void {
    this.oracleExplorer = this.oracleExplorerService.oracleExplorer.value.value
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

}

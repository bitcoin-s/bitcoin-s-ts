import { Component, OnInit } from '@angular/core'

import { OracleStateService } from '~service/oracle-state.service'
import { copyToClipboard } from '~util/ui-util'


@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {

  public copyToClipboard = copyToClipboard

  constructor(public oracleState: OracleStateService) { }

  ngOnInit(): void {
  }

}

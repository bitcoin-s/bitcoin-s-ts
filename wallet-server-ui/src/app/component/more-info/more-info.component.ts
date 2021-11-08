import { Component, Input } from '@angular/core'
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions } from '@angular/material/tooltip'
import { TranslateService } from '@ngx-translate/core'

/** Custom options the configure the tooltip's default show/hide delays. */
export const myCustomTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 0,
  hideDelay: 200,
  touchendHideDelay: 200,
}

@Component({
  selector: 'app-more-info',
  templateUrl: './more-info.component.html',
  styleUrls: ['./more-info.component.scss'],
  providers: [
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: myCustomTooltipDefaults }
  ],
})
export class MoreInfoComponent {

  _tooltip: string = ''
  @Input()
  set tooltip(value: string) {
    this._tooltip = this.translate.instant(value)
  }

  constructor(private translate: TranslateService) { }

}

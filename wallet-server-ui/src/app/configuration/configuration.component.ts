import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import { UntypedFormControl } from '@angular/forms'

import { DarkModeService } from '~service/dark-mode.service'


@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {

  @Output() close: EventEmitter<void> = new EventEmitter()

  toggleControl: UntypedFormControl = new UntypedFormControl(false)


  constructor(private darkModeService: DarkModeService) { }

  ngOnInit(): void {
    this.toggleControl.setValue(this.darkModeService.isDarkMode)
    this.toggleControl.valueChanges.subscribe((darkMode: boolean) => {
      this.darkModeService.setDarkMode(darkMode)
    })
  }

  onClose() {
    console.debug('onClose()')
    this.close.next()
  }

}

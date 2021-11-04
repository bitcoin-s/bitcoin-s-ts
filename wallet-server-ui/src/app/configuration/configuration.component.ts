import { Component, EventEmitter, OnInit, Output } from '@angular/core'
import { FormControl } from '@angular/forms'


const CSS_DARK_MODE = 'CSS_DARK_MODE'

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss']
})
export class ConfigurationComponent implements OnInit {

  @Output() close: EventEmitter<void> = new EventEmitter()
  @Output() rootClassName: EventEmitter<boolean> = new EventEmitter()

  toggleControl: FormControl = new FormControl(false)

  private className = ''

  constructor() { }

  ngOnInit(): void {
    this.toggleControl.valueChanges.subscribe((darkMode: boolean) => {
      // const darkClassName = 'darkMode'
      // this.className = darkMode ? darkClassName : ''
      this.rootClassName.next(darkMode)
      // if (darkMode) {
      //   this.overlay.getContainerElement().classList.add(darkClassName)
      // } else {
      //   this.overlay.getContainerElement().classList.remove(darkClassName)
      // }
    })

    this.toggleControl.setValue(localStorage.getItem(CSS_DARK_MODE) !== null)
  }

  onClose() {
    console.debug('onClose()')
    this.close.next()
  }

}

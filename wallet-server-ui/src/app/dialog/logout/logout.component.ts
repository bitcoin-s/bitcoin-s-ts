import { Component, Inject, OnInit } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { Subscription, interval } from 'rxjs'


export interface LogoutDialogContent {
  time: number,
}

@Component({
  selector: 'logout-dialog',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutDialogComponent implements OnInit {

  time: number
  timer: Subscription

  constructor(@Inject(MAT_DIALOG_DATA) public data: LogoutDialogContent,
    private dialogRef: MatDialogRef<LogoutDialogComponent>) {
      dialogRef.disableClose = true;
    }

  ngOnInit(): void {
    this.time = this.data.time
    this.timer = interval(1000).subscribe(_ => {
      this.time--
      if (this.time <= 0) { // < just in case a non-whole number got in
        this.timer.unsubscribe()
        // Auto-close
        this.dialogRef.close()
      }
    })
  }

}

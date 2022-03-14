import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DLCPayoutDialogComponent } from './dlc-payload-dialog.component';

describe('SendFundsDialogComponent', () => {
  let component: DLCPayoutDialogComponent;
  let fixture: ComponentFixture<DLCPayoutDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DLCPayoutDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DLCPayoutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

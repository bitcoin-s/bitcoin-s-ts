import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendFundsDialogComponent } from './send-funds-dialog.component';

describe('SendFundsDialogComponent', () => {
  let component: SendFundsDialogComponent;
  let fixture: ComponentFixture<SendFundsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SendFundsDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SendFundsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

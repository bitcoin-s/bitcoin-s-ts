import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeeRateDialogComponent } from './fee-rate-dialog.component';

describe('FeeRateDialogComponent', () => {
  let component: FeeRateDialogComponent;
  let fixture: ComponentFixture<FeeRateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FeeRateDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeeRateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

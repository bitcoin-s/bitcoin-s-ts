import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewAddressDialogComponent } from './new-address-dialog.component';

describe('NewAddressDialogComponent', () => {
  let component: NewAddressDialogComponent;
  let fixture: ComponentFixture<NewAddressDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewAddressDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewAddressDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

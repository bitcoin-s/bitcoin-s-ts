import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressLabelComponent } from './address-label.component';

describe('AddressLabelComponent', () => {
  let component: AddressLabelComponent;
  let fixture: ComponentFixture<AddressLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddressLabelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddressLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

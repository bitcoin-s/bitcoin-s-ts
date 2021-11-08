import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptOfferComponent } from './accept-offer.component';

describe('AcceptOfferComponent', () => {
  let component: AcceptOfferComponent;
  let fixture: ComponentFixture<AcceptOfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcceptOfferComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

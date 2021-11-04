import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildAcceptOfferComponent } from './build-accept-offer.component';

describe('BuildAcceptOfferComponent', () => {
  let component: BuildAcceptOfferComponent;
  let fixture: ComponentFixture<BuildAcceptOfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuildAcceptOfferComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BuildAcceptOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

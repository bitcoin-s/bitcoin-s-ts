import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewUserOnboardingCardComponent } from './new-user-onboarding-card.component';

describe('NewUserOnboardingCardComponent', () => {
  let component: NewUserOnboardingCardComponent;
  let fixture: ComponentFixture<NewUserOnboardingCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewUserOnboardingCardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewUserOnboardingCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewUserOnboardingComponent } from './new-user-onboarding.component';

describe('NewUserOnboardingComponent', () => {
  let component: NewUserOnboardingComponent;
  let fixture: ComponentFixture<NewUserOnboardingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewUserOnboardingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewUserOnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

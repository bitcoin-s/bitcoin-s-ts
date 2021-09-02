import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LastResultDetailComponent } from './last-result-detail.component';

describe('LastResultDetailComponent', () => {
  let component: LastResultDetailComponent;
  let fixture: ComponentFixture<LastResultDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LastResultDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LastResultDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

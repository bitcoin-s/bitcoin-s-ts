import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DlcFileComponent } from './dlc-file.component';

describe('DlcFileComponent', () => {
  let component: DlcFileComponent;
  let fixture: ComponentFixture<DlcFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DlcFileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DlcFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

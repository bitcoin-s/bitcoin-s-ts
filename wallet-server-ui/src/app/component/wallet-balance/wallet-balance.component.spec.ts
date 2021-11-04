import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletBalanceComponent } from './wallet-balance.component';

describe('WalletBalanceComponent', () => {
  let component: WalletBalanceComponent;
  let fixture: ComponentFixture<WalletBalanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WalletBalanceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WalletBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

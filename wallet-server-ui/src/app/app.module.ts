import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'
import { APP_INITIALIZER, NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { BrowserModule } from '@angular/platform-browser'
import { NgChartsModule } from 'ng2-charts'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import { QrCodeModule } from 'ng-qrcode'
import { ZXingScannerModule } from '@zxing/ngx-scanner'

import { MaterialModule } from './shared/modules/material/material.module'

import { AppComponent } from './app.component'
import { AlertComponent } from './component/alert/alert.component'
import { MoreInfoComponent } from './component/more-info/more-info.component'
import { SplashComponent } from './component/splash/splash.component'
import { ConfigurationComponent } from './configuration/configuration.component'
import { WalletBalanceComponent } from './component/wallet-balance/wallet-balance.component'
import { ContractsComponent } from './component/contracts/contracts.component'
import { EventsComponent } from './component/events/events.component'
import { OffersComponent } from './component/offers/offers.component'
import { ContractDetailComponent } from './component/contract-detail/contract-detail.component'
import { EventDetailComponent } from './component/event-detail/event-detail.component'
import { NewOfferComponent } from './component/new-offer/new-offer.component'
import { BuildAcceptOfferComponent } from './component/build-accept-offer/build-accept-offer.component'
import { AcceptOfferComponent } from './component/accept-offer/accept-offer.component'
import { DlcFileComponent } from './component/dlc-file/dlc-file.component'
import { DebugComponent } from './component/debug/debug.component'
import { HeaderComponent } from './component/header/header.component'
import { AppRoutingModule } from './app-routing.module'
import { AboutComponent } from './component/about/about.component'
import { NetworkComponent } from './component/network/network.component'
import { LoginComponent } from './component/login/login.component'
import { AddressLabelComponent } from './component/address-label/address-label.component'
import { ContactsComponent } from './component/contacts/contacts.component'
import { ImportExportComponent } from './component/import-export/import-export.component'
import { ExportComponent } from './component/export/export.component'
import { ImportComponent } from './component/import/import.component'

import { ConfirmationDialogComponent } from './dialog/confirmation/confirmation.component'
import { ErrorDialogComponent } from './dialog/error/error.component'
import { FeeRateDialogComponent } from './dialog/fee-rate-dialog/fee-rate-dialog.component'
import { LogoutDialogComponent } from './dialog/logout/logout.component'
import { NewAddressDialogComponent } from './dialog/new-address-dialog/new-address-dialog.component'
import { NewUserOnboardingComponent } from './component/new-user-onboarding/new-user-onboarding.component'
import { SendFundsDialogComponent } from './dialog/send-funds-dialog/send-funds-dialog.component'

import { AuthInterceptor } from './interceptor/auth-interceptor'
import { ErrorInterceptor } from './interceptor/error-interceptor'
import { NewUserOnboardingCardComponent } from './component/new-user-onboarding-card/new-user-onboarding-card.component'

// AoT requires an exported function for factories
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json')
}

// Load English translations before rendering app
export function appInitializerFactory(translate: TranslateService) {
  return () => {
    translate.setDefaultLang('en')
    return translate.use('en').toPromise()
  }
}

@NgModule({
  declarations: [
    AppComponent,
    SplashComponent,
    AlertComponent,
    MoreInfoComponent,
    ConfirmationDialogComponent,
    ErrorDialogComponent,
    ConfigurationComponent,
    WalletBalanceComponent,
    ContractsComponent,
    EventsComponent,
    OffersComponent,
    ContractDetailComponent,
    EventDetailComponent,
    NewOfferComponent,
    BuildAcceptOfferComponent,
    AcceptOfferComponent,
    NewAddressDialogComponent,
    SendFundsDialogComponent,
    FeeRateDialogComponent,
    DlcFileComponent,
    DebugComponent,
    HeaderComponent,
    AboutComponent,
    NetworkComponent,
    LoginComponent,
    LogoutDialogComponent,
    AddressLabelComponent,
    ContactsComponent,
    ImportExportComponent,
    ExportComponent,
    ImportComponent,
    NewUserOnboardingComponent,
    NewUserOnboardingCardComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    MaterialModule,
    NgChartsModule,
    QrCodeModule,
    ZXingScannerModule,
    AppRoutingModule,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFactory,
      deps: [TranslateService],
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

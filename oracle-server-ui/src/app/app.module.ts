import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'
import { APP_INITIALIZER, NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { BrowserModule } from '@angular/platform-browser'
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader'

import { MaterialModule } from './shared/modules/material/material.module'
import { AppRoutingModule } from './app-routing.module'

import { AppComponent } from './app.component'
import { LoginComponent } from './login/login.component'
import { AboutComponent } from './about/about.component'
import { OracleComponent } from './oracle/oracle.component'
import { NewAnnouncementComponent } from './new-announcement/new-announcement.component'
import { AnnouncementDetailComponent } from './announcement-detail/announcement-detail.component'
import { LastResultDetailComponent } from './last-result-detail/last-result-detail.component'
import { ConfigurationComponent } from './configuration/configuration.component'
import { SignMessageComponent } from './sign-message/sign-message.component'

import { AlertComponent } from './component/alert/alert.component'
import { MoreInfoComponent } from './component/more-info/more-info.component'
import { SplashComponent } from './component/splash/splash.component'

import { ConfirmationDialogComponent } from './dialog/confirmation/confirmation.component'
import { ErrorDialogComponent } from './dialog/error/error.component'
import { LogoutDialogComponent } from './dialog/logout/logout.component'

import { AuthInterceptor } from './interceptor/auth-interceptor'
import { ErrorInterceptor } from './interceptor/error-interceptor';
import { HeaderComponent } from './header/header.component';
import { AdvancedComponent } from './component/advanced/advanced.component'


// AoT requires an exported function for factories
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json')
}

// Load English translations before rendering app
export function appInitializerFactory(translate: TranslateService) {
  return () => {
    translate.setDefaultLang('en')
    return translate.use('en').toPromise()
  };
}

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AboutComponent,
    OracleComponent,
    AnnouncementDetailComponent,
    NewAnnouncementComponent,
    AlertComponent,
    MoreInfoComponent,
    LastResultDetailComponent,
    SplashComponent,
    
    ConfigurationComponent,
    SignMessageComponent,

    ConfirmationDialogComponent,
    ErrorDialogComponent,
    LogoutDialogComponent,
    HeaderComponent,
    AdvancedComponent,
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
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    MaterialModule,
    AppRoutingModule,
  ],
  providers: [{
    provide: APP_INITIALIZER,
    useFactory: appInitializerFactory,
    deps: [TranslateService],
    multi: true
  }, {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }, {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }

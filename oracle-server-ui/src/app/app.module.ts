import { HttpClient, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { MaterialModule } from './shared/modules/material/material.module';

import { AppComponent } from './app.component';
import { OracleComponent } from './oracle/oracle.component';
import { NewEventComponent } from './new-event/new-event.component';
import { MoreInfoComponent } from './component/more-info/more-info.component';
import { EventDetailComponent } from './event-detail/event-detail.component';
import { LastResultDetailComponent } from './last-result-detail/last-result-detail.component';
import { SignMessageComponent } from './sign-message/sign-message.component';

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
    OracleComponent,
    NewEventComponent,
    MoreInfoComponent,
    EventDetailComponent,
    LastResultDetailComponent,
    SignMessageComponent
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
  ],
  providers: [{
    provide: APP_INITIALIZER,
    useFactory: appInitializerFactory,
    deps: [TranslateService],
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }

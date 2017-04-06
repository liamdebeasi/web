import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { GoogleMaps } from '@ionic-native/google-maps';

import { DataProvider } from '../providers/data';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { Alerts } from '../pages/alerts/alerts';
import { ChangeDirection } from '../pages/changeDirection/changeDirection';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    ChangeDirection,
    Alerts
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, [DataProvider])
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    ChangeDirection,
    Alerts
  ],
  providers: [
    StatusBar,
    SplashScreen,
    GoogleMaps,
    DataProvider,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}

import { Component } from '@angular/core';
import { NavController, PopoverController, ModalController, Platform } from 'ionic-angular';

import { GoogleMaps, GoogleMap, GoogleMapsEvent, LatLng } from '@ionic-native/google-maps';
import { SplashScreen } from '@ionic-native/splash-screen';

import { ChangeDirection } from '../changeDirection/changeDirection';
import { Alerts } from '../alerts/alerts';
import { DataProvider } from '../../providers/data';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
    
    public direction: string = this.data.getData('direction');
    public alerts: boolean = this.data.getData('alerts');
    public destination: string = this.data.getData('destination');
    public destinationETA: string = this.data.getData('destinationETA');
    public map: GoogleMap;

    constructor(private platform: Platform, public navCtrl: NavController, private maps: GoogleMaps, private popoverCtrl: PopoverController, private modalCtrl: ModalController, private data: DataProvider, private splashScreen: SplashScreen) {
        
        // once the platform is ready, all Ionic Native plugins
        // are available, so we can initialize the map
        platform.ready().then(() => { this.loadMap(); });
        
        // Watch for change in alerts
        this.data.eventEmitters.alerts.subscribe((data) => { this.alerts = data; });
        
        // Watch for change in direction
        this.data.eventEmitters.direction.subscribe((data) => { this.direction = data; });
        
        // Watch for change in destination
        this.data.eventEmitters.destination.subscribe((data) => { this.destination = data; });
    }
    
    presentPopover(event: any): void {
        this.map.setClickable(false);
        
        let popover = this.popoverCtrl.create(ChangeDirection);
        popover.present({ ev: event });
        
        popover.onDidDismiss(() => { this.map.setClickable(true); });
    }
    
    presentAlertsModal(): void {
        this.map.setClickable(false);
        
        let modal = this.modalCtrl.create(Alerts, { route: 'test' });
        modal.present();
        
        modal.onDidDismiss(() => { this.map.setClickable(true); });
    }

    getLocation(firstTime: boolean = false): void {
        
        this.map.getMyLocation(function(location) {
            
            // set location of map
            let myLocation: LatLng = new LatLng(location.latLng.lat, location.latLng.lng);
            
            if (firstTime) {
                
                this.map.moveCamera({
                    target: myLocation,
                    zoom: 18,
                    tilt: 30
                });
                
                // if in bootup, only hide splashscreen once map has
                // been painted and user location has been found
                // otherwise the app looks janky
                this.splashScreen.hide();
            } else {
                
                this.map.animateCamera({
                    target: myLocation,
                    zoom: 18,
                    tilt: 30,
                    duration: 1000
                });  
            }        
            
        }.bind(this));
        
    }
    
    loadMap(): void {
        
        // Create map element
        let element: HTMLElement = document.getElementById('map');
        this.map = this.maps.create(element);        

        // listen for MAP_READY event
        // must wait for this to fire before adding anything to map
        this.map.one(GoogleMapsEvent.MAP_READY).then(() => { this.getLocation(true); });
    }
    

}

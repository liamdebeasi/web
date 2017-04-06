import { Component } from '@angular/core';
import { NavController, PopoverController, ModalController, Platform } from 'ionic-angular';
import { GoogleMaps, GoogleMap, GoogleMapsEvent, LatLng } from '@ionic-native/google-maps';

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

    constructor(private platform: Platform, public navCtrl: NavController, private maps: GoogleMaps, private popoverCtrl: PopoverController, private modalCtrl: ModalController, private data: DataProvider) {
        
        // once the platform is ready, all Ionic Native plugins
        // are available, so we can initialize the map
        platform.ready().then(() => {
            this.loadMap();
        });
        
        // Watch for change in alerts
        this.data.eventEmitters.alerts.subscribe(
            (data) => {
                this.alerts = data;
            }
        );
        
        // Watch for change in direction
        this.data.eventEmitters.direction.subscribe(
            (data) => {
                this.direction = data;
            }
        );
        
        // Watch for change in destination
        this.data.eventEmitters.destination.subscribe(
            (data) => {
                this.destination = data;
            }
        );
    }
    
    presentPopover(event: any): void {
        let popover = this.popoverCtrl.create(ChangeDirection);
        popover.present({
            ev: event
        });
    }
    
    presentAlertsModal(): void {
        let modal = this.modalCtrl.create(Alerts, { route: 'test' });
        modal.present();
    }

    getLocation(duration: number = 1000): void {
        
        this.map.getMyLocation(function(location) {
            // set location of map
            let myLocation: LatLng = new LatLng(location.latLng.lat, location.latLng.lng);
            this.map.animateCamera({
                target: myLocation,
                zoom: 18,
                tilt: 30,
                duration: duration
            });            
            
        }.bind(this));
        
    }
    
    loadMap(): void {
        
        // Create map element
        let element: HTMLElement = document.getElementById('map');
        this.map = this.maps.create(element);        

        // listen for MAP_READY event
        // must wait for this to fire before adding anything to map
        this.map.one(GoogleMapsEvent.MAP_READY).then(() => {
            
            this.getLocation(0);
        
        });
    }

}

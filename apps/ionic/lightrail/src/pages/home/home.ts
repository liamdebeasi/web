import { Component } from '@angular/core';
import { NavController, PopoverController, ModalController, Platform } from 'ionic-angular';

import { GoogleMaps, GoogleMap, GoogleMapsEvent, Marker, LatLng } from '@ionic-native/google-maps';
import { SplashScreen } from '@ionic-native/splash-screen';

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
    public location: any = this.data.getData('location');
    public locationMarker: Marker;
    
    public stops: Array<any> = this.data.getData('stops');
    
    public console: Array<string> = [];
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
        
        // Watch for change in destination ETA
        this.data.eventEmitters.destinationETA.subscribe((data) => { this.destinationETA = data; });
        
        // Watch for change in stops
        this.data.eventEmitters.stops.subscribe((data) => { setTimeout(function() { this.updateStops(data); }.bind(this), 3000); });
        
        // Watch for change in location
        this.data.eventEmitters.location.subscribe((data) => { 
            this.location = data;
            this.updateLocation();
            
            if (this.console.length > 5) {
                this.console = [];
            }
            this.console.push(this.location.lat + ", " + this.location.lng);
        });
                
    }
    
    public updateStops(data: any): void {

        // Go through each line on the greeline
        for (var l in data) {
            var line = data[l];
            var polyLine = [];
            
            // go through each stop on a specific line l
            for (var s in line.data['Outbound']) {
                
                var stop = line.data['Outbound'][s];
                var stopLocation = new LatLng(stop.stop_lat, stop.stop_lon);
                
                let parentStation = stop.parent_station;
                
                // push stop to array of lines
                polyLine.push(stopLocation);
                
                // add a stop marker to the screen
                this.map.addMarker({ 
                    position: stopLocation,
                    title: stop.parent_station_name,
                    icon: { url: 'file:///android_asset/www/assets/icon/stop.png', size: { width: 18, height: 18 } },
                    markerClick: function(marker) {
                        this.data.setStation(marker.get('lightrailName'));
                        
                    }.bind(this)
                }).then((marker: Marker) => { marker.set('lightrailName', parentStation) });
            }
            
            this.map.addPolyline({
              points: polyLine,
              'color' : '#6EBB1F',
              'width': 8,
              'geodesic': false
            });

        }

    }
    
    changeDirection(): void {
        if (this.direction == 'Inbound') {
            this.data.setData('direction', 'Outbound');
        } else {
            this.data.setData('direction', 'Inbound');
        }
        
        this.data.changeDirection();
    }

    presentAlertsModal(): void {
        this.map.setClickable(false);
        
        let modal = this.modalCtrl.create(Alerts, { route: 'test' });
        modal.present();
        
        modal.onDidDismiss(() => { this.map.setClickable(true); });
    }
    
    // gets a quick, less precise location
    // on startup or when user taps location button
    // otherwise, we would just use the watch position method 
    // in the geolocation library
    
    // first: whether or not this is first load
    getQuickLocation(first: boolean = false): void {
        
        console.log('getting quick location');
        this.map.getMyLocation(function(location) {
            
            // set location of map
            let myLocation: LatLng = new LatLng(location.latLng.lat, location.latLng.lng);
            
            if (first) {
                
                this.map.moveCamera({
                    target: myLocation,
                    zoom: 15,
                    tilt: 30
                });
            

                this.map.addMarker({ position: myLocation, title: "Current Location", icon: { url: 'file:///android_asset/www/assets/icon/marker.png', size: { width: 20, height: 20 } } })
                    .then((marker: Marker) => {                        
                        this.locationMarker = marker;
                        console.log(this.locationMarker);
                    });
                
                // if in bootup, only hide splashscreen once map has
                // been painted and user location has been found
                // otherwise the app looks janky
                this.splashScreen.hide();
            } else {
                
                this.map.animateCamera({
                    target: myLocation,
                    zoom: 15,
                    tilt: 30,
                    duration: 1000
                });  
                
                this.locationMarker.setPosition(myLocation);
                
            }    
            
            
            console.log(this.map);    
            
        }.bind(this));
    }

    updateLocation(): void {
        
        var myLocation = new LatLng(this.location.lat, this.location.lng);
        
        this.map.animateCamera({
            target: myLocation,
            zoom: 15,
            tilt: 30,
            duration: 1000
        }); 
        
        try {
            this.locationMarker.setPosition(myLocation);
        } catch(e) {
            console.log(e);
        }
    }
    
    loadMap(): void {
        
        // Create map element
        let element: HTMLElement = document.getElementById('map');
        this.map = this.maps.create(element);     
        
        // listen for MAP_READY event
        // must wait for this to fire before adding anything to map
        this.map.one(GoogleMapsEvent.MAP_READY).then(() => { this.getQuickLocation(true); });
        
        // debug -- remove this to pan map
        //this.map.setClickable(false);
    }
    

}

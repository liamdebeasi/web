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
    
    public mapIsLoaded: boolean = false;
    
    public stops: Array<any> = this.data.getData('stops');
    
    public allVehicles = {};
    
    public imagePath: string;
    
    constructor(private platform: Platform, public navCtrl: NavController, private maps: GoogleMaps, private popoverCtrl: PopoverController, private modalCtrl: ModalController, private data: DataProvider, private splashScreen: SplashScreen) {
        
        // once the platform is ready, all Ionic Native plugins
        // are available, so we can initialize the map
        platform.ready().then(() => { this.loadMap(); });
        
        // Watch for change in alerts
        this.data.eventEmitters.alerts.subscribe((data) => { this.alerts = data; });
        
        // Watch for change in direction
        this.data.eventEmitters.direction.subscribe((data) => { this.direction = data; this.updateVehicleVisibility(); });
        
        // Watch for change in destination
        this.data.eventEmitters.destination.subscribe((data) => { this.destination = data; });
        
        // Watch for change in destination ETA
        this.data.eventEmitters.destinationETA.subscribe((data) => { this.destinationETA = data; });
        
        // Watch for change in stops
        this.data.eventEmitters.stops.subscribe((data) => { this.stops = data; if (this.mapIsLoaded) { this.updateStops(data); } });
        
        // Watch for change in vehicle locations
        this.data.eventEmitters.vehicles.subscribe((data) => { console.log('emitted vehicle locations'); this.vehicleHandler(data); });
        
        // Watch for change in location
        this.data.eventEmitters.location.subscribe((data) => { 
            this.location = data;
            this.updateLocation();
        });
        
        if (platform.is('android')) {
            this.imagePath = 'file:///android_asset/www/';
        } else {
            this.imagePath = '';
        }
    }
    
    public updateVehicleVisibility(): void {
        for (var v in this.allVehicles) {
            
            var vehicle = this.allVehicles[v];
            
            // only show vehicles for current direction
            vehicle.marker.setVisible(vehicle.direction == this.direction);
        }
    }
    
    public vehicleHandler(vehicles: any): void {
        // for each direction
        var activeVehicles = {};
        
        for (var d in vehicles.data) {            
            let direction = vehicles.data[d];
            
            // for each route in that direction
            for (var r in direction) {

                var route = direction[r];
                
                // for each vehicle in this route+direction combo
                for (var v in route) {

                    var vehicle = route[v];
                    // needs to be a constant or else id will just be
                    // last id when marker finally gets added
                    let id = vehicle.vehicle.vehicle_id;
                    let vehicleDirection = d;
                    var lat = vehicle.vehicle.vehicle_lat;
                    var lng = vehicle.vehicle.vehicle_lon;
                    var location = new LatLng(lat, lng);
                    
                    activeVehicles[id] = true;
                                        
                    // if marker already exists, just move it
                    if (id in this.allVehicles) {
                        
                        this.allVehicles[id].marker.setPosition(location);
                        this.allVehicles[id].direction = vehicleDirection;
                        
                        // when trains get to the end of an inbound line, they can become
                        // an outbound train
                        this.allVehicles[id].marker.setVisible( (this.direction == vehicleDirection) ? true : false);                        
                        this.allVehicles[id].marker.setTitle('#' + id + " " + vehicle.trip_name);
                        
                    } else {
                        this.map.addMarker({ 
                            position: location,
                            title: "#" + id + " " + vehicle.trip_name,
                            visible: (this.direction == vehicleDirection) ? true : false,
                            icon: { url: this.imagePath + 'assets/icon/train.png', size: { width: 48, height: 48 } },
                            markerClick: function(marker) {
                                //this.data.setStation(marker.get('lightrailName'));
                                
                            }.bind(this)
                        }).then((marker: Marker) => { console.log('vehicle added as marker'); this.allVehicles[id] = { marker: marker, direction: vehicleDirection };});
                    }
                }
            }
        }
        
        this.cleanUpOldVehicles(activeVehicles);
        
    }
    
    // go through all markers and clean up old markers no longer in use
    public cleanUpOldVehicles(vehicles: any): void {
        console.log(vehicles);
        for (var v in this.allVehicles) {
            if (!(v in vehicles)) {
                console.log('Removed',this.allVehicles[v].marker.getTitle());
                this.allVehicles[v].marker.remove();
                delete this.allVehicles[v]; 
                
                console.log(this.allVehicles);               
            }
        }
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
                    icon: { url: this.imagePath + 'assets/icon/stop.png', size: { width: 18, height: 18 } },
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
    
    // Change direction from inbound to outbound or vice versa
    changeDirection(): void {
        if (this.direction == 'Inbound') {
            this.data.setData('direction', 'Outbound');
        } else {
            this.data.setData('direction', 'Inbound');
        }
        
        this.data.changeDirection();
    }

    // show alerts pane
    presentAlertsModal(): void {
        this.map.setClickable(false);
        
        let modal = this.modalCtrl.create(Alerts);
        modal.present();
        
        modal.onDidDismiss(() => { this.map.setClickable(true); });
    }
    
    // gets a quick, less precise location
    // on startup or when user taps location button
    // otherwise, we would just use the watch position method 
    // in the geolocation library
    // first: whether or not this is first load
    getQuickLocation(first: boolean = false): void {

        this.map.getMyLocation(function(location) {
              
            if (this.stops.length > 0) {
                this.data.setClosestStop(location.latLng.lat, location.latLng.lng);
            }
            
            // set location of map
            let myLocation: LatLng = new LatLng(location.latLng.lat, location.latLng.lng);
            
            if (first) {
                
                this.map.moveCamera({
                    target: myLocation,
                    zoom: 15,
                    tilt: 30
                });
            

                this.map.addMarker({ position: myLocation, title: "Current Location", icon: { url: this.imagePath + 'assets/icon/marker.png', size: { width: 20, height: 20 } } })
                    .then((marker: Marker) => {                        
                        this.locationMarker = marker;
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
                    duration: 500
                });  
                
                this.locationMarker.setPosition(myLocation);
                
            }      
        }.bind(this));
    }

    updateLocation(): void {
        
        var myLocation = new LatLng(this.location.lat, this.location.lng);
        
        this.map.animateCamera({
            target: myLocation,
            zoom: 15,
            tilt: 30,
            duration: 500
        }); 
        
        if (this.locationMarker) {
            try {
                this.locationMarker.setPosition(myLocation);
            } catch(e) {
                console.log(e);
            }
        }
    }
    
    loadMap(): void {
        
        // Create map element
        let element: HTMLElement = document.getElementById('map');
        this.map = this.maps.create(element);     
        
        // listen for MAP_READY event
        // must wait for this to fire before adding anything to map
        this.map.one(GoogleMapsEvent.MAP_READY).then(() => {
            this.mapIsLoaded = true; 
            
            // if we have stops already, add them to the map
            if (this.stops.length > 0) { 
                this.updateStops(this.stops);
            }
            
            this.getQuickLocation(true);
        });
    }
    

}

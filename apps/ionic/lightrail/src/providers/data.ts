import { Platform } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Injectable, EventEmitter } from '@angular/core';

import { Geolocation } from '@ionic-native/geolocation';

declare var webWorker: any;

/* Custom Type Definitions */
interface EventObject {
    alerts: EventEmitter<boolean>,
    direction: EventEmitter<string>,
    destination: EventEmitter<string>,
    destinationETA: EventEmitter<string>,
    alertsData: EventEmitter<Array<any>>,
    location: EventEmitter<any>,
    stops: EventEmitter<Array<any>>,
    vehicles: EventEmitter<any>
}

interface DataObject {
    alerts: boolean,
    direction: string
    destination: string,
    destinationETA: string
    alertsData: Array<any>,
    location: any,
    stops: Array<any>,
    station: string,
    vehicles: any
}

@Injectable()
export class DataProvider {

    /* Data and Event Emitters */
    public transitInfo: DataObject = {
        alerts: true,
        direction: "Inbound",
        destination: "",
        destinationETA: "",
        location: { lat: null, lng: null },
        alertsData: [],
        stops: [],
        station: '',
        vehicles: {}
    }
    
    public eventEmitters: EventObject = {
        alerts: new EventEmitter(),
        direction: new EventEmitter(),
        destination: new EventEmitter(),
        destinationETA: new EventEmitter(),
        alertsData: new EventEmitter(),
        location: new EventEmitter(),
        stops: new EventEmitter(),
        vehicles: new EventEmitter()
    }
    
    public lastRequest: any;
        
    /* DataProvider Constructor */
    constructor(private platform: Platform, private geolocation: Geolocation, private storage: Storage) {
        // Add watcher for when web worker sends message to main thread
        webWorker.addEventListener('message', this.handleWebWorkerMessage.bind(this));
        
        // Get all Greenline stops
        this.storage.ready().then(() => {
            this.storage.get('stops').then((val) => {

                // if we have them stored locally,
                // just retrieve them from the cache
                if (val) {
                    this.setData('stops', JSON.parse(val));
                    console.log(this.transitInfo.stops);
                    
                // otherwise, ping the server for a set of data
                } else {
                    webWorker.postMessage( { type: 'getStops' } );
                }
            });
        });
        
        webWorker.postMessage( { type: 'getVehicleLocations', payload: { routes: 'Green-B,Green-C,Green-D,Green-E' } });
        
        // Watch user's location
        let watch = this.geolocation.watchPosition();
        watch.subscribe((resp) => {
            if (resp.coords) { 
                var roundedLat = resp.coords.latitude.toFixed(6);
                var roundedLng = resp.coords.longitude.toFixed(6);
                
                var location = this.getData('location');
                
                console.log('got new location of',roundedLat + ',',roundedLng);

                if (location.lat != roundedLat || location.lng != roundedLng) {     
                    console.log('updating location', { lat: roundedLat, lng: roundedLng});  
                    this.setData('location', { lat: roundedLat, lng: roundedLng}); 
                }
                
            } else {
                console.log('Error getting updated location');
            }
        });
        
        // every 20 seconds fetch new prediction for the stop AND get updated vehicle locations
        setInterval(function(){
            webWorker.postMessage( { type: 'getPredictionForStop', payload: { stop: this.getData('station') } });
            webWorker.postMessage( { type: 'getVehicleLocations', payload: { routes: 'Green-B,Green-C,Green-D,Green-E' } });
        }.bind(this), 20000);
    }
    
    public changeDirection(): void {
        // since we save both the outbound and inbound data
        // for a stop, we can just quickly update it here
        // without having to make a new request        
        var trip = this.lastRequest[this.getData('direction')];
        
        this.setData('destination', trip.destination);
        this.setData('destinationETA', trip.destinationETA);
    }
    
    // User tapped a new station marker
    public setStation(stop: string): any {
        console.log('setting station to',stop);
        this.setData('station', stop);
        webWorker.postMessage( { type: 'getPredictionForStop', payload: { stop: stop } });
        return true;
    }
    
    // handle response from web worker
    public handleWebWorkerMessage(res: any): void {

        switch(res.data.type) {
            case "getStops":
                this.setData('stops', res.data.data.data);
                            
                // save to local storage
                // so we do not have to ping server next time
                this.storage.set('stops', JSON.stringify(res.data.data.data));
                break;
                
            case "getPredictionForStop":
                console.log('got predictions',res.data.data.data);
            
                this.lastRequest = res.data.data.data;
            
                var trip = res.data.data.data[this.getData('direction')];
                var alerts = res.data.data.data.alerts;
                
                this.setData('destination', trip.destination);
                this.setData('destinationETA', trip.destinationETA);
                
                if (alerts.length > 0) {
                    this.setData('alertsData', alerts);
                    this.setData('alerts', true);
                } else {
                    this.setData('alerts', false);
                }
                break;
            
            case "getVehicleLocations":

                this.setData('vehicles', res.data.data.data);
                break;
                
            default:
                console.error("Unknown command");
                break;
        }

    }

    /* Data Provider Methods */
    public getData(key: string): any {
        return this.transitInfo[key];
    }
    
    public setData(key: string, value: any): void {
        this.transitInfo[key] = value;
        if (this.eventEmitters[key]) {
            this.eventEmitters[key].emit(this.transitInfo[key]);
        }
    }
    
    // From: http://stackoverflow.com/questions/17807915/using-the-haversine-formula-in-javascript-with-variables
    public deg2rad(degrees: number): number {
        return degrees * (Math.PI/180);
    }

    public Haversine(lat1: number, lon1: number, lat2: number, lon2: number): string {
        var deltaLat = lat2 - lat1 ;
        var deltaLon = lon2 - lon1 ;
        var earthRadius =  6369087 ; // in meters 3959 in miles.
        var alpha    = deltaLat/2;
        var beta     = deltaLon/2;
        var a        = Math.sin(this.deg2rad(alpha)) * Math.sin(this.deg2rad(alpha)) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(this.deg2rad(beta)) * Math.sin(this.deg2rad(beta)) ;
        var c        = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var distance =  earthRadius * c;
        return distance.toFixed(2);
    }
    
    public setClosestStop(latitude: number, longitude: number): void {
        var closestStopLine = null;
        var closestStopStation = null;
        var closestDistance = null;
        
        for (var l in this.transitInfo.stops) {
            var line = this.transitInfo.stops[l];
            for (var s in line.data.Inbound) {
                var stop = line.data.Inbound[s];
                var distance = parseFloat(this.Haversine(latitude, longitude, stop.stop_lat, stop.stop_lon));
                //console.log('Distance between ',latitude,',',longitude,'and',stop.stop_lat,',',stop.stop_lon,'is:',distance);
                //console.log(typeof(distance),typeof(closestDistance));
                if (closestDistance === null || distance < closestDistance) {
                    //console.log('setting closest');
                    closestDistance = distance;
                    closestStopStation = s;
                    closestStopLine = l;
                }
                //console.log('closests is',closestDistance);
            }            
        }
        
        try {
            this.setStation(this.transitInfo.stops[closestStopLine].data.Inbound[closestStopStation].parent_station);
        } catch(e) {
            console.log(e);
        }
        
    }
    
}
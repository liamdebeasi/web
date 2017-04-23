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
    stops: EventEmitter<Array<any>>
}

interface DataObject {
    alerts: boolean,
    direction: string
    destination: string,
    destinationETA: string
    alertsData: Array<any>,
    location: any,
    stops: Array<any>,
    station: string
}

@Injectable()
export class DataProvider {

    /* Data and Event Emitters */
    public transitInfo: DataObject = {
        alerts: true,
        direction: "Inbound",
        destination: "Boston Univ. East",
        destinationETA: "5 mins to",
        location: { lat: null, lng: null },
        alertsData: [],
        stops: [],
        station: ''
    }
    
    public eventEmitters: EventObject = {
        alerts: new EventEmitter(),
        direction: new EventEmitter(),
        destination: new EventEmitter(),
        destinationETA: new EventEmitter(),
        alertsData: new EventEmitter(),
        location: new EventEmitter(),
        stops: new EventEmitter()
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
                    
                // otherwise, ping the server for a set of data
                } else {
                    webWorker.postMessage( { type: 'getStops' } );
                }
            });
        });
        
        // Watch user's location
        let watch = this.geolocation.watchPosition();
        watch.subscribe((resp) => {
            if (resp.coords) { 
                this.setData('location', { lat: resp.coords.latitude, lng: resp.coords.longitude }); 
            } else {
                console.log('Error getting updated location');
            }
        });
        
        // every 20 seconds fetch new prediction for the stop
        setInterval(function(){
            webWorker.postMessage( { type: 'getPredictionForStop', payload: { stop: this.getData('station') } });
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
    
}
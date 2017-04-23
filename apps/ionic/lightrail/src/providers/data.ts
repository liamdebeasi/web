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
    stops: Array<any>
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
        stops: []
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
                console.log('Updated location:',resp);
                this.setData('location', { lat: resp.coords.latitude, lng: resp.coords.longitude }); 
            } else {
                console.log('Error getting updated location');
            }
        });
    }
    
    public changeDirection(): void {
        // since we save both the outbound and inbound data
        // for a stop, we can just quickly update it here
        // without having to make a new request
        console.log(this.lastRequest);
        
        var trip = this.lastRequest[this.getData('direction')];
        var stop_name = this.lastRequest.stop_name;
        
        if (trip) {
            var formattedETA = (Math.floor(parseInt(trip.pre_away)/60)).toString() + " mins to";
            
            this.setData('destination', stop_name);
            this.setData('destinationETA', formattedETA);
        } else {
            // sometimes the MBTA doesn't provide predictions for certain stops/direction combos (i.e. Fenway Outbound)
            this.setData('destination', '');
            this.setData('destinationETA', 'No predictions for this station');
        }
    }
    
    public setStation(stop: string): any {
        console.log('setting station');
        webWorker.postMessage( { type: 'getPredictionForStop', payload: { stop: stop } });
        return true;
    }
    
    public handleWebWorkerMessage(res: any): void {
        var type = res.data.type;
        
        if (type == 'getStops') { 
            this.setData('stops', res.data.data.data);
            
            // save to local storage
            // so we do not have to ping server next time
            this.storage.set('stops', JSON.stringify(res.data.data.data));
        } else if (type == 'getPredictionForStop') {
            
            this.lastRequest = res.data.data.data;
            
            var trip = res.data.data.data[this.getData('direction')];
            var alerts = res.data.data.data.alerts;
            var stop_name = res.data.data.data.stop_name;
            console.log(res.data.data.data);
            if (trip) {
                var formattedETA = (Math.floor(parseInt(trip.pre_away)/60)).toString() + " mins to";
                
                this.setData('destination', stop_name);
                this.setData('destinationETA', formattedETA);
            } else {
                // sometimes the MBTA doesn't provide predictions for certain stops/direction combos (i.e. Fenway Outbound)
                this.setData('destination', '');
                this.setData('destinationETA', 'No predictions for this station');
            }
            
            if (alerts.length > 0) {
                this.setData('alertsData', alerts);
                this.setData('alerts', true);
            } else {
                this.setData('alerts', false);
            }
        }
    }

    /* Data Provider Methods */
    public getData(key: string): any {
        return this.transitInfo[key];
    }
    
    public setData(key: string, value: any): void {
        this.transitInfo[key] = value;
        this.eventEmitters[key].emit(this.transitInfo[key]);
    }
    
}
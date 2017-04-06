import { Platform } from 'ionic-angular';
import { Injectable, EventEmitter } from '@angular/core';

/* Custom Type Definitions */
interface EventObject {
    alerts: EventEmitter<boolean>,
    direction: EventEmitter<string>,
    destination: EventEmitter<string>,
    destinationETA: EventEmitter<string>,
    alertsData: EventEmitter<Array<any>>
}

interface DataObject {
    alerts: boolean,
    direction: string
    destination: string,
    destinationETA: string
    alertsData: Array<any>
}

@Injectable()
export class DataProvider {

    /* Data and Event Emitters */
    public transitInfo: DataObject = {
        alerts: true,
        direction: "Inbound",
        destination: "Boston Univ. East",
        destinationETA: "5 mins",
        alertsData: [
            {
                'header': 'Service Change',
                'content': 'Pedestrian access to North Station will be along Legends Way through April 2017, due to the Hub on Causeway Project'
            },
            {
                'header': 'Shuttle',
                'content': 'Buses will replace Red Line service between Harvard and Alewife Stations during the weekends of April 29 - 30 from start to end of service.'
            },
            {
                'header': 'Delay',
                'content': 'Fitchburg Line Train 428 (8:25 pm from Wachusett) is operating 5-15 minutes behind schedule between Fitchburg Station & North Station.'
            },
            {
                'header': 'Service Change',
                'content': 'Pedestrian access to North Station will be along Legends Way through April 2017, due to the Hub on Causeway Project'
            },
            {
                'header': 'Shuttle',
                'content': 'Buses will replace Red Line service between Harvard and Alewife Stations during the weekends of April 29 - 30 from start to end of service.'
            },
            {
                'header': 'Delay',
                'content': 'Fitchburg Line Train 428 (8:25 pm from Wachusett) is operating 5-15 minutes behind schedule between Fitchburg Station & North Station.'
            },
            {
                'header': 'Service Change',
                'content': 'Pedestrian access to North Station will be along Legends Way through April 2017, due to the Hub on Causeway Project'
            },
            {
                'header': 'Shuttle',
                'content': 'Buses will replace Red Line service between Harvard and Alewife Stations during the weekends of April 29 - 30 from start to end of service.'
            },
            {
                'header': 'Delay',
                'content': 'Fitchburg Line Train 428 (8:25 pm from Wachusett) is operating 5-15 minutes behind schedule between Fitchburg Station & North Station.'
            },
            {
                'header': 'Service Change',
                'content': 'Pedestrian access to North Station will be along Legends Way through April 2017, due to the Hub on Causeway Project'
            },
            {
                'header': 'Shuttle',
                'content': 'Buses will replace Red Line service between Harvard and Alewife Stations during the weekends of April 29 - 30 from start to end of service.'
            },
            {
                'header': 'Delay',
                'content': 'Fitchburg Line Train 428 (8:25 pm from Wachusett) is operating 5-15 minutes behind schedule between Fitchburg Station & North Station.'
            }
            
        ]

    }
    
    public eventEmitters: EventObject = {
        alerts: new EventEmitter(),
        direction: new EventEmitter(),
        destination: new EventEmitter(),
        destinationETA: new EventEmitter(),
        alertsData: new EventEmitter()
    }
        
    /* DataProvider Constructor */
    constructor(private platform: Platform) {
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
import { Component } from '@angular/core';
import { NavController, ViewController } from 'ionic-angular';

@Component({
    selector: 'modal-alerts',
    templateUrl: 'alerts.html'
})
export class Alerts {
    
    public cards: Array<any> = [
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
    
    constructor(public navCtrl: NavController, private viewCtrl: ViewController) {
    }
    
    _dismiss(): void {
        this.viewCtrl.dismiss();
    }


}

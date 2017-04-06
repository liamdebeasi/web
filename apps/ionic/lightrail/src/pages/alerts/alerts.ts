import { Component } from '@angular/core';
import { NavController, ViewController } from 'ionic-angular';

import { DataProvider } from '../../providers/data';

@Component({
    selector: 'modal-alerts',
    templateUrl: 'alerts.html'
})
export class Alerts {
    
    public cards: Array<any> = this.data.getData('alertsData');
    
    constructor(public navCtrl: NavController, private viewCtrl: ViewController, private data: DataProvider) {
        this.data.eventEmitters.alertsData.subscribe(
            (data) => {
                this.cards = data;
            }
        );
    }
    
    _dismiss(): void {
        this.viewCtrl.dismiss();
    }


}

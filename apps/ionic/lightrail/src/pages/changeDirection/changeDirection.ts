import { Component } from '@angular/core';
import { NavController, ViewController } from 'ionic-angular';

import { DataProvider } from '../../providers/data';

@Component({
    selector: 'popover-change-direction',
    templateUrl: 'changeDirection.html'
})
export class ChangeDirection {
    
    public direction: string = this.data.getData('direction');
    
    constructor(public navCtrl: NavController, public viewCtrl: ViewController, private data: DataProvider) {

    }
    
    doChange(newDirection: string): void {
        this.data.setData('direction', newDirection);
        this.viewCtrl.dismiss();
    }

}

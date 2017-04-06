import { Component } from '@angular/core';
import { NavController, ViewController } from 'ionic-angular';

@Component({
    selector: 'popover-change-direction',
    templateUrl: 'changeDirection.html'
})
export class ChangeDirection {
    
    constructor(public navCtrl: NavController, public viewCtrl: ViewController) {

    }
    
    doChange(): void {
        this.viewCtrl.dismiss();
    }

}

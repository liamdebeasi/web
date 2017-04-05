import { Component } from '@angular/core';

import { NavController } from 'ionic-angular';

import {
 GoogleMap,
 GoogleMapsEvent,
 GoogleMapsLatLng,
 CameraPosition,
 GoogleMapsMarkerOptions,
 GoogleMapsMarker,
 Geolocation
} from 'ionic-native';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController) {
    
  }
  
  // Load map only after view is initialize
  ngAfterViewInit() {
      
      var scope = this;
      Geolocation.getCurrentPosition().then((resp) => {
        scope.loadMap(resp.coords.latitude,resp.coords.longitude);
    }).catch((error) => {
        console.log('Error getting location', error);
    });
      
      
    
  }
  
  public loadMap(lat: number, lng: number) {
     // make sure to create following structure in your view.html file
     // and add a height (for example 100%) to it, else the map won't be visible
     // <ion-content>
     //  <div #map id="map" style="height:100%;"></div>
     // </ion-content>
    
     // create a new map by passing HTMLElement
     let element: HTMLElement = document.getElementById('map');
    
     let map = new GoogleMap(element);
    
     // listen to MAP_READY event
     map.one(GoogleMapsEvent.MAP_READY).then(() => {
          console.log('Map is ready!');
          
          
        let ionic: GoogleMapsLatLng = new GoogleMapsLatLng(lat, lng);
    
        // create CameraPosition
        let position: CameraPosition = {
            target: ionic,
            zoom: 18,
            tilt: 30
        };
    
        // move the map's camera to position
        map.moveCamera(position);
    
        // create new marker
        let markerOptions: GoogleMapsMarkerOptions = {
            position: ionic,
            title: 'Current location'
        };
    
        map.addMarker(markerOptions).then((marker: GoogleMapsMarker) => {
            marker.showInfoWindow();
        });
     });
  }

}

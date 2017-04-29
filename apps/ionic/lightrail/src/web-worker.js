onmessage = function(e) {
    switch(e.data.type) {
        case "getStops":
            
            fetch('https://69g7s44ull.execute-api.us-west-2.amazonaws.com/prod/getAllStops?color=green')
            	.then(function(res) {
            		 if (res.status !== 200) {
            			self.postMessage({ success: false, type: 'getStops', data: res.status});
                     }
            
            		res.json().then(function(data) {
            			self.postMessage({ success: true, type: 'getStops', data: data });
                    });
            }).catch(function(e) {
            	self.postMessage({ success: false, type: 'getStops', data: e });
            });
            
            break;   
            
        case "getPredictionForStop":
            if (e.data.payload.stop) {
                console.log('https://69g7s44ull.execute-api.us-west-2.amazonaws.com/prod/getPredictionForStop?stop=' + e.data.payload.stop);
                fetch('https://69g7s44ull.execute-api.us-west-2.amazonaws.com/prod/getPredictionForStop?stop=' + e.data.payload.stop)
                	.then(function(res) {
                		 if (res.status !== 200) {
                			self.postMessage({ success: false, type: 'getPredictionForStop', data: res.status});
                         }
                
                		res.json().then(function(data) {
                    		var trips = data.data;
                    		console.log('getprediction data',trips);
                    		    
                    		if ("Inbound" in trips) {
                                var trip = trips.Inbound;
                                var formattedETA = (Math.floor(parseInt(trip.pre_away)/60)).toString() + " mins to";
                                trips.Inbound = { destinationETA: formattedETA, destination: trips.stop_name }
                    		} else {
                        		trips.Inbound = { destinationETA: "No predictions for this station", destination: '' }
                    		}
                    		
                    		if ("Outbound" in trips) {
                                var trip = trips.Outbound;
                                var formattedETA = (Math.floor(parseInt(trip.pre_away)/60)).toString() + " mins to";
                                trips.Outbound = { destinationETA: formattedETA, destination: trips.stop_name }
                    		} else {
                        		trips.Outbound = { destinationETA: "No predictions for this station", destination: '' }
                    		}
                    		
                			self.postMessage({ success: true, type: 'getPredictionForStop', data: data });
                        });
                }).catch(function(e) {
                	self.postMessage({ success: false, type: 'getStops', data: e });
                });
            }
            
            break;
            
        case "getVehicleLocations":
            console.log('made request for vehicle locations');
            if (e.data.payload.routes) {
        
                fetch('https://69g7s44ull.execute-api.us-west-2.amazonaws.com/prod/getVehicleLocations?routes=' + e.data.payload.routes)
                	.then(function(res) {
                		 if (res.status !== 200) {
                			self.postMessage({ success: false, type: 'getVehicleLocations', data: res.status});
                         }
                
                		res.json().then(function(data) {
                    		console.log('got vehicle locations');
                			self.postMessage({ success: true, type: 'getVehicleLocations', data: data });
                        });
                }).catch(function(e) {
                	self.postMessage({ success: false, type: 'getVehicleLocations', data: e });
                });
            }
                
        
            break;
        
        default:
            console.log('default');
            break;
        
    }
}
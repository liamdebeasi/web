onmessage = function(e) {
    switch(e.data.type) {
        case "getStops":
            
            fetch('https://mighty-mesa-25607.herokuapp.com/getAllStops?color=green')
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
                fetch('https://mighty-mesa-25607.herokuapp.com/getPredictionForStop?stop=' + e.data.payload.stop)
                	.then(function(res) {
                		 if (res.status !== 200) {
                			self.postMessage({ success: false, type: 'getPredictionForStop', data: res.status});
                         }
                
                		res.json().then(function(data) {
                    		var trips = data.data;
    
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
                    		
                    		console.log(trips);
                			self.postMessage({ success: true, type: 'getPredictionForStop', data: data });
                        });
                }).catch(function(e) {
                	self.postMessage({ success: false, type: 'getStops', data: e });
                });
            }
            
            break;
        
        default:
            console.log('default');
            break;
        
    }
}
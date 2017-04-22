onmessage = function(e) {
    switch(e.data.type) {
        case "getStops":
            
            fetch('http://155.41.85.118:8888/getAllStops?color=green')
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

            fetch('http://155.41.85.118:8888/getPredictionForStop?stop=' + e.data.payload.stop)
            	.then(function(res) {
            		 if (res.status !== 200) {
            			self.postMessage({ success: false, type: 'getPredictionForStop', data: res.status});
                     }
            
            		res.json().then(function(data) {
            			self.postMessage({ success: true, type: 'getPredictionForStop', data: data });
                    });
            }).catch(function(e) {
            	self.postMessage({ success: false, type: 'getStops', data: e });
            });
            
            break;
        
        default:
            console.log('default');
            break;
        
    }
}
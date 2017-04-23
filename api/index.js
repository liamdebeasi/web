/* ------------- Application Setup ------------- */

/**
 * Declare Dependencies
 */
var express = require('express');
var expressSanitizer = require('express-sanitizer');
var bodyParser = require('body-parser');
var fs = require('fs');
var crypto = require('crypto');
var request = require('request');

/**
 * Setup Express server
 * Set JS, CSS, etc location
 * Init express input sanitizer
 * Set the rendering engine to be EJS
 * Use body parser to parse res.body
 */
var app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname + '/assets'));
app.use(expressSanitizer());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


/**
 * Get auth keys
 */
var config;

try {
    config = require('./auth.json');
} catch(err) {
    config = {};
    console.log('Unable to read auth.json');
}

var secret = config.secret;
var apiKey = config.key;

app.engine('html', require('ejs').renderFile)
app.set('view engine', 'ejs');


/* ------------- Application Routing ------------- */

app.get('/getAllStops', function(req, parentRes) {
    var color = req.sanitize(req.query.color);
    
    console.log('request to get all stops');
    
    switch(color) {
        case 'green':
            var urls = [
                { url: 'https://realtime.mbta.com/developer/api/v2/stopsbyroute?api_key=' + apiKey + '&route=Green-B&format=json', line: 'green-b' },
                { url: 'https://realtime.mbta.com/developer/api/v2/stopsbyroute?api_key=' + apiKey + '&route=Green-C&format=json', line: 'green-c' },
                { url: 'https://realtime.mbta.com/developer/api/v2/stopsbyroute?api_key=' + apiKey + '&route=Green-D&format=json', line: 'green-d' },
                { url: 'https://realtime.mbta.com/developer/api/v2/stopsbyroute?api_key=' + apiKey + '&route=Green-E&format=json', line: 'green-e' }
            ];
            var completedRequests = 0;
            var responses = [];
            
            urls.forEach(function(url) {
                
                // create hash for each line for caching on client
                var hash = crypto.createHmac('sha256', secret);
                
                // returned data will be stored here
                var toReturn = {};
                
                // set options for GET request
                var options = {
                    uri: url.url,
                    json: true,
                    method: 'GET'
                };
                
                // do get request
                request(options, function(err, res, body) {
                    
                    // error handling
                    if (err) { parentRes.send(JSON.stringify({ success: false, data: err})); parentRes.end(); }
                    
                    // for each direction, determine if inbound or outbound
                    body.direction.forEach(function(routeDirection) {

                        var direction = (routeDirection.direction_id == '0') ? 'Outbound' : 'Inbound';
                        toReturn[direction] = routeDirection.stop;
                    });
                    
                    // add to return array
                    responses.push({
                        line: url.line,
                        hash: hash.update(toReturn.toString()).digest('hex'),
                        lightRailTimestamp: Date.now(),
                        data: toReturn
                    });
                    
                    completedRequests++;
                    
                    // if completedRequests == urls.length, then we are done
                    if (completedRequests == urls.length) {
                        console.log('done');
                        parentRes.send(JSON.stringify({ success: true, data: responses}));
                        parentRes.end();
                    }
                });
            });
            
            break;
        default:
            parentRes.send(JSON.stringify({ success: false, data: 'Invalid rail color'}));
            parentRes.end(); 
            break;
    }

});


app.get('/getPredictionForStop', function(req, parentRes) {
    var stop = req.sanitize(req.query.stop); 
    
    if (stop) {
        var options = {
            uri: 'https://realtime.mbta.com/developer/api/v2/predictionsbystop?api_key=' + apiKey + '&stop=' + stop + '&format=json',
            json: true,
            method: 'GET'
        };
        
        request(options, function(err, res, body) {
            
            var toReturn = {};
            toReturn.stop_name = body.stop_name;
            toReturn.stop_id = body.stop_id;
            toReturn.alerts = body.alert_headers;
            
            // error handling
            if (err) { parentRes.send(JSON.stringify({ success: false, data: err})); parentRes.end(); }

            toReturn.lightRailTimestamp = Date.now();
            
            for (var d in body.mode[0].route[0].direction) {
                
                // Prediction object
                var location = body.mode[0].route[0].direction[d];
                // Determine direction
                var direction = (location.direction_id == '0') ? 'Outbound' : 'Inbound';

                
                var closestTrain = 0;
                for (var t in location.trip) {
                    var currClosest = parseInt(location.trip[closestTrain].pre_away);
                    var tryClosest = parseInt(location.trip[t].pre_away); 
                    
                    if (tryClosest < currClosest) {
                        closestTrain = t;
                    }
                }
                
                toReturn[direction] = location.trip[closestTrain];
                
            }
            
            parentRes.send(JSON.stringify({ success: true, data: toReturn}));
            parentRes.end();  
    
        });
    } else {
        parentRes.send(JSON.stringify({ success: false, data: 'Invalid stop name'})); 
        parentRes.end();
    }
});

app.get('/getAlertsForStop', function(req, parentRes) {
    var stop = req.sanitize(req.query.stop); 
    
    if (stop) {
        var options = {
            uri: 'https://realtime.mbta.com/developer/api/v2/alertsbystop?api_key=' + apiKey + '&stop=' + stop + '&include_access_alerts=true&include_service_alerts=true&format=json',
            json: true,
            method: 'GET'
        };
        
        request(options, function(err, res, body) {
            
            // error handling
            if (err) { parentRes.send(JSON.stringify({ success: false, data: err})); parentRes.end(); }
            
            body.lightRailTimestamp = Date.now();
            
            parentRes.send(JSON.stringify({ success: true, data: body}));
            parentRes.end();  
    
        });
    } else {
        parentRes.send(JSON.stringify({ success: false, data: 'Invalid stop name'})); 
        parentRes.end();
    }
});
console.log('Server running on port 8888');
app.listen(8888);

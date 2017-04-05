# MBTA API
Node.js server that accesses the MBTA API to be used in DS application.

## Endpoints

### /getAllStops
Type: GET

Parameters: color: Rail color. Accepted values: green

Description: Given a rail color, returns all of the inbound and outbound stops.

### /getPredictionForStop
Type: GET

Parameters: stop: The name of the stop you wish to get predictions for. Refer to the MBTA API Documentation for stop names.

Description: Given a stop, returns the train predictions for the next hour.

### /getAlertsForStop
Type: GET

Parameters: stop: The name of the stop you wish to get predictions for. Refer to the MBTA API Documentation for stop names.

Description: Given a stop, returns the alerts that affect it.

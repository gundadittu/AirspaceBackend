const {google} = require('googleapis');
const calendar = google.calendar('v3');
const OAuth2 = google.auth.OAuth2;
const googleCredentials = require('./google-credentials.json');

const ERROR_RESPONSE = {
	status: "500",
	message:"There was an issue adding to calendar."
};

const TIME_ZONE = 'America/Chicago';

// add location to call
// add proper timezone
exports.addEventToCalendar = function(event) {

  const auth = new OAuth2(
    googleCredentials.web.client_id,
      googleCredentials.web.client_secret,
      googleCredentials.web.redirect_uris[0]
  );

  auth.setCredentials({
      refresh_token: googleCredentials.refresh_token
  });

    return new Promise(function(resolve, reject) {
        calendar.events.insert({
            auth: auth,
            calendarId: 'primary',
            sendUpdates:'all',
            resource: {
            	'location': event.location,
                'summary': event.eventName,
                'description': event.description,
                'start': {
                    'dateTime': event.startTime,
                    'timeZone': TIME_ZONE,
                },
                'end': {
                    'dateTime': event.endTime,
                    'timeZone': TIME_ZONE,
                },
                'guestsCanModify': true,
                'guestsCanInviteOthers': true,
                'attendees': event.attendees
            },
        }, (err, res) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
            	console.log('Request successful');
            	resolve(res.data);
            }
        });
    });
}

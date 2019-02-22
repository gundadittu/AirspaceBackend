const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');
var globalHeader = {
  "content-type": "application/json",
  "authorization": "Bearer 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"
}; 

var unirest = require('unirest');

exports.sendUserCreationEmail = (data) => {
  const recipientEmail = data.recipientEmail || null;

  const msg = {
    to: recipientEmail,
    from: 'hello@airspaceoffice.co',
    subject: 'Sending with SendGrid is Fun',
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  };
  sgMail.send(msg);
}


exports.sendServiceRequestAutoRoutingEmail = (data) => {

  // requestOfficeName
  // requestAddress
  // requestType
  // requestStatus
  // requestHostName
  // requestHostEmail
  // requestTimestamp
  // requestDetails
  // requestImageURL
  // finishedURL
  // inProgressURL

  const recipientEmails = data.recipientEmails || null;
  if (recipientEmails === null) { 
    console.log('No emails found.');
    return 
  }
  const request = data.request || null;
  const requestOfficeName = data.requestOfficeName || null;
  const requestAddress = data.requestAddress || null;
  const requestType = data.requestType || null;
  const requestStatus = data.requestStatus || null;
  const requestHostName = data.requestHostName || null;
  const requestTimestamp = data.requestTimestamp || null;
  const requestDetails = data.requestDetails || null;
  const requestImageURL = data.requestImageURL || null;
  const finishedURL = data.finishedURL || null;
  const inProgressURL = data.inProgressURL || null;

  // let promises = [];
  for (email in recipientEmails) {
    console.log(email);
    const msg = {
      "personalizations": [
        {
          "to": [
            {
              "email": email
            }
          ],
          "dynamic_template_data": {
            "requestOfficeName": requestOfficeName,
            "requestAddress": requestAddress,
            "requestType": requestType,
            "requestStatus": requestStatus,
            "requestHostName": requestHostName,
            "requestTimestamp": requestTimestamp,
            "requestDetails": requestDetails,
            "requestImageURL": requestImageURL,
            "finishedURL": finishedURL,
            "inProgressURL": inProgressURL
          },
          "subject": "Hello, World!"
        }
      ],
      "from": {
        "email": "hello@airspaceoffice.co",
        "name": "Airspace"
      },
      "reply_to": {
        "email": "hello@airspaceoffice.co",
        "name": "Airspace"
      },
      "template_id": "d-8096b5dacb254c8b882816f22d1d11fe"
    };

    var req = unirest("POST", "https://api.sendgrid.com/v3/mail/send");
    req.headers(globalHeader);
    req.type("json");
    req.send(msg);

    req.end(function (res) {
      if (res.error) throw new Error(res.error);
      console.log(res.body);
    });
  }
}

    // const msg = {
    //   to: email,
    //   "filters": {
    //     "templates": {
    //       "settings": {
    //         "enable": 1,
    //         "template_id": "d-11fd18ef38fd401a939e72924b2712ce"
    //       }
    //     }
    //   }, 
    //   "section": {
    //     ":requestOfficeName": requestOfficeName,
    //     ":requestAddress": requestAddress, 
    //     ":requestType": requestType, 
    //     ":requestStatus": requestStatus, 
    //     ":requestHostName": requestHostName, 
    //     ":requestTimestamp": requestTimestamp, 
    //     ":requestDetails": requestDetails, 
    //     ":requestImageURL": requestImageURL, 
    //     ":finishedURL": finishedURL, 
    //     ":inProgressURL": inProgressURL
    //   }
    // };
    // const msg = {
    //   "personalizations": [
    //     {
    //       "to": [
    //         {
    //           "email": email
    //         }
    //       ],
    //       "dynamic_template_data": {
    //         "requestOfficeName": requestOfficeName,
    //         "requestAddress": requestAddress,
    //         "requestType": requestType,
    //         "requestStatus": requestStatus,
    //         "requestHostName": requestHostName,
    //         "requestTimestamp": requestTimestamp,
    //         "requestDetails": requestDetails,
    //         "requestImageURL": requestImageURL,
    //         "finishedURL": finishedURL,
    //         "inProgressURL": inProgressURL
    //       },
    //       "subject": "Hello, World!"
    //     }
    //   ],
    //   "from": {
    //     "email": "hello@airspaceoffice.co",
    //     "name": "Airspace"
    //   }, 
    //   "reply_to": {
    //     "email": "hello@airspaceoffice.co",
    //     "name": "Airspace"
    //   },
    //   "template_id": "d-8096b5dacb254c8b882816f22d1d11fe"
    // };
    // const promise = sgMail.send(msg)
    //   .catch(error => {
    //     console.error(error);
    //     return
    //   })

    // promises.push(promise);
  // return Promise.all(promises);
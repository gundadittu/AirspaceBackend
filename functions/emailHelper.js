const sgMail = require('@sendgrid/mail');
const functions = require('firebase-functions');
sgMail.setApiKey(functions.config().sendgrid.key);

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
  
  // Must provide the below in 'data'
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
    console.error('No emails found.');
    return
  }

  const msg = {
    to: recipientEmails,
    from: { 
      email: 'hello@airspaceoffice.co', 
      name: 'Airspace Office'
    },
    subject: 'Hello world',
    text: 'Hello plain world!',
    html: '<p>Hello HTML world!</p>',
    templateId: 'd-11fd18ef38fd401a939e72924b2712ce',
    dynamic_template_data: data
  };
  return sgMail.sendMultiple(msg);
}
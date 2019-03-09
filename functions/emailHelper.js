const sgMail = require('@sendgrid/mail');
const functions = require('firebase-functions');
sgMail.setApiKey(functions.config().sendgrid.key);

const webAppBaseURL = 'https://airspace-management-app.firebaseapp.com'


exports.sendArrivedRegGuestCreationEmail = (data) => {

  // Need to provide the below in data: 
  // userName
  // userEmail 
  // guestName
  // guestEmail
  // visitingOfficeName
  // visitingOfficeAddress

  const recipientEmail = data.userEmail || null; 
  if (recipientEmail === null) { 
    throw new functions.https.HttpsError('invalid-argument','Did not provide a recipient email.');
  }

  const msg = {
    to: recipientEmail,
    from: {
      email: 'hello@airspaceoffice.co',
      name: 'Airspace Office'
    },
    subject: 'Hello world',
    text: 'Hello plain world!',
    html: '<p>Hello HTML world!</p>',
    templateId: 'd-45ef204372e24d7683ffacdf2a764cc9',
    dynamic_template_data: data
  };
  return sgMail.send(msg);
}

exports.sendRegGuestCreationEmail = (data) => {
  
  // Need to provide the below in data: 
  // guestName
  // hostName
  // visitingOfficeName 
  // visitingOfficeAddress
  // visitingDateTime
  // checkInURL
  // guestEmail

  const recipientEmail = data.guestEmail || null; 
  if (recipientEmail === null) { 
    throw new functions.https.HttpsError('invalid-argument','Did not provide a recipient email.');
  }

  const msg = {
    to: recipientEmail,
    from: {
      email: 'hello@airspaceoffice.co',
      name: 'Airspace Office'
    },
    subject: 'Hello world',
    text: 'Hello plain world!',
    html: '<p>Hello HTML world!</p>',
    templateId: 'd-aec93355f0314291b380afc4c496bc7b',
    dynamic_template_data: data
  };
  return sgMail.send(msg);
}

exports.triggerUserCreationEmail = (userUID, db, admin) => {
  if (userUID === null) {
    throw new functions.https.HttpsError('invalid-argument', 'Need to provide userUID to trigger welcome email.');
  }

  let firstName = null;
  let email = null;
  let officeName = null;

  return db.collection('users').doc(userUID).get()
    .then((docRef) => {
      const data = docRef.data();
      if (data === null) {
        throw new functions.http.HttpsError('not-found', 'Unable to access data for new user');
      }
      firstName = data.firstName || null;
      email = data.email || null;
      if ((firstName === null) && (email === null)) {
        throw new functions.http.HttpsError('not-found', 'Unable to access firstName & email data for new user');
      }
      const officeUIDs = data.offices || null;
      return officeUIDs;
    })
    .then((officeUIDs) => {
      if (officeUIDs === null) {
        throw new functions.http.HttpsError('not-found', 'Unable to access offices for new user');
      }
      const firstOfficeUID = officeUIDs[0] || null;
      if (firstOfficeUID === null) {
        throw new functions.http.HttpsError('not-found', 'New user has no offices');
      }

      return db.collection('offices').doc(firstOfficeUID).get()
        .then(docRef => {
          const data = docRef.data() || null;
          if (data === null) {
            throw new functions.http.HttpsError('not-found', 'Unable to access first office data for new user.');
          }
          const name = data.name || null;
          officeName = name;
          return
        })
    })
    .then(() => {
      const resetPasswordURL = webAppBaseURL+'/createPassword/'+userUID;
      return sendUserCreationEmail({ userName: firstName, officeName: officeName, userEmail: email, resetPasswordURL: resetPasswordURL });
    })
}

const sendUserCreationEmail = (data) => {
  // Need to provide the below in data: 
  // resetPasswordURL
  // userEmail
  // userName

  const recipientEmail = data.userEmail || null;
  if (recipientEmail === null) {
    throw new functions.https.HttpsError('not-found', 'No email address found to send new user welcome email.');
  }

  const msg = {
    to: recipientEmail,
    from: {
      email: 'hello@airspaceoffice.co',
      name: 'Airspace Office'
    },
    subject: 'Hello world',
    text: 'Hello plain world!',
    html: '<p>Hello HTML world!</p>',
    templateId: 'd-576dd7f50b2844c8bac4c3af34da1abe',
    dynamic_template_data: data
  };
  return sgMail.send(msg);
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
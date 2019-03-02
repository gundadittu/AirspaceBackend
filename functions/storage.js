
const functions = require('firebase-functions');

exports.getProfileImageURL = function (userUID, admin) {
  if (userUID === null) {
    throw new functions.https.HttpsError('invalid-arguments', 'Need to provide userUID.');
  }

  const today = new Date();
  var tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowString = tomorrow.toString();

  const bucket = admin.storage().bucket();
  const config = {
    action: 'read',
    expires: tomorrowString
  };

  const file = bucket.file('userProfileImages/' + userUID + '.jpg');
  return file.getSignedUrl(config)
    .then(data => {
      const url = data[0];
      return url;
    })
    .catch(error => {
      throw error;
    })
}

exports.getConferenceRoomImageURL = function (roomUID, admin) {
  if (roomUID === null) {
    throw new functions.https.HttpsError('invalid-arguments', 'Need to provide roomUID.');
  }

  const today = new Date();
  var tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowString = tomorrow.toString();

  const bucket = admin.storage().bucket();

  const config = {
    action: 'read',
    expires: tomorrowString
  };

  const file = bucket.file('conferenceRoomImages/' + roomUID + '.jpg');
  return file.getSignedUrl(config)
    .then(data => {
      const url = data[0];
      return url;
    })
    .catch(error => {
      throw error;
    })
}

exports.getDeskImageURL = function (deskUID, admin) {
  if (deskUID === null) {
    throw new functions.https.HttpsError('invalid-arguments', 'Need to provide deskUID.');
  }

  const today = new Date();
  var tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowString = tomorrow.toString();

  const bucket = admin.storage().bucket();

  const config = {
    action: 'read',
    expires: tomorrowString
  };

  const file = bucket.file('deskImages/' + deskUID + '.jpg');
  return file.getSignedUrl(config)
    .then(data => {
      const url = data[0];
      return url;
    })
    .catch(error => {
      throw error;
    })
}

exports.getEventImageURL = function (eventUID, admin) {
  if (eventUID === null) {
    throw new functions.https.HttpsError('invalid-arguments', 'Need to provide eventUID.');
  }

  const today = new Date();
  var tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowString = tomorrow.toString();

  const bucket = admin.storage().bucket();

  const config = {
    action: 'read',
    expires: tomorrowString
  };

  const file = bucket.file('eventPhotos/' + eventUID + '.jpg');
  return file.getSignedUrl(config)
    .then(data => {
      const url = data[0];
      return url;
    })
    .catch(error => {
      throw error;
    })
}

exports.getServiceRequestImageURL = function (requestUID, admin) {
  if (requestUID === null) {
    throw new functions.https.HttpsError('invalid-arguments', 'Need to provide requestUID.');
  }

  const today = new Date();
  var tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowString = tomorrow.toString();

  const bucket = admin.storage().bucket();

  const config = {
    action: 'read',
    expires: tomorrowString
  };

  const file = bucket.file('serviceRequestImages/' + requestUID);
  return file.getSignedUrl(config)
    .then(data => {
      const url = data[0];
      return url;
    })
    .catch(error => {
      throw error;
    })
}

exports.getOnboardingURL = function (officeUID, admin) {
  if (officeUID === null) {
    throw new functions.https.HttpsError('invalid-arguments', 'Need to provide officeUID.');
  }

  const today = new Date();
  var tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowString = tomorrow.toString();

  const bucket = admin.storage().bucket();

  const config = {
    action: 'read',
    expires: tomorrowString
  };

  const file = bucket.file('onboardingPDFs/' + officeUID + '.pdf');
  return file.getSignedUrl(config)
    .then(data => {
      const url = data[0];
      return url;
    })
    .catch(error => {
      throw error;
    })
}

exports.getFloorplanURL = function (officeUID, admin) {
  if (officeUID === null) {
    throw new functions.https.HttpsError('invalid-arguments', 'Need to provide officeUID.');
  }

  const today = new Date();
  var tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowString = tomorrow.toString();

  const bucket = admin.storage().bucket();

  const config = {
    action: 'read',
    expires: tomorrowString
  };

  const file = bucket.file('floorplanPDFs/' + officeUID + '.jpg');
  return file.getSignedUrl(config)
    .then(data => {
      const url = data[0];
      return url;
    })
    .catch(error => {
      throw error;
    })
}

exports.getBuildingDetailsURL = function (officeUID, admin) {
  if (officeUID === null) {
    throw new functions.https.HttpsError('invalid-arguments', 'Need to provide officeUID.');
  }

  const today = new Date();
  var tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowString = tomorrow.toString();

  const bucket = admin.storage().bucket();

  const config = {
    action: 'read',
    expires: tomorrowString
  };

  const file = bucket.file('buildingDetailPDFs/' + officeUID + '.pdf');
  return file.getSignedUrl(config)
    .then(data => {
      const url = data[0];
      return url;
    })
    .catch(error => {
      throw error;
    })
}
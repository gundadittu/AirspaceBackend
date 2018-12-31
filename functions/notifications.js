const admin = require('firebase-admin');
const functions = require('firebase-functions');

exports.getUsersNotifications = function(data, context, db) {
	const userUID = context.auth.uid || null;

	if (userUID === null) {
		throw new functions.https.HttpsError('invalid-arguments', 'User must be logged in.');
	}

	return db.collection('userNotifications').doc(userUID).collection('notifications').orderBy('timestamp','desc').get()
	.then( docSnapshots => {
		const docsData = docSnapshots.docs.map( x => x.data());
		return docsData;
	})
	.catch( error => {
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
}

exports.updateUserFCMRegToken = function(data, context, db) {
	const uid = context.auth.uid || null;
	const regToken = data.regToken || null;
	const oldToken = data.oldToken || null;

	if (uid === null) {
		throw new functions.https.HttpsError('invalid-arguments','User must be signed in. Must provide guestName, guestEmail, expectedVisitDate, and visitingOfficeUID.');
	}

	const promises = [];
	if (regToken !== null) {
		const dbop1 =  db.collection('users').doc(uid).update({'registrationToken': admin.firestore.FieldValue.arrayUnion(regToken)})
		.then(res => {
			console.log("Successfully added new registrationToken for user: ", uid);
			return
		})
		.catch( error => {
			console.error(error);
			throw new functions.https.HttpsError(error);
		})
		promises.push(dbop1);
	}

	if ((oldToken !== null) && (oldToken !== regToken)) {
		const dbop2 =  db.collection('users').doc(uid).update({'registrationToken': admin.firestore.FieldValue.arrayRemove(oldToken)})
		.then(res => {
			console.log("Successfully removed old registrationToken for user: ", uid);
			return
		})
		.catch( error => {
			console.error(error);
			throw new functions.https.HttpsError(error);
		})
		promises.push(dbop2);
	}

	return Promise.all(promises)
	.catch( error => {
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
}

exports.notifyUserOfArrivedGuest = function(change, context, db) {
	const newValue = change.after.data();
	const oldValue = change.before.data();
	const arrived = newValue.arrived || null;
	const hostUID = oldValue.hostUID || null;
	const guestName = oldValue.guestName || null;

	if (arrived === null || hostUID === null) {
		console.log("Need to provide a value for arrived and hostUID to trigger notification to host.");
		return
	}

	if (arrived === true && (oldValue.arrived === null || oldValue.arrived === false)) {
		return db.collection('users').doc(hostUID).get()
		.then( docRef => {
			if (docRef.exists) {
				const data = docRef.data();
				const registrationTokens = data.registrationToken || null;

				const notificationTitle = 'Your guest has arrived.';
				data.notificationTitle = notificationTitle;
				const notificationBody = 'Please meet '+ guestName +' by the reception area.';
				data.notificationBody = notificationBody;

				registrationTokens.forEach( x => {

					var message = {
						"token" : x,
						"notification" : {
						    "title" : notificationTitle,
						    "body" : notificationBody
						 }
					};

					return admin.messaging().send(message)
					  .then((response) => {
					    // Response is a message ID string.
					    console.log('Successfully sent message:', response);
					    return data
					  })
					  .catch((error) => {
					    console.error(error);
					    throw new functions.https.HttpsError(error);
					  });
				});

				return data;
			} else {
				throw new functions.https.HttpsError('not-found','Unable to find host user in database.');
			}
		})
		.then( arrivedGuestData => {
			const dataDict = { 'registeredGuestUID': context.params.registrationID, 'guestName': guestName,'hostUID': hostUID };
			return db.collection('userNotifications').doc(hostUID).collection('notifications').add({
				type: 'arrivedGuestUpdate',
				readStatus: false,
				data: dataDict,
				title: arrivedGuestData.notificationTitle,
				body: arrivedGuestData.notificationBody,
				timestamp: new Date(new Date().toUTCString())
			})
			.then(docRef => {
				return db.collection('userNotifications').doc(hostUID).collection('notifications').doc(docRef.id).update({'uid': docRef.id});
			})
			.catch( error => {
				throw new functions.https.HttpsError(error);
			})

		})
		.catch(error => {
			console.error(error);
			throw new functions.https.HttpsError(error);
		})
	} else {
		return
	}
}

exports.notifyUserofServiceRequestStatusChange = function(change, context, db) {
	const newValue = change.after.data();
	const oldValue = change.before.data();
	const hostUID = newValue.userUID || null;
	const issueType = newValue.issueType || null;

	if (newValue.status !== oldValue.status) {
		if (hostUID === null) {
			return
		}
		return db.collection('users').doc(hostUID).get()
		.then( docRef => {
			if (docRef.exists) {
				const data = docRef.data();
				const registrationTokens = data.registrationToken || null;

				var notBody = ""
				if (newValue.status === "open") {
					notBody = "We have received your request and will start working on it asap."
				} else if (newValue.status === "pending")  {
					notBody = "We have started working on your request."
				} else if (newValue.status === "closed")  {
					notBody = "We have finished working on your request."
				}
				const notificationTitle = getTitlefromServiceRequestType(issueType);
				data.notificationTitle = notificationTitle
				data.notificationBody = notBody;

				 registrationTokens.forEach( x => {
					var message = {
						"token" : x,
						"notification" : {
						    "title" : notificationTitle,
						    "body" : notBody,
						 },
						 "data": {
 							"type" : "serviceRequestUpdate",
						    'requestUID': context.params.serviceRequestID
						 }
					};

					return admin.messaging().send(message)
					  .then((response) => {
					    // Response is a message ID string.
					    console.log('Successfully sent message:', response);
					    return
					  })
					  .catch((error) => {
					    console.error(error);
					    throw new functions.https.HttpsError(error);
					  });
				});

				 return data;
			} else {
				throw new functions.https.HttpsError('not-found','Unable to find host user in database.');
			}
		})
		.then ( serviceRequestData => {
				console.log('starting adding notifications');
				const dataDict = { 'serviceRequestID': context.params.serviceRequestID, 'hostUID': hostUID, 'issueType': issueType };
				return db.collection('userNotifications').doc(hostUID).collection('notifications').add({
					type: 'serviceRequestUpdate',
					readStatus: false,
					data: dataDict,
					title: serviceRequestData.notificationTitle,
					body: serviceRequestData.notificationBody,
					timestamp: new Date(new Date().toUTCString())
				})
				.then(docRef => {
					console.log('did add notifications');
					return db.collection('userNotifications').doc(hostUID).collection('notifications').doc(docRef.id).update({'uid': docRef.id});
				})
				.catch( error => {
					throw new functions.https.HttpsError(error);
				})
		})
	} else  {
		return
	}
}

function getTitlefromServiceRequestType(type) {

			if (type === 'furnitureRepair') {
				return "Furniture Repair"
			} else if (type === "brokenFixtures") {
				return "Fixture Repair"
			} else if (type === "lightsNotWorking") {
				return "Lights Not Working"
			} else if (type === 'waterDamageLeak') {
				return "Water/Damage Leak"
			} else if (type === 'brokenACHeating') {
				return "Broken AC/Heating"
			} else if (type === 'kitchenIssues') {
				return "Kitchen Issues"
			} else if (type === 'bathroomIssues') {
				return "Bathroom Issues"
			} else if (type === "damagedDyingPlants") {
				return "Damaged/Dying Plants"
			} else if (type === 'conferenceRoomHardware') {
				return "Conference Room Hardware Issues"
			} else if (type === "webMobileIssues") {
				return "Web/Mobile App Issues"
			} else if (type === 'furnitureMovingRequest') {
				return "Furniture Moving Request"
			} else if (type === 'printingIssues') {
				return "Printing Issues"
			} else if (type === 'wifiIssues') {
				return "Wifi Issues"
			} else if (type === 'other') {
				return "Other"
			} else {
				return "No Name"
			}
}

exports.notifyUserofEventCreation = function(change, context, db) {
	return
}

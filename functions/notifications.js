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

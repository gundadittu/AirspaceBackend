const functions = require('firebase-functions');

exports.createRegisteredGuest = function(data, context, db) {
	const hostUID = context.auth.uid || null;
	const guestName = data.guestName || null;
	const guestEmail = data.guestEmail || null;
	const expectedVisitDate = new Date(data.expectedVisitDate) || null;
	const visitingOfficeUID = data.visitingOfficeUID || null;

	if (hostUID === null || guestName === null || expectedVisitDate === null || visitingOfficeUID === null) {
		throw new functions.https.HttpsError('invalid-arguments','User must be signed in. Must provide guestName, guestEmail, expectedVisitDate, and visitingOfficeUID.');
	}

	const companyPromise = db.collection('offices').doc(visitingOfficeUID).get()
	.then( docRef => {
		if (docRef.exists) {
			const data = docRef.data();
			const companyUIDs = data.companyUID;
			return companyUIDs;
		} else {
			throw new functions.https.HttpsError('not-found','Unable to find office with visitingOfficeUID');
		}
	})

	return Promise.all([companyPromise])
	.then( companyUIDs => {
		var dict = {'hostUID':hostUID, 'guestName': guestName, 'guestEmail': guestEmail, 'expectedVisitDate': expectedVisitDate, 'visitingOfficeUID': visitingOfficeUID, 'visitingCompanyUID': companyUIDs,'arrived': false, 'canceled': false};

		return db.collection('registeredGuests').add(dict)
		.then( docRef => {
			const guestRegUID = docRef.id;
			return db.collection('registeredGuests').doc(guestRegUID).update({"uid": guestRegUID})
			.then( docRef => {
				return guestRegUID;
			})
		})
		.then( guestRegUID => {
			const promises = [];
			const userOperation = db.collection('users').doc(hostUID).update({'registeredGuests': admin.firestore.FieldValue.arrayUnion(guestRegUID)});
			promises.push(userOperation);
			companyUIDs.forEach( x => {
				const companyOperation = db.collection('companies').doc(x).update({'registeredGuests': admin.firestore.FieldValue.arrayUnion(guestRegUID)});
				promises.push(companyOperation);
			})
			return Promise.all(promises);
		})
	})
	.catch( error => {
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
}

exports.getUsersRegisteredGuests = function(data, context, db) {
	const uid = context.auth.uid || null;
	if (uid === null) {
		throw new functions.https.HttpsError('invalid-arguments','User must be signed in.');
	}

	const dict = {};
	const promises = []
	const upcoming = db.collection('registeredGuests').where('hostUID','==',uid).where('arrived','==',false).where('canceled','==',false).orderBy('expectedVisitDate','asc').get()
	.then( docSnapshots => {
		const docsData = docSnapshots.docs.map( x => x.data());
		const docs = docsData.map(x => {
			const officeUID = x.visitingOfficeUID || null;
			if (officeUID !== null) {
				return db.collection('offices').doc(officeUID).get()
				.then(docRef => {
					const data = docRef.data() || null;
					x.visitingOffice = data;
					return x
				})
				.catch( error => {
					throw new functions.https.HttpsError(error);
				})
			} else {
				return x
			}
		})

		return Promise.all(docs)
		.then( updatedDocs => {
			dict['upcoming'] = updatedDocs;
			return
		})
		.catch( error => {
			throw new functions.https.HttpsError(error);
		})
	})
	const past = db.collection('registeredGuests').where('hostUID','==',uid).where('arrived','==',true).where('canceled','==',false).orderBy('expectedVisitDate','asc').get()
	.then( docSnapshots => {
		const docsData = docSnapshots.docs.map( x => x.data());
		const docs = docsData.map(x => {
			const officeUID = x.visitingOfficeUID || null;
			if (officeUID !== null) {
				return db.collection('offices').doc(officeUID).get()
				.then(docRef => {
					const data = docRef.data() || null;
					x.visitingOffice = data;
					return x
				})
			} else {
				return x
			}
		})
		return Promise.all(docs)
		.then( updatedDocs => {
			dict['past'] = updatedDocs;
			return
		})
		.catch( error => {
			throw new functions.https.HttpsError(error);
		})
	})
	promises.push(upcoming);
	promises.push(past);

	return Promise.all(promises)
	.then( res => {
		console.log('Successfully got all registered guests for user('+uid+') : '+dict);
		return dict
	})
	.catch( error => {
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
}

exports.cancelRegisteredGuest = function(data, context, db) {
	const userUID = context.auth.uid || null;
	const registeredGuestUID = data.registeredGuestUID || null;
	if (userUID === null || registeredGuestUID === null) {
		throw new functions.https.HttpsError('invalid-arguments','User must be signed in, and must provide registeredGuestUID.');
	}

	return db.collection('registeredGuests').doc(registeredGuestUID).get()
	.then( docRef => {
		if (docRef.exists) {
			const data = docRef.data()
			if (data.hostUID !== userUID) {
				throw new functions.https.HttpsError('permission-denied','User is not the host for this registered guest.');
			}
			return docRef
		} else {
			throw new functions.https.HttpsError('not-found','registeredGuest not found: '+registeredGuestUID);
		}
	})
	.then( docRef => {
		return db.collection('registeredGuests').doc(registeredGuestUID).update({'canceled':true})
		.then( docRef => {
			console.log('Successfully canceled registeredGuests: '+registeredGuestUID);
			return
		})
		.catch( error => {
			throw new functions.https.HttpsError(error);
		})
	})
	.catch( error => {
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
}

const functions = require('firebase-functions');

exports.createRegisteredGuest = function(data, context, db, admin) {
	const hostUID = context.auth.uid || null;
	const guestName = data.guestName || null;
	const guestEmail = data.guestEmail || null;
	const expectedVisitDate = new Date(data.expectedVisitDate) || null;
	const visitingOfficeUID = data.visitingOfficeUID || null;

	if (hostUID === null || guestName === null || expectedVisitDate === null || visitingOfficeUID === null || guestEmail === null) {
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
		throw error;
	})
}

exports.getUsersRegisteredGuests = function(data, context, db) {
	const uid = context.auth.uid || null;
	if (uid === null) {
		throw new functions.https.HttpsError('invalid-arguments','User must be signed in.');
	}

	return db.collection('registeredGuests').where('hostUID','==',uid).where("canceled",'==',false).orderBy('expectedVisitDate','asc').get()
	.then( docSnapshots => { 
		const docsData = docSnapshots.docs.map( x => x.data());
		const promises = docsData.map(x => {
			const officeUID = x.visitingOfficeUID || null;
			if (officeUID !== null) {
				return db.collection('offices').doc(officeUID).get()
				.then(docRef => {
					const data = docRef.data() || null;
					x.visitingOffice = data;
					return x
				})
				.catch( error => {
					throw error;
				})
			} else {
				return x
			}
		});

		return Promise.all(promises)
		.then( guestData => { 
			return guestData;
		}) 
	})
	.then( guestData => { 
		var upcoming = [];
		var past = []; 

		for (i = 0; i < guestData.length; i++) { 
			const guestItem = guestData[i];
			const visitDate = guestItem.expectedVisitDate.toDate();
			const arrived = guestItem.arrived; 
			const cancelled = guestItem.canceled;
			
			if (cancelled === true) { 
				continue 
			}

			if (visitDate >= new Date()) { 
				if (arrived === true) { 
					past.push(guestItem);
				} else { 
					upcoming.push(guestItem);
				}
			} else { 
				past.push(guestItem);
			}
		}

		const dict = {"upcoming": upcoming, "past": past};
		return dict;
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
			throw error;
		})
	})
	.catch( error => {
		console.error(error);
		throw error;
	})
}

exports.guestSelfCheckIn = function (data, context, db) {
    const registeredGuestUID = data.registeredGuestUID || null;

    if (registeredGuestUID === null)  {
        throw new functions.https.HttpsError('invalid-argument', 'Need to provide a registeredGuestUID.');
    }
	return db.collection('registeredGuests').doc(registeredGuestUID).get()
	.then( docRef => { 
		const data = docRef.data() || null; 
		if (data === null) { 
			throw new functions.https.HttpsError('not-found','Registered guest is not in our database.');
		}

		const arrivedStatus = data.arrived || null; 
		if (arrivedStatus === true) { 
			throw new functions.https.HttpsError('failed-precondition','This guest was already marked as arrived. Can not notify host again.');
		}
		return 
	})
	.then( () => { 
		return db.collection('registeredGuests').doc(registeredGuestUID).update({arrived: true});
	})
}
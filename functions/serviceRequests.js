const functions = require('firebase-functions');

exports.createServiceRequest = function (data, context, db, admin) {
	const note = data.note || null;
	const issueType = data.issueType || null;
	const officeUID = data.officeUID || null;
	const userUID = context.auth.uid || null;

	if (officeUID === null || issueType === null) {
		throw new functions.https.HttpsError('invalid-arguments', 'Need to provide officeUID and issueType.');
	} else if (userUID === null) {
		throw new functions.https.HttpsError('unauthenticated', 'User needs to be logged in');
	}

	// need to check if user has permission to submit service requests for this office
	// add serviceRequestUID to user's profile as well?

	return db.collection('serviceRequests').add({
		note: note,
		issueType: issueType,
		officeUID: officeUID,
		userUID: userUID,
		status: 'open',
		timestamp: admin.firestore.FieldValue.serverTimestamp(),
		canceled: false
	})
		.then(docRef => {
			const uid = docRef.id;
			return db.collection('serviceRequests').doc(uid).update({ "uid": uid })
				.then(docRef => {
					return { "id": uid }
				})
		})
		.catch(error => {
			console.error(error);
			throw error;
		})
}

exports.cancelServiceRequest = function (data, context, db) {
	const serviceRequestID = data.serviceRequestID || null;
	const userUID = context.auth.uid || null;
	// check permissions to see if user is allowed to cancel service request

	if (serviceRequestID === null || userUID === null) {
		throw new functions.https.HttpsError('invalid-arguments', 'Must provide service request UID and user UID.');
	}

	return db.collection("serviceRequests").doc(serviceRequestID).update({ 'canceled': true })
		.catch(error => {
			console.error(error);
			throw error;
		})
}

exports.getUsersServiceRequests = function (data, context, db) {
	const userUID = context.auth.uid || null;

	if (userUID === null) {
		throw new functions.https.HttpsError('unauthenticated', 'User needs to be logged in.');
	}

	var dict = {};
	const open = db.collection('serviceRequests').where('userUID', '==', userUID).where('status', '==', 'open').where('canceled', '==', false).orderBy('timestamp', 'asc').get()
		.then(docSnapshots => {
			const docsData = docSnapshots.docs.map(x => { return x.data() });
			const docs = docsData.map(x => {
				const officeUID = x.officeUID || null;
				if (officeUID !== null) {
					return db.collection('offices').doc(officeUID).get()
						.then(docRef => {
							const data = docRef.data() || null;
							x.office = data;
							return x
						})
						.catch(error => {
							throw error;
						})
				} else {
					return x
				}
			})

			return Promise.all(docs)
				.then(updatedDocs => {
					dict['open'] = updatedDocs;
					return
				})
				.catch(error => {
					throw error;
				})
		});

	const pending = db.collection('serviceRequests').where('userUID', '==', userUID).where('status', '==', 'pending').where('canceled', '==', false).orderBy('timestamp', 'asc').get()
		.then(docSnapshots => {
			const docsData = docSnapshots.docs.map(x => { return x.data() });
			const docs = docsData.map(x => {
				const officeUID = x.officeUID || null;
				if (officeUID !== null) {
					return db.collection('offices').doc(officeUID).get()
						.then(docRef => {
							const data = docRef.data() || null;
							x.office = data;
							return x
						})
						.catch(error => {
							throw error;
						})
				} else {
					return x
				}
			})

			return Promise.all(docs)
				.then(updatedDocs => {
					dict['pending'] = updatedDocs;
					return
				})
				.catch(error => {
					throw error;
				})
		});

	const closed = db.collection('serviceRequests').where('userUID', '==', userUID).where('status', '==', 'closed').where('canceled', '==', false).orderBy('timestamp', 'asc').get()
		.then(docSnapshots => {
			const docsData = docSnapshots.docs.map(x => { return x.data() });
			const docs = docsData.map(x => {
				const officeUID = x.officeUID || null;
				if (officeUID !== null) {
					return db.collection('offices').doc(officeUID).get()
						.then(docRef => {
							const data = docRef.data() || null;
							x.office = data;
							return x
						})
						.catch(error => {
							throw error;
						})
				} else {
					return x
				}
			})

			return Promise.all(docs)
				.then(updatedDocs => {
					dict['closed'] = updatedDocs;
					return
				})
				.catch(error => {
					throw error;
				})
		});

	return Promise.all([open, pending, closed])
		.then(res => {
			return dict
		})
		.catch(error => {
			console.error(error);
			throw error;
		})
}
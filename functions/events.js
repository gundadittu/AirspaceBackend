const functions = require('firebase-functions');

exports.getUpcomingEventsForUser = function(data, contex, db) {
	const userUID = context.auth.uid || null;

	if (userUID === null) {
		throw new functions.https.HttpsError('unauthenticated','User must be logged in.');
	}

	return db.collection('users').doc(userUID).get()
	.then( docRef => {
		if (docRef.exists) {
			const data = docRef.data();
			const offices = data.offices || null;
			if ((offices === null) || (offices.length === 0)) {
				return []
			}
			return offices
		} else {
			throw new functions.https.HttpsError('not-found','User not found in database.');
		}
	})
	.then( officeUIDs => {
		if (officeUIDs.length === 0) {
			return []
		}

		var relevantEvents = [];
		const todayDate = new Date();
		var promises = officeUIDs.map( x => {
			return db.collection('events').where('officeUIDs','array-contains', x).where('startDate','>=',todayDate).where('canceled','==',false).orderBy('startDate','asc').get()
			.then( docSnapshots => {
				const docsData = docSnapshots.docs.map( x => x.data() );
				const localArray = relevantEvents.concat(docsData);
				relevantEvents = localArray;
				return
			})
		});

		return Promise.all(promises)
		.then( x => {
			const sortedArray = relevantEvents.sort( (x,y) => {
  				return new Date(x.startDate) - new Date(y.startDate);
			});
			return sortedArray
		})
	})
	.catch(error => {
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
}

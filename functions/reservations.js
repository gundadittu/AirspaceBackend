const functions = require('firebase-functions');
const helperFunctions = require('./helpers');

exports.getUsersReservationsForRange = function(data, context, db) {
	const userUID = context.auth.uid || null;
	const rangeStart = new Date(data.rangeStart) || null;
	const rangeEnd = new Date(data.rangeEnd) || null;

	if (userUID === null) {
		throw new functions.https.HttpsError('unauthenticated','User must be logged in.');
	}

	if ((rangeStart === null) || (rangeEnd === null)) {
		throw new functions.https.HttpsError('invalid-arguments','Need to provide rangeStart and rangeEnd.');
	}

	var reservations = [];

	var roomResQuery = db.collection('conferenceRoomReservations').where('userUID','==',userUID).where('startDate','>=',rangeStart).where('startDate','<=',rangeEnd).where('canceled','==',false).orderBy('startDate','asc').get()
	.then( docSnapshots => {
		const docsData = docSnapshots.docs.map( x => x.data() );
		console.log(docsData);
		const tempArr = reservations.concat(docsData);
		reservations = tempArr;
		return
	})

	var deskResQuery = db.collection('hotDeskReservations').where('userUID','==',userUID).where('startDate','>=',rangeStart).where('startDate','<=',rangeEnd).where('canceled','==',false).orderBy('startDate','asc').get()
	.then( docSnapshots => {
		const docsData = docSnapshots.docs.map( x => x.data() );
		console.log(docsData);
		const tempArr = reservations.concat(docsData);
		reservations = tempArr;
		return
	})

	return Promise.all([roomResQuery, deskResQuery])
	.then( x => {

		const sortedReservations = reservations.sort( (x,y) => {
  			return new Date(x.startDate) - new Date(y.startDate);
		});

		var promises = sortedReservations.map( x => {

			return db.collection('conferenceRooms').doc(x.roomUID).get()
			.then( docRef => {
				if (docRef.exists) {
					x.conferenceRoom = docRef.data();
				}
				return x
			})

		});

		return Promise.all(promises)
		.then( reservations => {
			return reservations
		})
		.catch(error => {
			throw new functions.https.HttpsError(error);
		})
	})
	.then( reservationData => {
		var promises = reservationData.map( x => {
			const room = x.conferenceRoom;
			const officeUIDs = room.officeUID;
			return getExpandedOfficeData(officeUIDs)
	  		.then( officeData => {
	  			x.conferenceRoom.offices = officeData;
	  			return x
	  		})
	  		.catch(error => {
				throw new functions.https.HttpsError(error);
	  		})
		})

		return Promise.all(promises)
		.then( updatedReservationData => {
			return updatedReservationData
		})
		.catch( error => {
			throw new functions.https.HttpsError(error);
		})

	})
	.then( reservationData => {
		var promises = reservationData.map( x => {
			const userUID = x.userUID || null;
			if (userUID === null) {
				return x
			}
			return db.collection('users').doc(x.userUID).get()
			.then(docRef => {
				if (docRef.exists) {
					x.host = docRef.data();
				}
				return x
			})
		})

		return Promise.all(promises)
		.then( updatedReservationData => {
			return updatedReservationData
		})
	})
	.then( reservationData => {
		var promises = reservationData.map( x => {
			const attendees = x.attendees || null;
			if ((attendees === null) || (attendees.length === 0)) {
				return x
			}
			return helperFunctions.getUserData(attendees, db)
			.then( userData => {
				x.attendees = userDate
				return x
			})
		})

		return Promise.all(promises)
		.then( finalReservationData => {
			return finalReservationData
		})
	})
	.catch( error => {
		console.error(error);
		throw new functions.https.HttpsError(error);
	})

}

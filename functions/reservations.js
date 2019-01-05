const functions = require('firebase-functions');
const helperFunctions = require('./helpers');
const storageFunctions = require('./storage');

exports.getUsersReservationsForRange = function(data, context, db, admin) {
	const userUID = context.auth.uid || null;
	const rangeStart = new Date(data.rangeStart) || null;
	const rangeEnd = new Date(data.rangeEnd) || null;

	if (userUID === null) {
		throw new functions.https.HttpsError('unauthenticated','User must be logged in.');
	}

	if ((rangeStart === null) || (rangeEnd === null)) {
		throw new functions.https.HttpsError('invalid-arguments','Need to provide rangeStart and rangeEnd.');
	}

	var roomReservations = [];
	var deskReservations = [];

	var roomResQuery = db.collection('conferenceRoomReservations').where('userUID','==',userUID).where('endDate','>=',rangeStart).where('endDate','<=',rangeEnd).where('canceled','==',false).orderBy('endDate','asc').get()
	.then( docSnapshots => {
		const docsData = docSnapshots.docs.map( x => x.data() );
		console.log(docsData);
		roomReservations = docsData;
		return
	})

	var deskResQuery = db.collection('hotDeskReservations').where('userUID','==',userUID).where('endDate','>=',rangeStart).where('endDate','<=',rangeEnd).where('canceled','==',false).orderBy('endDate','asc').get()
	.then( docSnapshots => {
		const docsData = docSnapshots.docs.map( x => x.data() );
		console.log(docsData);
		deskReservations = docsData;
		return
	})

	return Promise.all([roomResQuery, deskResQuery])
	.then( x => {

			var promises = roomReservations.map( x => {
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
				const promises = reservations.map( x => {
					return storageFunctions.getConferenceRoomImageURL(x.conferenceRoom.uid, admin)
					.then( url => {
						x.conferenceRoom.imageURL = url;
						return x;
					})
					.catch(error => {
						return x;
					})
				});

				return Promise.all(promises)
				.then( (reservations) => {
					return reservations;
				})
				.catch( error => {
					throw new functions.https.HttpsError(error);
				})
			})
			.then( roomReservations => {
				return roomReservations
			})
			.catch(error => {
				throw new functions.https.HttpsError(error);
			})

	})
	.then( roomReservationsData => {
		var promises = roomReservationsData.map( x => {
			const room = x.conferenceRoom;
			const officeUIDs = room.officeUID;
			return helperFunctions.getExpandedOfficeData(officeUIDs, db)
	  		.then( officeData => {
	  			x.conferenceRoom.offices = officeData;
	  			return x
	  		})
	  		.catch(error => {
				throw new functions.https.HttpsError(error);
	  		})
		})

		return Promise.all(promises)
		.then( updatedRoomReservationData => {
			return updatedRoomReservationData
		})
		.catch( error => {
			throw new functions.https.HttpsError(error);
		})

	})
	.then( roomReservationData => {
		var promises = roomReservationData.map( x => {
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
			roomReservations = finalReservationData;
			return
		})
	})
	.then( () => {
			console.log(deskReservations);
			var promises = deskReservations.map( x => {

				return db.collection('hotDesks').doc(x.deskUID).get()
				.then( docRef => {
					if (docRef.exists) {
						x.hotDesk = docRef.data();
					}
					return x
				})

			});

			return Promise.all(promises)
			.then( reservations => {
				const promises = reservations.map( x => {
					return storageFunctions.getDeskImageURL(x.hotDesk.uid, admin)
					.then( url => {
						x.hotDesk.imageURL = url;
						return x;
					})
					.catch(error => {
						return x;
					})
				});

				return Promise.all(promises)
				.then( (reservationData) => {
					return reservationData;
				})
				.catch( error => {
					throw new functions.https.HttpsError(error);
				})
			})
			.then( reservations => {
				return reservations
			})
			.catch(error => {
				throw new functions.https.HttpsError(error);
			})

	})
	.then( deskReservationData => {
			var promises = deskReservationData.map( x => {
				const desk = x.hotDesk;
				const officeUIDs = desk.officeUIDs;
				return helperFunctions.getExpandedOfficeData(officeUIDs, db)
					.then( officeData => {
							x.hotDesk.offices = officeData;
							return x
					})
					.catch(error => {
							throw new functions.https.HttpsError(error);
					})
			})

			return Promise.all(promises)
			.then( updatedDeskReservationData => {
				return updatedDeskReservationData
			})
			.catch( error => {
				throw new functions.https.HttpsError(error);
			})

	})
	.then( updatedDeskReservationData => {
			var promises = updatedDeskReservationData.map( x => {
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
			.then( updatedDeskReservationData => {
				deskReservations = updatedDeskReservationData;
				return
			})
	})
	.then( x => {
		const allReservations = roomReservations.concat(deskReservations);
		const sortedReservations = allReservations.sort( (x,y) => {
				return new Date(x.startDate) - new Date(y.startDate);
		});
		return sortedReservations
	})
	.catch( error => {
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
}

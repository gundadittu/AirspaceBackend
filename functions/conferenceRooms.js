const functions = require('firebase-functions');
const storageFunctions = require('./storage');
const googleCalendarFunctions = require('./googleCalendar');
const helperFunctions = require('./helpers');

exports.createConferenceRoomReservation = function(data, context, db) {

	const startTime = new Date(data.startTime) || null;
	const endTime = new Date(data.endTime) || null;
	const conferenceRoomUID = data.conferenceRoomUID || null;
	const reservationTitle = data.reservationTitle || "Room Reservation";
	const note = data.note || null;
	var attendees = data.attendees || [];
	var emailInvites = data.emailInvites || [];
	const userUID = context.auth.uid || null;
	const userEmail = context.auth.token.email || null;
	const shouldCreateCalendarEvent = data.shouldCreateCalendarEvent || false;
	var conferenceRoomName = null; 

	if ((startTime === null) || (endTime === null) || (conferenceRoomUID === null)) {
		throw new functions.https.HttpsError('invalid-arguments','Need to provide startTime, endTime, and conferenceRoomUID.');
	}
	const currentDate = new Date(new Date - (5 * 60000));
	if ((startTime <= currentDate) || (endTime <= currentDate)) {
		throw new functions.https.HttpsError('invalid-arguments','Cannot make a reservation in the past');
	}

	if (userUID === null) {
		throw new functions.https.HttpsError('unauthenticated','User must be logged in.');
	}

	// check to make sure user can book conference room??
	return db.collection('users').doc(userUID).get()
	.then( docRef => {
		if (docRef.exists) {
			const data = docRef.data();
			const offices = data.offices || null;
			if (offices === null) {
				throw new functions.https.HttpsError('permission-denied','User is not allowed to reserve this conference room.');
			}
			return offices
		} else {
			throw new functions.https.HttpsError('not-found','Unable to find user in database.');
		}
	})
	.then(userOffices => {
		return db.collection('conferenceRooms').doc(conferenceRoomUID).get()
		.then( docRef => {
			if (docRef.exists) {
				const data = docRef.data();
				const name = data.name || "Room Reservation";
				conferenceRoomName = name; 

				const reserveable = data.reserveable;
				const active = data.active;
				if ((reserveable === false) || (active === false)) {
					throw new functions.https.HttpsError('permission-denied','This conference room is not reserveable.');
				}

				const confRoomOfficeUIDs = data.officeUID || null;
				if (confRoomOfficeUIDs === null) {
					throw new functions.https.HttpsError('permission-denied','This conference room is not reserveable.');
				}

				var unionFound = false;
				userOffices.forEach( x => {
					if (confRoomOfficeUIDs.includes(x) === true) {
						unionFound = true ;
					}
				});

				if (unionFound === false) {
					throw new functions.https.HttpsError('permission-denied','User is not allowed to reserve this conference room.');
				} else {
					return
				}

			} else {
				throw new functions.https.HttpsError('not-found','Unable to find conference room in database.');
			}
		})
	})
	.then( x => {

		// check that conference room is free at that time and reservable
		return db.collection('conferenceRoomReservations').where('roomUID','==',conferenceRoomUID).where('endDate','>=',startTime).where('canceled','==',false).get()
		.then( docSnapshots => {
			const docData = docSnapshots.docs.map( x => x.data());
			var conflicts = docData.filter( x => {
				// check if startDate of existing res is less than endDate of new res
				const exStartDate = x.startDate.toDate();
				const check = (exStartDate < endTime);
				return check
			});

			if (conflicts.length !== 0) {
				throw new functions.https.HttpsError('permission-denied','Reservations already exists in time frame for conference room.');
			}
			return
		})
	})
	.then( x => {
		// create conference room reservation
		return db.collection('conferenceRoomReservations').add({
			title: conferenceRoomName,
			note: note,
			roomUID: conferenceRoomUID,
			startDate: startTime,
			endDate: endTime,
			userUID: userUID,
			attendees: attendees.map( x => x.uid ),
			emailInvites: emailInvites,
			canceled: false
		})
		.catch( error => {
			throw error;
		})
	})
	.then(docRef => {

		const uid = docRef.id;
		if (uid === null) {
			throw new functions.https.HttpsError('internal', 'Unable to add new reservation to database.');
		}

		return db.collection('conferenceRoomReservations').doc(uid).update({"uid":uid})
		.then(docRef => {
			return
		})
		.catch(error => {
			throw error;
		})
	})
	.then( () => {
		if (shouldCreateCalendarEvent === false) {
			console.log("Not creating calendar event.");
			return
		}

		return db.collection('conferenceRooms').doc(conferenceRoomUID).get()
		.then( docRef => {
			if (docRef.exists) {
				const data = docRef.data();
				const address = data.address || null;
				return address
			}
			return null
		})
		.then( address => {

			if (userEmail !== null) {
				attendees.push({"email": userEmail});
			}
			
			for (let key in emailInvites) { 
				let email = emailInvites[key];
				attendees.push({"email": email});
			}
			console.log(attendees);
			
			var location = ""
			if (address !== null) {
				location = address;
			}

			// create calendar invite
			const eventData = {
		        eventName: reservationTitle	,
		        description: note,
		        startTime: startTime,
		        endTime: endTime,
		        attendees: attendees,
		        location: location
	    	};

	    	return googleCalendarFunctions.addEventToCalendar(eventData)
				.then(data => {
	        	return data;
	    	}).catch(err => {
	        	console.error('Error adding event: ' + err.message);
	        	throw new functions.https.HttpsError(err);
	   		});
		})
	})
	.catch(error => {
		console.error(error);
		throw error;
	})
}

exports.getReservationsForConferenceRoom = function(data, context, db) {
	const givenStartDate = new Date(data.startDate) || null;
	const givenEndDate = new Date(data.endDate) || null;
	const roomUID = data.roomUID || null;

	if ((givenStartDate === null) || (givenEndDate === null) || (roomUID === null)) {
		throw new functions.https.HttpsError('invalid-arguments','Need to provide a startDate, endDate, and roomUID')
	}

	return db.collection('conferenceRoomReservations').where('roomUID','==',roomUID).where('endDate','>=',givenStartDate).where('canceled','==',false).get()
	.then( docSnapshots => {
		const docData = docSnapshots.docs.map( x => x.data());
		return docData.filter( x => {
			// check if startDate of existing res is less than endDate of new res
			const exStartDate = x.startDate.toDate();
			return !(exStartDate > givenEndDate);
		})
	})
	.then( docData => {
		return docData.map(x => {
			return {"uid": x.uid, "startDate": x.startDate, "endDate": x.endDate, "roomUID": x.roomUID}
		})
	})
}

exports.findAvailableConferenceRooms = function(data, context, db, admin) {
	const amenities = data.amenities || null;
	const officeUID = data.officeUID || null;
	const capacity = data.capacity || null;
	var startDate = new Date(data.startDate) || null;
	var duration = data.duration || null;

	if (startDate !== null) {
		if (startDate < (new Date((new Date().getMinutes() - (5*6000))))) {  // 5 minute differential * 6000 milliseconds/second
			throw new functions.https.HttpsError('invalid-arguments','Can not provide a start date in the past.')
		}
	}

	// Get all relevant conference rooms first
	var query = db.collection('conferenceRooms');
	if (officeUID !== null) {
		query = query.where('officeUID','array-contains',officeUID).where('active','==',true).where('reserveable','==',true);
	} else {
		throw new functions.https.HttpsError('invalid-arguments','Need to provide officeUID.');
	}

	if (capacity !== null) {
		query = query.where('capacity','>=',capacity);
	}

	return query.get()
	.then( docSnapshots => {
		var docsData = docSnapshots.docs.map( x => { return x.data() });
		var updatedDocsData = docsData;

		// Filter out all conference rooms that do not have all the requested amenities
		if (amenities !== null) {
			updatedDocsData = docsData = docsData.filter( room => {
				const currAmenities = room.amenities; // amenities list for conference room
				for(var j=0; j<amenities.length; j++) {
					if (currAmenities.includes(amenities[j]) === false) {
						return false
					}
				}
				return true
			});
		}
		return updatedDocsData
	})
	.then( confRoomsData => {

		if (startDate === null && duration === null) {
			// fix this to just return all conference rooms and their reservations
			return confRoomsData;
		} else if (startDate !== null && duration === null) {
			duration = 15;
		} else if (startDate === null && duration !== null) {
			// fix this so that it shows all conference rooms on same day with openings of min duration length
			startDate = new Date();
		}
		// check that endDate is correct
		var endDate = new Date(startDate);
		endDate.setMinutes( endDate.getMinutes() + duration );

		// Filter out rooms that have conflicts
		var promises = confRoomsData.map( y => {
			const uid = y.uid;

			return db.collection('conferenceRoomReservations').where('roomUID','==',uid).where('endDate','>=',startDate).where('canceled','==',false).get()
			.then( docSnapshots => {
				const docData = docSnapshots.docs.map( x => x.data());
				var conflicts = docData.filter( x => {
					// check if startDate of existing res is less than endDate of new res
					const exStartDate = x.startDate.toDate();
					const check = (exStartDate < endDate);
					return check
				})

				if (conflicts.length === 0) {
					return y
				}
				return {}
			})
			.catch( error => {
				console.error(error);
				throw error;
			})
		});

		return Promise.all(promises)
		.then( data => {
			const updatedData = data.filter( x => {
				return !(Object.keys(x).length === 0)
			})
			return updatedData;
		})
		.catch(error => {
			console.error(error);
			throw error;
		})

	})
	.then( updatedRoomsData => {
		var promises = updatedRoomsData.map(x => {
			const officeUIDs = x.officeUID;
			return helperFunctions.getExpandedOfficeData(officeUIDs, db)
			.then( officeData => {
				x.offices = officeData;
				return x
			})
			.catch(error => {
				throw error;
			})
		});

		return Promise.all(promises)
		.then( finalRoomData => {
			return finalRoomData
		})
		.catch( error => {
			throw error;
		})
	})
	.then( updatedRoomData => {
		const promises = updatedRoomData.map( x => {
			return storageFunctions.getConferenceRoomImageURL(x.uid, admin)
			.then( url => {
				x.imageURL = url;
				return x;
			})
			.catch(error => {
				return x;
			})
		});

		return Promise.all(promises)
		.then( finalRoomData => {
			return finalRoomData;
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

exports.getAllConferenceRoomsForUser = function(data, context, db, admin) {
	const userUID = context.auth.uid || null;

	if (userUID === null) {
		throw new functions.https.HttpsError('invalid-arguments', 'User must be logged in');
	}

	return db.collection('users').doc(userUID).get()
	.then( docRef => {
		if (docRef.exists) {
			const data = docRef.data();
			const officeUIDs = data.offices || null;
			return officeUIDs;
		} else {
			throw new functions.https.HttpsError('not-found','Unable to find user in database.');
		}
	})
	.then( officeUIDs => {

		var conferenceRooms = [];

	  	var promises = officeUIDs.map( x => {
	  		return db.collection('conferenceRooms').where('officeUID','array-contains',x).where('reserveable','==',true).where('active','==',true).get()
	  		.then( docSnapshots => {
	  			const docsData = docSnapshots.docs.map( x => x.data() );
	  			var roomPromises = docsData.map( x => {

	  				return helperFunctions.getExpandedOfficeData(x.officeUID, db)
	  				.then( officeData => {
	  					x.offices = officeData;
	  					conferenceRooms.push(x);
	  					return
	  				})
	  				.catch(error => {
						throw error;
	  				})

	  			})

	  			return Promise.all(roomPromises)
	  			.catch(error => {
	  				throw error;
	  			})
	  		})
	  		.catch( error => {
	  			throw error;
			})
	  	})

	  	return Promise.all(promises)
	  	.then( res => {
	  		return conferenceRooms
	  	})
	  	.catch( error => {
	  			throw error;
	  	})

	})
	.then( conferenceRooms => {
		const promises = conferenceRooms.map( x => {
			return storageFunctions.getConferenceRoomImageURL(x.uid, admin)
			.then( url => {
				x.imageURL = url;
				return x;
			})
			.catch(error => {
				return x;
			})
		});

		return Promise.all(promises)
		.then( finalRoomData => {
			return finalRoomData;
		})
		.catch( error => {
			throw error;
		})
	})
	.catch(error => {
		console.error(error);
		throw error;
	})
}

exports.getAllConferenceRoomReservationsForUser = function(data, context, db, admin) {
	const userUID = context.auth.uid || null;

	if (userUID === null) {
		throw new functions.https.HttpsError('unauthenticated','User must be logged in');
	}

	var dict = {};
	const upcoming = db.collection('conferenceRoomReservations').where('userUID','==',userUID).where('endDate','>=',new Date()).where('canceled','==',false).orderBy('endDate','asc').get()
	.then( docSnapshots => {

		const docsData = docSnapshots.docs.map( x => x.data() );
		var promises = docsData.map( x => {
			return db.collection('conferenceRooms').doc(x.roomUID).get()
			.then( docRef => {
				if (docRef.exists) {
					x.conferenceRoom = docRef.data();
					return x
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
				throw error;
			})
		})
		.then( reservations => {
			dict["upcoming"] = reservations;
			return
		})
		.catch(error => {
			throw error;
		})

	});

	const past = db.collection('conferenceRoomReservations').where('userUID','==',userUID).where('endDate','<',new Date()).where('canceled','==',false).orderBy('endDate','desc').get()
	.then( docSnapshots => {
		const docsData = docSnapshots.docs.map( x => x.data() );
		var promises = docsData.map( x => {

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
				throw error;
			})
		})
		.then( reservations => {
			dict["past"] = reservations;
			return
		})
		.catch(error => {
			throw error;
		})

	});

	return Promise.all([upcoming, past])
	.then( x => {
		const updatedUpcomingReservations = dict.upcoming;
		var promises = updatedUpcomingReservations.map( x => {
			const room = x.conferenceRoom;
			const officeUIDs = room.officeUID;
			return helperFunctions.getExpandedOfficeData(officeUIDs, db)
	  		.then( officeData => {
	  			x.conferenceRoom.offices = officeData;
	  			return x
	  		})
	  		.catch(error => {
				throw error;
	  		})
		})

		return Promise.all(promises)
		.then( finalUpcomingReservations => {
			dict["upcoming"] = finalUpcomingReservations;
			return
		})
		.catch( error => {
			throw error;
		})

	})
	.then( x => {
		const updatedPastReservations = dict.past;
		var promises = updatedPastReservations.map( x => {
			const room = x.conferenceRoom;
			const officeUIDs = room.officeUID;
			return helperFunctions.getExpandedOfficeData(officeUIDs, db)
	  		.then( officeData => {
	  			x.conferenceRoom.offices = officeData;
	  			return x
	  		})
	  		.catch(error => {
				throw error;
	  		})
		})

		return Promise.all(promises)
		.then( finalPastReservations => {
			dict["past"] = finalPastReservations;
			return
		})
		.catch( error => {
			throw error;
		})

	})
	.then( x => {
		const upcoming = dict.upcoming;
		var upcomingPromises = upcoming.map( x => {
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

		return Promise.all(upcomingPromises)
		.then( upcomingData => {
			dict["upcoming"] = upcomingData;
			return
		})
	})
	.then(x => {
		const past = dict.past;
		var pastPromises = past.map( x => {
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

		return Promise.all(pastPromises)
		.then( pastData => {
			dict["past"] = pastData;
			return
		})
	})
	.then( x => {
		const upcoming = dict.upcoming;
		var upcomingPromises = upcoming.map( x => {
			const attendees = x.attendees || null;
			if ((attendees === null) || (attendees.length === 0)) {
				return x
			}
			return helperFunctions.getUserData(attendees, db)
			.then( userData => {
				x.attendees = userData
				return x
			})
		})

		return Promise.all(upcomingPromises)
		.then( upcomingData => {
			dict["upcoming"] = upcomingData;
			return
		})
	})
	.then(x => {
		const past = dict.past;
		var pastPromises = past.map( x => {
			const attendees = x.attendees || null;
			if ((attendees === null) || (attendees.length === 0)) {
				return x
			}
			return helperFunctions.getUserData(attendees, db)
			.then( userData => {
				x.attendees = userData
				return x
			})
		})

		return Promise.all(pastPromises)
		.then( pastData => {
			dict["past"] = pastData;
			return
		})
	})
	.then( x => {
		return dict;
	})
	.catch( error => {
		console.error(error);
		throw error;
	})
}

exports.cancelRoomReservation = function(data, context, db) {
	const reservationUID = data.reservationUID || null;
	const userUID = context.auth.uid || null;

	if (reservationUID === null) {
		throw new functions.https.HttpsError('invalid-arguments','Need to provide a reservationUID.');
	}

	return db.collection('conferenceRoomReservations').doc(reservationUID).get()
	.then( docRef => {
		if (docRef.exists) {
			const data = docRef.data();
			const reservationUserUID = data.userUID || null;
			if (reservationUserUID === null) {
				throw new functions.https.HttpsError('permission-denied','Reservation does not have a host UID.');
			}
			if (reservationUserUID !== userUID) {
				throw new functions.https.HttpsError('permission-denied','User does not have permission to modify this reservation.');
			}

			return
		} else {
			throw new functions.https.HttpsError('not-found','Unable to find room reservation in database.');
		}
	})
	.then( x => {
		return db.collection('conferenceRoomReservations').doc(reservationUID).update({'canceled': true});
	})
	.catch( error => {
		console.error(error);
		throw error;
	})
}

exports.updateConferenceRoomReservation = function(data, context, db) {
	const reservationUID = data.reservationUID || null;
	const userUID = context.auth.uid || null; /// check to see that user matches one on reservation?
	const startTime = new Date(data.startTime) || null;
	const endTime = new Date(data.endTime) || null;
	const title = data.reservationTitle || null;
	const note = data.note || null;
	const attendees = data.attendees || null;

	const dict = {"startDate": startTime, "endDate": endTime, "title": title, "note": note, "attendees": attendees };

	if ((startTime === null) || (endTime === null)) {
		throw new functions.https.HttpsError('invalid-arguments','Need to provide startTime and endTime.');
	}
	const currentDate = new Date(new Date - (5 * 60000));
	if ((startTime <= currentDate) || (endTime <= currentDate)) {
		throw new functions.https.HttpsError('invalid-arguments','Cannot make a reservation in the past');
	}

	if (userUID === null) {
		throw new functions.https.HttpsError('unauthenticated','User must be logged in.');
	}

	// check to make sure user can book conference room??????
	return db.collection('users').doc(userUID).get()
	.then( docRef => {
		if (docRef.exists) {
			const data = docRef.data();
			const offices = data.offices || null;
			if (offices === null) {
				throw new functions.https.HttpsError('permission-denied','User is not allowed to reserve this conference room.');
			}
			return offices
		} else {
			throw new functions.https.HttpsError('not-found','Unable to find user in database.');
		}
	})
	.then(userOffices => {

		return db.collection('conferenceRoomReservations').doc(reservationUID).get()
		.then( docRef => {
			if (docRef.exists) {
				const data = docRef.data();
				const canceled = data.canceled || false;
				const resUserUID = data.userUID || null;
				const endDate = data.endDate;

				if (endDate < new Date()) {
					throw new functions.https.HttpsError('permission-denied','User can not modify a reservation that is in the past.');
				}

				if ((resUserUID === null) || (resUserUID !== userUID)) {
					throw new functions.https.HttpsError('permission-denied','User can only modify their own reservations.');
				}

				if (canceled === true) {
					throw new functions.https.HttpsError('permission-denied','User cannot modify a canceled reservation.');
				}

				const conferenceRoomUID = data.roomUID || null;
				if (conferenceRoomUID === null) {
					throw new functions.https.HttpsError('not-found','Unable to find conference room linked to reservation.');
				}
				return conferenceRoomUID
			} else {
				throw new functions.https.HttpsError('not-found','Unable to find conference room reservation.');
			}
		})
		.then(conferenceRoomUID => {
			const roomUID = conferenceRoomUID || null;
			if (roomUID === null) {
				throw new functions.https.HttpsError('not-found','Unable to find conference room linked to reservation.');
			}

			return db.collection('conferenceRooms').doc(roomUID).get()
			.then( docRef => {
				if (docRef.exists) {
					const data = docRef.data();

					const reserveable = data.reserveable;
					const active = data.active;
					if ((reserveable === false) || (active === false)) {
						throw new functions.https.HttpsError('permission-denied','This conference room is not reserveable.');
					}

					const confRoomOfficeUIDs = data.officeUID || null;
					if (confRoomOfficeUIDs === null) {
						throw new functions.https.HttpsError('permission-denied','This conference room is not reserveable.');
					}

					var unionFound = false;
					userOffices.forEach( x => {
						if (confRoomOfficeUIDs.includes(x) === true) {
							unionFound = true ;
						}
					});

					if (unionFound === false) {
						throw new functions.https.HttpsError('permission-denied','User is not allowed to reserve this conference room.');
					} else {
						return conferenceRoomUID
					}

				} else {
					throw new functions.https.HttpsError('not-found','Unable to find conference room in database.');
				}
			})
		})
	})
	.then( conferenceRoomUID => {
		// below code checks that conference room is free at that time and reservable
		return db.collection('conferenceRoomReservations').where('roomUID','==',conferenceRoomUID).where('endDate','>=',startTime).where('canceled','==',false).get()
		.then( docSnapshots => {
			const docData = docSnapshots.docs.map( x => x.data());
			var conflicts = docData.filter( x => {
				// check if startDate of existing res is less than endDate of new res
				const exStartDate = x.startDate.toDate();
				const check = (exStartDate < endTime);
				const doubleCheck = (reservationUID !== x.uid)
				return check && doubleCheck
			});

			if (conflicts.length !== 0) {
				throw new functions.https.HttpsError('permission-denied','Reservations already exists in time frame for conference room.');
			}
			return
		})

	})
	.then( x => {
		return db.collection('conferenceRoomReservations').doc(reservationUID).update(dict)
		.catch( error => {
			console.error(error);
			throw error;
		})
	})
}

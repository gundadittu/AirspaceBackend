const functions = require('firebase-functions');
const helperFunctions = require('./helpers');
const googleCalendarFunctions = require('./googleCalendar');
const storageFunctions = require('./storage');

exports.createHotDeskReservation = function(data, context, db) {

	const startTime = new Date(data.startTime) || null;
	const endTime = new Date(data.endTime) || null;
	const hotDeskUID = data.hotDeskUID || null;
	// const reservationTitle = data.reservationTitle || "Room Reservation";
	// const note = data.note || null;
	// var attendees = data.attendees || [];
	const userUID = context.auth.uid || null;
	const userEmail = context.auth.token.email || null;
	const shouldCreateCalendarEvent = data.shouldCreateCalendarEvent || false;
	var hotDeskName = null;

	if ((startTime === null) || (endTime === null) || (hotDeskUID === null)) {
		throw new functions.https.HttpsError('invalid-arguments','Need to provide startTime, endTime, and hotDeskUID.');
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
				throw new functions.https.HttpsError('permission-denied','User is not allowed to reserve this hot desk.');
			}
			return offices
		} else {
			throw new functions.https.HttpsError('not-found','Unable to find user in database.');
		}
	})
	.then(userOffices => {
		return db.collection('hotDesks').doc(hotDeskUID).get()
		.then( docRef => {
			if (docRef.exists) {
				const data = docRef.data();

				hotDeskName = data.name || "Desk Reservation";
				const reserveable = data.reserveable;
				const active = data.active;
				if ((reserveable === false) || (active === false)) {
					throw new functions.https.HttpsError('permission-denied','This hot deskUID is not reserveable.');
				}

				const hotDeskOfficeUIDs = data.officeUIDs || null;
				if (hotDeskOfficeUIDs === null) {
					throw new functions.https.HttpsError('permission-denied','This hot desk is not reserveable.');
				}

				var unionFound = false;
				userOffices.forEach( x => {
					if (hotDeskOfficeUIDs.includes(x) === true) {
						unionFound = true ;
					}
				});

				if (unionFound === false) {
					throw new functions.https.HttpsError('permission-denied','User is not allowed to reserve this hot desk.');
				} else {
					return
				}

			} else {
				throw new functions.https.HttpsError('not-found','Unable to find hot desk in database.');
			}
		})
	})
	.then( x => {

		// check that hot desk is free at that time and reservable
		return db.collection('hotDeskReservations').where('deskUID','==',hotDeskUID).where('endDate','>=',startTime).where('canceled','==',false).get()
		.then( docSnapshots => {
			const docData = docSnapshots.docs.map( x => x.data());
			var conflicts = docData.filter( x => {
				// check if startDate of existing res is less than endDate of new res
				const exStartDate = x.startDate.toDate();
				const check = (exStartDate < endTime);
				return check
			});

			if (conflicts.length !== 0) {
				throw new functions.https.HttpsError('permission-denied','Reservations already exists in time frame for hot desk.');
			}
			return
		})
	})
	.then( x => {
		// create conference room reservation
		return db.collection('hotDeskReservations').add({
			deskUID: hotDeskUID,
			startDate: startTime,
			endDate: endTime,
			userUID: userUID,
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

		return db.collection('hotDeskReservations').doc(uid).update({"uid":uid})
		.then(docRef => {
			return
		})
		.catch(error => {
			throw error;
		})
	})
	.then( x => {
							if (shouldCreateCalendarEvent === false) {
								console.log("Not creating calendar event.");
								return
							}

							var userDict = [{"email":userEmail}];
							var address = "";
							var officeName = "";
							var deskName = "";
							return db.collection('hotDesks').doc(hotDeskUID).get()
							.then( docRef => {
								if (docRef.exists) {
									const data = docRef.data();
									deskName = data.name || "Hot Desk Reservation";
								 	address = data.address || "";
									const officeUID = data.officeUIDs[0] || null;
									return officeUID
								}
								return
							})
							.then( officeUID => {
								if (officeUID === null) {
									return
								}
								return db.collection('offices').doc(officeUID).get()
								.then( docRef => {
									if (docRef.exists) {
										const data = docRef.data();
										officeName = data.name || "";
									}
									return
								})
							})
							.then( x => {
								// create calendar invite
								const location =  officeName+", "+address;
								const eventName = deskName+" Reservation";
								const eventData = {
											eventName: hotDeskName,
											description: "",
											startTime: startTime,
											endTime: endTime,
											attendees: userDict,
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

exports.getReservationsForHotDesk = function(data, context, db) {
	const givenStartDate = new Date(data.startDate) || null;
	const givenEndDate = new Date(data.endDate) || null;
	const deskUID = data.deskUID || null;

	if ((givenStartDate === null) || (givenEndDate === null) || (deskUID === null)) {
		throw new functions.https.HttpsError('invalid-arguments','Need to provide a startDate, endDate, and roomUID')
	}

	return db.collection('hotDeskReservations').where('deskUID','==',deskUID).where('endDate','>=',givenStartDate).where('canceled','==',false).get()
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
			return {"uid": x.uid, "startDate": x.startDate, "endDate": x.endDate, "deskUID": x.deskUID}
		})
	})
}

exports.findAvailableHotDesks = function(data, context, db, admin) {
	const officeUID = data.officeUID || null;
	var startDate = new Date(data.startDate) || null;
	var duration = data.duration || null;

	if (startDate !== null) {
		if (startDate < (new Date((new Date().getMinutes() - (5*6000))))) {  // 5 minute differential * 6000 milliseconds/second
			throw new functions.https.HttpsError('invalid-arguments','Can not provide a start date in the past.')
		}
	}

	// Get all relevant conference rooms first
	var query = db.collection('hotDesks');
	if (officeUID !== null) {
		query = query.where('officeUIDs','array-contains',officeUID).where('active','==',true).where('reserveable','==',true);
	} else {
		throw new functions.https.HttpsError('invalid-arguments','Need to provide officeUID.');
	}

	return query.get()
	.then( docSnapshots => {
		var docsData = docSnapshots.docs.map( x => { return x.data() });
		var hotDesksData = docsData;

		if (startDate === null && duration === null) {
			// fix this to just return all conference rooms and their reservations
			return hotDesksData;
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
		var promises = hotDesksData.map( y => {
			const uid = y.uid;

			return db.collection('hotDeskReservations').where('deskUID','==',uid).where('endDate','>=',startDate).where('canceled','==',false).get()
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
	.then( updatedDesksData => {
		var promises = updatedDesksData.map(x => {
			const officeUIDs = x.officeUIDs;
			if ((officeUIDs === null) || (officeUIDs.length === 0)) {
				throw new functions.https.HttpsError('not-found','Unable to find office linked to hot desk.')
			}
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
		.then( finalDeskData => {
			return finalDeskData
		})
		.catch( error => {
			throw error;
		})
	})
	.then( deskData => {
		const promises = deskData.map( x => {
			return storageFunctions.getDeskImageURL(x.uid, admin)
			.then( url => {
				x.imageURL = url;
				return x;
			})
			.catch(error => {
				return x;
			})
		});

		return Promise.all(promises)
		.then( (desks) => {
			return desks;
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

exports.getAllHotDesksForUser = function(data, context, db, admin) {
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

		var hotDesks = [];

	  	var promises = officeUIDs.map( x => {
	  		return db.collection('hotDesks').where('officeUIDs','array-contains',x).where('reserveable','==',true).where('active','==',true).get()
	  		.then( docSnapshots => {
	  			const docsData = docSnapshots.docs.map( x => x.data() );
	  			var roomPromises = docsData.map( x => {

	  				return helperFunctions.getExpandedOfficeData(x.officeUIDs, db)
	  				.then( officeData => {
	  					x.offices = officeData;
	  					hotDesks.push(x);
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
	  		return hotDesks
	  	})
			.then( deskData => {
				const promises = deskData.map( x => {
					return storageFunctions.getDeskImageURL(x.uid, admin)
					.then( url => {
						x.imageURL = url;
						return x;
					})
					.catch(error => {
						return x;
					})
				});

				return Promise.all(promises)
				.then( (desks) => {
					return desks;
				})
				.catch( error => {
					throw error;
				})
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


exports.getAllHotDeskReservationsForUser = function(data, context, db, admin) {
	const userUID = context.auth.uid || null;

	if (userUID === null) {
		throw new functions.https.HttpsError('unauthenticated','User must be logged in');
	}

	var dict = {};
	const upcoming = db.collection('hotDeskReservations').where('userUID','==',userUID).where('endDate','>=',new Date()).where('canceled','==',false).orderBy('endDate','asc').get()
	.then( docSnapshots => {

		const docsData = docSnapshots.docs.map( x => x.data() );
		var promises = docsData.map( x => {
			return db.collection('hotDesks').doc(x.deskUID).get()
			.then( docRef => {
				if (docRef.exists) {
					x.hotDesk = docRef.data();
					return x
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

	const past = db.collection('hotDeskReservations').where('userUID','==',userUID).where('startDate','<',new Date()).where('canceled','==',false).orderBy('startDate','desc').get()
	.then( docSnapshots => {
		const docsData = docSnapshots.docs.map( x => x.data() );
		var promises = docsData.map( x => {

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
				const desk = x.hotDesk;
				const officeUIDs = desk.officeUIDs;
				return helperFunctions.getExpandedOfficeData(officeUIDs, db)
		  		.then( officeData => {
		  			x.hotDesk.offices = officeData;
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
				const desk = x.hotDesk;
				const officeUIDs = desk.officeUIDs;
				return helperFunctions.getExpandedOfficeData(officeUIDs, db)
		  		.then( officeData => {
		  			x.hotDesk.offices = officeData;
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
		return dict;
	})
	.catch( error => {
		console.error(error);
		throw error;
	})
}

exports.cancelHotDeskReservation = function(data, context, db) {
	const reservationUID = data.reservationUID || null;
	const userUID = context.auth.uid || null;

	if (reservationUID === null) {
		throw new functions.https.HttpsError('invalid-arguments','Need to provide a reservationUID.');
	}

	return db.collection('hotDeskReservations').doc(reservationUID).get()
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
		return db.collection('hotDeskReservations').doc(reservationUID).update({'canceled': true});
	})
	.catch( error => {
		console.error(error);
		throw error;
	})
}

exports.updateHotDeskReservation = function(data, context, db) {
	const reservationUID = data.reservationUID || null;
	const userUID = context.auth.uid || null; /// check to see that user matches one on reservation?
	const startTime = new Date(data.startTime) || null;
	const endTime = new Date(data.endTime) || null;

	const dict = {"startDate": startTime, "endDate": endTime };

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

	return db.collection('users').doc(userUID).get()
	.then( docRef => {
		if (docRef.exists) {
			const data = docRef.data();
			const offices = data.offices || null;
			if (offices === null) {
				throw new functions.https.HttpsError('permission-denied','User is not allowed to reserve this hot desk.');
			}
			return offices
		} else {
			throw new functions.https.HttpsError('not-found','Unable to find user in database.');
		}
	})
	.then(userOffices => {

		return db.collection('hotDeskReservations').doc(reservationUID).get()
		.then( docRef => {
			if (docRef.exists) {
				const data = docRef.data();
				const cancelled = data.canceled || false;
				const resUserUID = data.userUID || null;
				const endDate = data.endDate;

				if (endDate < new Date()) {
					throw new functions.https.HttpsError('permission-denied','User can not modify a reservation that is in the past.');
				}

				if ((resUserUID === null) || (resUserUID !== userUID)) {
					throw new functions.https.HttpsError('permission-denied','User can only modify their own reservations.');
				}

				if (cancelled === true) {
					throw new functions.https.HttpsError('permission-denied','User cannot modify a canceled reservation.');
				}

				const hotDeskUID = data.deskUID || null;
				if (hotDeskUID === null) {

					throw new functions.https.HttpsError('not-found','Unable to find conference room linked to reservation.');
				}
				return hotDeskUID
			} else {
				throw new functions.https.HttpsError('not-found','Unable to find hot desk reservation.');
			}
		})
		.then(hotDeskUID => {
			if (hotDeskUID === null) {
				throw new functions.https.HttpsError('not-found','Unable to find hot desk linked to reservation.');
			}

			return db.collection('hotDesks').doc(hotDeskUID).get()
			.then( docRef => {
				if (docRef.exists) {
					const data = docRef.data();

					const reserveable = data.reserveable;
					const active = data.active;
					if ((reserveable === false) || (active === false)) {
						throw new functions.https.HttpsError('permission-denied','This hot desk is not reserveable anymore.');
					}

					const hotDeskOfficeUIDs = data.officeUIDs || null;
					if (hotDeskOfficeUIDs === null) {
						throw new functions.https.HttpsError('permission-denied','This hot desk is not reserveable.');
					}

					var unionFound = false;
					userOffices.forEach( x => {
						if (hotDeskOfficeUIDs.includes(x) === true) {
							unionFound = true ;
						}
					});

					if (unionFound === false) {
						throw new functions.https.HttpsError('permission-denied','User is not allowed to reserve this hot desk.');
					} else {
						return hotDeskUID
					}

				} else {
					throw new functions.https.HttpsError('not-found','Unable to find hot desk in database.');
				}
			})
		})
	})
	.then( hotDeskUID => {
		// below code checks that hot desk is free at that time and reservable
		return db.collection('hotDeskReservations').where('deskUID','==',hotDeskUID).where('endDate','>=',startTime).where('canceled','==',false).get()
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
				throw new functions.https.HttpsError('permission-denied','Reservations already exists in time frame for hot desk.');
			}
			return
		})

	})
	.then( x => {
		return db.collection('hotDeskReservations').doc(reservationUID).update(dict)
		.catch( error => {
			console.error(error);
			throw error;
		})
	})
}

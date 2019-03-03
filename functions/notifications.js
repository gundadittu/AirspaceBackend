const functions = require('firebase-functions');
const emailHelperFunctions = require('./emailHelper');

exports.getUsersNotifications = function (data, context, db) {
	const userUID = context.auth.uid || null;

	if (userUID === null) {
		throw new functions.https.HttpsError('invalid-arguments', 'User must be logged in.');
	}

	return db.collection('userNotifications').doc(userUID).collection('notifications').orderBy('timestamp', 'desc').get()
		.then(docSnapshots => {
			const docsData = docSnapshots.docs.map(x => x.data());
			return docsData;
		})
		.catch(error => {
			console.error(error);
			throw error;
		})
}

exports.updateUserFCMRegToken = function (data, context, db, admin) {
	const uid = context.auth.uid || null;
	const regToken = data.regToken || null;
	const oldToken = data.oldToken || null;

	if (uid === null) {
		throw new functions.https.HttpsError('invalid-arguments', 'User must be signed in. Must provide guestName, guestEmail, expectedVisitDate, and visitingOfficeUID.');
	}

	const promises = [];
	if (regToken !== null) {
		const dbop1 = db.collection('users').doc(uid).update({ 'registrationToken': admin.firestore.FieldValue.arrayUnion(regToken) })
			.then(res => {
				console.log("Successfully added new registrationToken for user: ", uid);
				return
			})
			.catch(error => {
				console.error(error);
				throw error;
			})
		promises.push(dbop1);
	}

	if ((oldToken !== null) && (oldToken !== regToken)) {
		const dbop2 = db.collection('users').doc(uid).update({ 'registrationToken': admin.firestore.FieldValue.arrayRemove(oldToken) })
			.then(res => {
				console.log("Successfully removed old registrationToken for user: ", uid);
				return
			})
			.catch(error => {
				console.error(error);
				throw error;
			})
		promises.push(dbop2);
	}

	return Promise.all(promises)
		.catch(error => {
			console.error(error);
			throw error;
		})
}

exports.notifyUserOfArrivedGuest = function (change, context, db, admin) {
	const newValue = change.after.data();
	const oldValue = change.before.data();
	const arrived = newValue.arrived || null;
	const hostUID = oldValue.hostUID || null;
	const guestName = oldValue.guestName || null;
	const guestEmail = oldValue.guestEmail || null;
	const visitingOfficeUID = oldValue.visitingOfficeUID || null;

	let hostName = null;
	let hostEmail = null;
	let visitingOfficeName = null;
	let visitingOfficeAddress = null;

	if ((arrived === null) || (hostUID === null) || (visitingOfficeUID === null)) {
		throw new functions.https.HttpsError('invalid-argument', "Need to provide a value for arrived and hostUID and visitingOfficeUID to trigger notification to host.")
	}

	if (arrived === true && (oldValue.arrived === null || oldValue.arrived === false)) {
		return db.collection('users').doc(hostUID).get()
			.then(docRef => {
				if (docRef.exists) {
					const data = docRef.data();
					hostName = data.firstName || null;
					hostEmail = data.email || null;
					const registrationTokens = data.registrationToken || null;

					if (registrationTokens === null) {
						return
					}

					const notificationTitle = 'Your guest has arrived.';
					data.notificationTitle = notificationTitle;
					const notificationBody = 'Please meet ' + guestName + ' by the reception area.';
					data.notificationBody = notificationBody;

					var promises = registrationTokens.map(x => {

						var message = {
							"token": x,
							"notification": {
								"title": notificationTitle,
								"body": notificationBody
							},
							"apns": {
								"payload": {
									"aps": {
										"sound": "default"
									}
								}
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
								return null
							});
					});

					return Promise.all(promises)
						.then(() => {
							return data;
						})
						.catch(error => {
							console.error(error);
							throw error;
						})

				} else {
					throw new functions.https.HttpsError('not-found', 'Unable to find host user in database.');
				}
			})
			.then(arrivedGuestData => {
				const dataDict = { 'registeredGuestUID': context.params.registrationID, 'guestName': guestName, 'hostUID': hostUID };
				return db.collection('userNotifications').doc(hostUID).collection('notifications').add({
					type: 'arrivedGuestUpdate',
					readStatus: false,
					data: dataDict,
					title: arrivedGuestData.notificationTitle,
					body: arrivedGuestData.notificationBody,
					timestamp: new Date(new Date().toUTCString())
				})
					.then(docRef => {
						return db.collection('userNotifications').doc(hostUID).collection('notifications').doc(docRef.id).update({ 'uid': docRef.id });
					})
					.catch(error => {
						throw error;
					})

			})
			.then(() => {

				return db.collection('offices').doc(visitingOfficeUID).get()
					.then(docRef => {
						const data = docRef.data() || null;
						if (data === null) {
							throw new functions.https.HttpsError('not-found', 'Unable to access data for office object.');
						}
						visitingOfficeName = data.name || null;
						const buildingUID = data.buildingUID || null;
						if (buildingUID === null) {
							return
						}
						return db.collection('buildings').doc(buildingUID).get()
							.then(docRef => {
								const data = docRef.data() || null;
								if (data === null) {
									throw new functions.https.HttpsError('not-found', 'Unable to access data for building object.');
								}
								visitingOfficeAddress = data.address || null;
								return
							})
					})
					.then(() => {
						const dict = {
							userName: hostName,
							userEmail: hostEmail,
							guestName: guestName,
							guestEmail: guestEmail,
							visitingOfficeName: visitingOfficeName,
							visitingOfficeAddress: visitingOfficeAddress
						}
						return emailHelperFunctions.sendArrivedRegGuestCreationEmail(dict);
					})
			})
			.catch(error => {
				console.error(error);
				throw error;
			})
	} else {
		return {}
	}
}

exports.notifyUserofServiceRequestStatusChange = function (change, context, db, admin) {
	const newValue = change.after.data();
	const oldValue = change.before.data();
	const hostUID = newValue.userUID || null;
	const issueType = newValue.issueType || null;

	if (newValue.status !== oldValue.status) {
		if (hostUID === null) {
			return {}
		}
		return db.collection('users').doc(hostUID).get()
			.then(docRef => {
				if (docRef.exists) {
					const data = docRef.data();
					const registrationTokens = data.registrationToken || null;

					if (registrationTokens === null) {
						console.log("No registrationToken");
						return
					}
					var notBody = ""
					if (newValue.status === "open") {
						notBody = "We have received your request and will start working on it asap."
					} else if (newValue.status === "pending") {
						notBody = "We have started working on your request."
					} else if (newValue.status === "closed") {
						notBody = "We have finished working on your request."
					}
					const notificationTitle = getTitlefromServiceRequestType(issueType);
					data.notificationTitle = notificationTitle
					data.notificationBody = notBody;

					var promises = registrationTokens.map(x => {
						var message = {
							"token": x,
							"notification": {
								"title": notificationTitle,
								"body": notBody,
							},
							"data": {
								"type": "serviceRequestUpdate",
								'requestUID': context.params.serviceRequestID
							},
							"apns": {
								"payload": {
									"aps": {
										"sound": "default"
									}
								}
							}
						};

						return admin.messaging().send(message)
							.then((response) => {
								// Response is a message ID string.
								console.log('Successfully sent message:', response);
								return newValue;
							})
							.catch((error) => {
								console.error(error);
								return
							});
					});

					return Promise.all(promises)
						.then(() => {
							return data
						})
				} else {
					throw new functions.https.HttpsError('not-found', 'Unable to find host user in database.');
				}
			})
			.then(serviceRequestData => {
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
						return db.collection('userNotifications').doc(hostUID).collection('notifications').doc(docRef.id).update({ 'uid': docRef.id });
					})
					.catch(error => {
						throw error;
					})
			})
	} else {
		return {};
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

exports.notifyUserofOfficeAnnouncement = function (snap, context, db, admin) {
	var data = snap.data();
	var announcementMessage = data.message || null;
	var officeUIDs = data.officeUID || null;

	if (officeUIDs === null) {
		throw new functions.https.HttpsError('invalid-arguments', 'Need to provide officeUIDs to announcement.');
	}

	return officeUIDs.map(element => {
		return db.collection('users').where('offices', 'array-contains', element).get()
			.then(docSnapshots => {
				const docsData = docSnapshots.docs.map(z => z.data());
				return docsData;
			})
			.then(usersData => {
				return usersData.map(x => {
					const registrationTokens = x.registrationToken || null;
					const userUID = x.uid || null;

					if ((registrationTokens === null) || (userUID === null)) {
						return
					}

					const notificationTitle = "Office Announcement";
					const notBody = announcementMessage;
					newValue.notificationTitle = notificationTitle;
					newValue.notificationBody = notBody;

					var promises = registrationTokens.map(y => {
						const message = {
							"token": y,
							"notification": {
								"title": notificationTitle,
								"body": notBody,
							},
							"data": {
								"type": "announcement",
								'eventUID': context.params.announcementID
							},
							"apns": {
								"payload": {
									"aps": {
										"sound": "default"
									}
								}
							}
						};

						return admin.messaging().send(message)
							.then((response) => {
								// Response is a message ID string.
								console.log('Successfully sent message:', response);
								return newValue;
							})
							.then(data => {
								console.log('starting adding notifications');
								const dataDict = { 'announcementUID': context.params.announcementID };
								return db.collection('userNotifications').doc(userUID).collection('notifications').add({
									type: 'announcement',
									readStatus: false,
									data: dataDict,
									title: data.notificationTitle,
									body: data.notificationBody,
									timestamp: new Date(new Date().toUTCString())
								})
									.then(docRef => {
										console.log('did add notifications');
										return db.collection('userNotifications').doc(userUID).collection('notifications').doc(docRef.id).update({ 'uid': docRef.id });
									})
									.catch(error => {
										console.log(error);
										return
									})
							})
							.catch((error) => {
								console.error(error);
								throw error;
							});
					});

					return Promise.all(promises)
						.catch(error => {
							console.error(error);
							throw error;
						})
				});
			})
			.catch(error => {
				console.error(error);
				throw error;
			})
	});
}

exports.notifyUserofEventCreation = function (snap, context, db, admin) {
	var newValue = snap.data();
	const officeUIDs = newValue.officeUIDs || null;
	const eventName = newValue.title || "No Event Name";
	const eventSubtitle = newValue.description || newValue.address;

	if (officeUIDs !== null) {

		return officeUIDs.map(element => {
			return db.collection('users').where('offices', 'array-contains', element).get()
				.then(docSnapshots => {
					const docsData = docSnapshots.docs.map(z => z.data());
					return docsData;
				})
				.then(usersData => {
					return usersData.map(x => {
						const registrationTokens = x.registrationToken || null;
						const userUID = x.uid || null;

						if ((registrationTokens === null) || (userUID === null)) {
							return
						}

						const notificationTitle = "New Event: " + eventName;
						const notBody = eventSubtitle;
						newValue.notificationTitle = notificationTitle;
						newValue.notificationBody = notBody;

						var promises = registrationTokens.map(y => {
							const message = {
								"token": y,
								"notification": {
									"title": notificationTitle,
									"body": notBody,
								},
								"data": {
									"type": "newEvent",
									'eventUID': context.params.eventID
								},
								"apns": {
									"payload": {
										"aps": {
											"sound": "default"
										}
									}
								}
							};

							return admin.messaging().send(message)
								.then((response) => {
									// Response is a message ID string.
									console.log('Successfully sent message:', response);
									return newValue;
								})
								.then(data => {
									console.log('starting adding notifications');
									const dataDict = { 'eventUID': context.params.eventID };
									return db.collection('userNotifications').doc(userUID).collection('notifications').add({
										type: 'newEvent',
										readStatus: false,
										data: dataDict,
										title: data.notificationTitle,
										body: data.notificationBody,
										timestamp: new Date(new Date().toUTCString())
									})
										.then(docRef => {
											console.log('did add notifications');
											return db.collection('userNotifications').doc(userUID).collection('notifications').doc(docRef.id).update({ 'uid': docRef.id });
										})
										.catch(error => {
											console.log(error);
											return
										})
								})
								.catch((error) => {
									console.error(error);
									throw error;
								});
						});

						return Promise.all(promises)
							.catch(error => {
								console.error(error);
								throw error;
							})
					});
				})
				.catch(error => {
					console.error(error);
					throw error;
				})
		});

	} else {
		throw new functions.https.HttpsError('invalid-arguments', 'Need to provide officeUIDs to event.');
	}
}

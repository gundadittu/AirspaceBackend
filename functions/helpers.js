const functions = require('firebase-functions');

exports.validateUserType = function (type) {
	return validateUserType(type);
}

function validateUserType(type) {
	const types = ['regular', 'landlord', 'receptionist', 'admin'];
	return types.includes(type);
}

exports.validateServiceRequestType = function (type) {
	return validateServiceRequestType(type);
}

function validateServiceRequestType(type) {
	const allTypes = ['infoTech', 'plumbing', 'lighting', 'generalMaintenance', 'furniture', 'door', 'heatingCooling', 'cleaning', 'supplies', 'other'];
	return allTypes.includes(type);
}

exports.getServiceRequestTitle = function (type) {
	return getServiceRequestTitle(type);
}

function getServiceRequestTitle(type) {
	const allTypes = {
		'infoTech': "IT",
		'plumbing': "Plumbing",
		'lighting': "Lighting",
		'generalMaintenance': 'General Maintenance',
		'furniture': 'Furniture',
		'door': "Door",
		'heatingCooling': "Heating/Cooling",
		'cleaning': 'Cleaning',
		'supplies': "Supplies",
		'other': 'Other'
	};
	return allTypes[type] || 'Other';
}

exports.validateConferenceRoomAmenity = function (type) {
	return validateConferenceRoomAmenity(type);
}

function validateConferenceRoomAmenity(type) {
	const allTypes = ['screenSharing', 'smartTV', 'projector', 'speakers', 'largeMonitor', 'conferencePhone', 'powerStrip', 'hdmiCables', 'adapters', 'builtInComputer', 'microphone', 'videoConferencing', 'inputSwitchingEnabled'];
	return allTypes.includes(type);
}

exports.getExpandedOfficeData = function (officeUIDs, db) {
	return getExpandedOfficeData(officeUIDs, db);
}

exports.getExpandedBuildingData = function (officeUIDs, db) {
	return getExpandedBuildingData(officeUIDs, db);
}

exports.getUserData = function (userUIDs, db) {
	return getUserData(userUIDs, db);
}

exports.createUser = function (data, context, db, admin) {
	return createUser(data, context, db, admin);
}

function createUser(data, context, db, admin) {
	const firstName = data.firstName || null;
	const lastName = data.lastName || null;
	const emailAdd = data.email;
	const userType = data.type;
	const pwrd = data.password || "Airspaceoffice2019";

	if (validateUserType(userType) === false) {
		throw new functions.https.HttpsError('invalid-arguments', 'Need to provide a valid user type.');
	}
	return admin.auth().getUserByEmail(emailAdd)
		.then(userRecord => {
			const userUID = userRecord.uid || null;
			if (userUID === null) {
				// This will go to the catch clause below and create user 
				throw new functions.https.HttpsError('not-found', 'User not found.');
			} else {
				return userUID
			}
		})
		.catch(error => {
			// User does not already exist, so create new user 
			return admin.auth().createUser({
				displayName: firstName + " " + lastName,
				email: emailAdd,
				emailVerified: true,
				password: pwrd,
				disabled: false
			}).then(user => {
				const uid = String(user.uid);
				// Setting user type in database
				return db.collection("users").doc(uid).set({
					"firstName": firstName,
					"lastName": lastName,
					"email": emailAdd,
					"type": userType,
					"uid": uid
				})
					.then(() => {
						return uid;
					})
					.catch(error => {
						// fix error
						console.error(error)
						throw new functions.https.HttpsError('internal', 'Failed to add user data to database.');
					})
			}).catch(error => {
				// fix error
				console.error(error)
				throw new functions.https.HttpsError('failed-precondition', 'Failed to create user.');
			})
		})
}
function getExpandedBuildingData(buildingUIDs, db) {
	const buildingPromises = buildingUIDs.map(y => {
		return db.collection('buildings').doc(y).get()
			.then(docRef => {
				if (docRef.exists) {
					return docRef.data();
				} else {
					return { "buildingUID": y };
				}
			})
			.catch(error => {
				throw error;
			})
	});

	return Promise.all(buildingPromises)
		.then(buildingData => {
			var promises = buildingData.map(x => {
				const officeUIDs = x.offices || []; // from database

				const innerPromises = officeUIDs.map(y => {
					return db.collection('offices').doc(y).get()
						.then(docRef => {
							if (docRef.exists) {
								const data = docRef.data();
								return data
							}
							return { uid: y }
						})
						.catch(error => {
							throw error;
						})
				});

				return Promise.all(innerPromises)
					.then(officeData => {
						x.offices = officeData;
						return x
					})
			});

			return Promise.all(promises)
				.then(newBuildingData => {
					return newBuildingData;
				})
				.catch(error => {
					console.error(error);
					throw error;
				})
		})
		.catch(error => {
			throw error;
		})
}

function getExpandedOfficeData(officeUIDs, db) {
	const officePromises = officeUIDs.map(y => {
		return db.collection('offices').doc(y).get()
			.then(docRef => {
				if (docRef.exists) {
					return docRef.data();
				} else {
					return { "officeUID": y };
				}
			})
			.catch(error => {
				throw error;
			})
	});

	return Promise.all(officePromises)
		.then(officeData => {
			var promises = officeData.map(x => {
				const buildingUID = x.buildingUID;
				return db.collection('buildings').doc(buildingUID).get()
					.then(docRef => {
						if (docRef.exists) {
							const data = docRef.data();
							x.building = data;
						}
						return x
					})
					.catch(error => {
						throw error;
					})
			});

			return Promise.all(promises)
				.then(newOfficeData => {
					return newOfficeData;
				})
				.catch(error => {
					console.error(error);
					throw error;
				})
		})
		.catch(error => {
			throw error;
		})
}

function getUserData(userUIDs, db) {
	if ((userUIDs === null) || (userUIDs.length === 0)) {
		return
	}
	var promises = userUIDs.map(x => {
		return db.collection('users').doc(x).get()
			.then(docRef => {
				if (docRef.exists) {
					return docRef.data()
				} else {
					return { 'uid': x }
				}
			})
			.then((user) => {
				const offices = user.offices || null;
				if (offices === null) {
					return user
				}
				return getExpandedOfficeData(offices, db)
					.then(officeData => {
						user.offices = officeData;
						return user
					})
					.catch(error => {
						console.error(error);
						return user
					})
			})
	})

	return Promise.all(promises)
		.then(usersData => {
			return usersData
		})
		.catch(error => {
			console.error(error);
			throw error;
		})
}
'use strict';

const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const admin = require('firebase-admin');
admin.initializeApp();
// const firestore = new Firestore();
// const settings = {timestampsInSnapshots: true};
// firestore.settings(settings);

var db = admin.firestore();

// *--- ADMIN FUNCTIONS ----*

exports.getUserProfile = functions.https.onCall((data, context) => { 
	const userUID = data.userUID || null; 
	if (userUID === null) { 
		throw new functions.https.HttpsError('invalid-arguments', 'Need to provide a userUID.');
	}

	return db.collection('users').doc(userUID).get()
	.then( docRef => { 
		if (docRef.exists) { 
			const data = docRef.data(); 
			return data; 
		} else { 
			throw new functions.https.HttpsError('not-found', 'Could not find user with uid: ', userUID);
		}
	})
	.then( data => { 
		const companies = data.companies || null;
		const promises = Promise.all(companies.map( x => {
			return db.collection('companies').doc(x).get()
			.then( docRef => { 
				return docRef.data(); 
			} )
			.catch( error => { 
				console.error(error); 
				throw new functions.https.HttpsError(error);
			})
		}
		));
		return promises
		.then( companyProfiles => { 
			data.companies = companyProfiles;
			return data;
		})
	})
	.then( data => { 
		const offices = data.offices || null;
		const promises = Promise.all(offices.map( x => {
			return db.collection('offices').doc(x).get()
			.then( docRef => { 
				return docRef.data(); 
			} )
			.catch( error => { 
				console.error(error); 
				throw new functions.https.HttpsError(error);
			})
		}
		));
		return promises
		.then( officeProfiles => { 
			data.offices = officeProfiles;
			return data;
		})
	})
	.catch( error => { 
		console.error(error);
		throw new functions.https.HttpsError(error);
	}) 
});


exports.createUser = functions.https.onCall((data, context) => {

	const firstName = data.firstName || null;
	const lastName = data.lastName || null;
	const emailAdd = data.email;
	const userType = data.type;
	const pwrd = data.password || "4673807AirspaceSamplePassword4673807";

  return admin.auth().createUser({
		  displayName: firstName + " " + lastName,
	    email: emailAdd,
	    emailVerified: true,
	    password: pwrd,
	    disabled: false
	}).then( user => {
		const uid = String(user.uid)
		// Setting user type in database
	    return db.collection("users").doc(uid).set({
				"firstName": firstName,
				"lastName": lastName,
				"email": emailAdd,
			  "type": userType,
				"uid": uid
			})
			.catch( error => {
				// fix error
				console.log(error)
				throw new functions.https.HttpsError('internal', 'Failed to add user data to database.');
		  })
	}).catch( error =>  {
		// fix error
		console.log(error)
		throw new functions.https.HttpsError('failed-precondition', 'Failed to create user.');
	})
});

exports.getUserType = functions.https.onCall((data, context) =>  {
	const email = data.email;
	return admin.auth().getUserByEmail(email).then( userRecord => {
		console.log("Successfully fetched user data:", userRecord.toJSON());
		const uid = userRecord.uid;
		return db.collection("users").doc(uid).get().then( doc => {
			if (doc.exists) {
				const type = doc.data().type;
				console.log("Returning user type: ", type);
				return { "type": type }
			} else {
				console.log('User does not exist in database.');
				throw new functions.https.HttpsError('not-found', 'User does not exist in database.');
			}
		}).catch( error => {
			console.log('Error fetching user data in database: ', error);
			throw new functions.https.HttpsError('inter', 'Error fetching user data in database.');
		})
	}).catch( error => {
		console.log("Error fetching user data: ", error);
		throw new functions.https.HttpsError('internal', 'Error fetching user record.');
	})
});

exports.getAllUsers = functions.https.onCall((data, context) => {
	// confirm user is admin !!!!
	const uid = context.auth.uid;
	const page = data.page || "0";
	return admin.auth().listUsers(1000, page).then( listUserResults => {
		console.log("Successfully retrieved list of users: ", listUserResults);
		const users = listUserResults.users;
		const nextPageToken = listUserResults.pageToke || null;
		return { "users" : users,
				 "nextPageToken": nextPageToken };
	}).catch( error => {
		console.log("Error getting all users: ", error);
		throw new functions.https.HttpsError('internal', 'Error fetching list of users.')
	})
});

exports.updateUserBioInfo = functions.https.onCall((data, context) => {

	// Authennticate person making change

	const uid = data.uid || null;
	const firstName = data.firstName || null;
	const lastName = data.lastName || null;
	const type = data.type || null;
	const email = data.email || null;
	var dict = {};

	if (uid === null) {
		throw new functions.https.HttpsError('invalid-arguments', "Must provide user uid.")
	}

	if (firstName !== null) {
	  dict["firstName"] = firstName
	}

	if (lastName !== null) {
	  dict["lastName"] = lastName
	}

	if (type !== null) {
		dict["type"] = type;
	}

	if (email !== null) {
		dict["email"] = email;
	}

	const firestoreUpdate =  db.collection("users").doc(uid).update(dict);
	return Promise.all([firestoreUpdate])
	.then(res => {
		console.log("Successfully update bio info for user profile: ", uid);
		return
	})
	.catch( error => {
		throw new functions.https.HttpsError('internal', "There was an issue updating user profile bio info: ", uid);
	})

});

exports.triggerUserBioInfoUpdate = functions.firestore.document('users/{uid}').onUpdate((change, context) => {
	const data = change.after.data();
	const prev = change.before.data();
	const uid = context.params.uid;

	var dict = {};
	if ((data.firstName !== prev.firstName) && (data.lastName !== prev.lastName)) {
		 dict["displayName"] = data.firstName + " " + data.lastName;

	} else if (data.firstName !== prev.firstName) {
		  dict["displayName"] = data.firstName + " " + prev.lastName;

	} if (data.lastName !== prev.lastName) {
		  dict["displayName"] = prev.firstName + " " + data.lastName;
	}

	if (data.email !== prev.email) {
		dict["email"] = data.email;
	}

	return admin.auth().updateUser(uid, dict)
	.then( (userRecord) => {
		console.log("Successfully updated user info for: ", uid);
		return
	})
	.catch( (error) => {
		throw new functions.https.HttpsError("internal-error", "Unable to add user changes into database.");
	})
});

// NEED TO SEND WELCOME EMAIL HERE ON NEW USER CREATION with password setup instructions
exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
  console.log("New User created");
});

exports.deleteUser = functions.https.onCall((data, context) => {
	const uid = data.uid || null;
	if (uid === null) {
		throw new functions.https.HttpsError("invalid-arguments", "UID must be provided.")
	}

	admin.auth().deleteUser(uid)
	.then(() => {
	    console.log("Successfully deleted user");
			return
	})
	.catch((error) => {
	    console.log("Error deleting user:", error);
			throw new functions.https.HttpsError("internal", "Error deleting user.")
	});
});

exports.createBuilding = functions.https.onCall((data, context) => { 
	const bName = data.name || null; 
	const bAddress = data.address || null;
	
	if (bName === null || bAddress === null) { 
		throw new functions.https.HttpsError("invalid-arguments", "Must provide a building name and address.")
	} 

	return db.collection('buildings').add({ 
		name: bName, 
		address: bAddress, 
	}).then( (docRef) => { 
		const id = docRef.id 
		return db.collection('buildings').doc(id).update({ 
			uid: id
		})
		.then( (docRef) => { 
			console.log("Successfully added building.");
			return
		})
		.catch( (error) => { 
			console.log("Error adding building id to database: ", error);
			throw new functions.https.HttpsError("internal", "Error adding new building ID into database.")
		}) 
	})
	.catch( (error) => { 
		console.log("Error adding building: ", error);
		throw new functions.https.HttpsError("internal", "Error adding new building data into database.")
	})
});

exports.getAllBuildings = functions.https.onCall((data, context) => { 
	return db.collection('buildings').get()
	.then((snapshot) => { 
		const docs = snapshot.docs.map( x => x.data());
		console.log("Successfully got all buildings: ", docs);
		return {"buildings": docs}
	})
	.catch( (error) => { 
		throw new functions.https.HttpsError("internal", "Unable to get all buildings: ", error);
	})
});

exports.addLandlordToBuilding = functions.https.onCall((data, context) => { 
	const userUID = data.userUID || null; 
	const buildingUID = data.buildingUID || null;
	if (userUID === null || buildingUID === null) { 
		throw new functions.https.HttpsError("invalid-arguments", "Need to provide building and landlord UID.");
	}
	// const userType = await extractUserTypeFromUID(userUID); 

	// if (userType !== 'landlord') { 
	// 	throw new functions.https.HttpsError("invalid-arguments", "Need to provide user with Landlord type.");
	// }

	const dbop1 = db.collection("buildings").doc(buildingUID).update({"landlords": admin.firestore.FieldValue.arrayUnion(userUID)})
	.then( docRef => { 
		console.log("Successfully added landlord to building.");
		return 
	})
	.catch( error => { 
		console.log("Error setting landlord for building.");
		throw new functions.https.HttpsError("internal", "Unable to add landlord for building in database: ", error);
	})

	const dbop2 = db.collection("users").doc(userUID).update({"buildings": admin.firestore.FieldValue.arrayUnion(buildingUID)})
	.then( docRef => { 
		console.log("Successfully added building under landlord.");
		return 
	})
	.catch( error => { 
		console.log("Error setting building under landlord in database.");
		throw new functions.https.HttpsError("internal", "Unable to add set building under landlord in database.")
	})

	return Promise.all([dbop1, dbop2]); 
});

exports.removeLandlordFromBuilding = functions.https.onCall((data, context) => { 
	const userUID = data.userUID || null; 
	const buildingUID = data.buildingUID || null;
	if (userUID === null || buildingUID === null) { 
		throw new functions.https.HttpsError("invalid-arguments", "Need to provide building and landlord UID.");
	}
	// const userType = await extractUserTypeFromUID(userUID); 

	// if (userType !== 'landlord') { 
	// 	throw new functions.https.HttpsError("invalid-arguments", "Need to provide user with Landlord type.");
	// }

	const dbop1 = db.collection("buildings").doc(buildingUID).update({"landlords": admin.firestore.FieldValue.arrayRemove(userUID)})
	.then( docRef => { 
		console.log("Successfully removed landlord to building.");
		return 
	})
	.catch( error => { 
		console.log("Error removing landlord for building.");
		throw new functions.https.HttpsError("internal", "Unable to remove landlord for building in database: ", error);
	})

	const dbop2 = db.collection("users").doc(userUID).update({"buildings": admin.firestore.FieldValue.arrayRemove(buildingUID)})
	.then( docRef => { 
		console.log("Successfully removed building under landlord.");
		return 
	})
	.catch( error => { 
		console.log("Error removing building under landlord in database.");
		throw new functions.https.HttpsError("internal", "Unable to remove building under landlord in database.")
	})

	return Promise.all([dbop1, dbop2]); 
});

exports.getAllLandlords = functions.https.onCall((data, context) => { 
	const query = db.collection("users").where('type','==','landlord');
	return query.get()
	.then( (querySnapshot) => { 
		const landlordsArray = querySnapshot.docs.map( x => x.data() );
		console.log("Successfully got all landlords: ", landlordsArray);
		return landlordsArray;
	})
	.catch( error => { 
		throw new functions.https.HttpsError('internal', 'Unable to access database: ', error);
	})
});  

exports.getBuildingProfile = functions.https.onCall((data, context) => { 
	const buildingUID = data.buildingUID || null; 
	if (buildingUID === null) { 
		throw new functions.https.HttpsError('invalid-arguments', 'Must provide building uid.')
	}
	return db.collection("buildings").doc(buildingUID).get()
		.then( doc => { 
			if (doc.exists) { 
				const data = doc.data();
				return data;
			} else { 
				throw new functions.https.HttpsError('not-found', "Unable to find building in database: ", buildingUID);
			}
		})
		.then( data => { 
			const landlords = data.landlords || null; 
			if (landlords === null) { 
				return data; 
			}
			const promise = Promise.all(landlords.map(x => {
				return db.collection("users").doc(x).get()
				.then( (docRef) => { 
					if (docRef.exists) {
						const data = docRef.data();
						return data;
					}
					return {};
				})
			}));
			return promise
			.then( (landlordProfiles) => { 
				data.landlords = landlordProfiles;
				return data
			})
			.catch( error => { 
				throw new functions.https.HttpsError('internal', "Unable to extract landlords for building from database: ", buildingUID);
			})
		})
		.then( data => { 
			const offices = data.offices || null; 
			if (offices === null) { 
				return data; 
			}
			const promise = Promise.all(offices.map(x => {
				return db.collection("offices").doc(x).get()
				.then( (docRef) => { 
					if (docRef.exists) {
						const data = docRef.data();
						return data;
					}
					return {};
				})
			}));
			return promise
			.then( (officeProfiles) => { 
				data.offices = officeProfiles;
				return data;
			})
			.catch( error => { 
				throw new functions.https.HttpsError('internal', "Unable to extract offices for building from database: ", buildingUID);
			})
		})
		.catch( error => { 
			throw new functions.https.HttpsError('internal', "Unable to extract building from database: ", buildingUID);
		})
});

exports.updateBuildingBioInfo = functions.https.onCall((data, context) => {

	// Authennticate person making change

	const uid = data.uid || null;
	const name = data.name || null;
	const address = data.address || null;
	var dict = {};

	if (uid === null) {
		throw new functions.https.HttpsError('invalid-arguments', "Must provide user uid.")
	}

	if (name !== null) {
	  dict["name"] = name
	}

	if (address !== null) {
	  dict["address"] = address
	}

	const firestoreUpdate =  db.collection("buildings").doc(uid).update(dict);
	return Promise.all([firestoreUpdate])
	.then(res => {
		console.log("Successfully updated bio info for building: ", uid);
		return
	})
	.catch( error => {
		throw new functions.https.HttpsError('internal', "There was an issue updating building profile bio info: ", uid);
	})

});

exports.getAllCompanies = functions.https.onCall((data, context) => { 
	return db.collection('companies').get()
	.then((snapshot) => { 
		const docs = snapshot.docs.map( x => x.data());
		console.log("Successfully got all companies: ", docs);
		return {"companies": docs}
	})
	.catch( (error) => { 
		throw new functions.https.HttpsError("internal", "Unable to get all companies: ", error);
	})
});

exports.createCompany = functions.https.onCall((data, context) => { 
	const name = data.name || null; 
	if (name === null) { 
		throw new functions.https.HttpsError("invalid-arguments", "Need to provide a company name.");
	}

	return db.collection('companies').add({ name: name })
	.then( docRef => { 
		const id = docRef.id 
		return db.collection('companies').doc(id).update({ 
			uid: id
		})
		.then( (docRef) => { 
			console.log("Successfully created new company", id)
			return
		})
		.catch( (error) => { 
			console.log("Error adding new company id to database: ", error);
			throw new functions.https.HttpsError("internal", "Error adding new company ID into database.")
		})
	})
	.catch( error => { 
		throw new functions.https.HttpsError('internal', 'Unable to create new company in database.')
	})
});

exports.getCompanyProfile = functions.https.onCall((data, context) => { 
	const companyUID = data.companyUID || null;

	if (companyUID === null) { 
		throw new functions.https.HttpsError('invalid-arguments', 'Must provide company uid.')
	}
	return db.collection("companies").doc(companyUID).get()
	.then( docRef => { 
		if (docRef.exists) { 
			return docRef.data() 
		} else { 
			throw new functions.https.HttpsError('not-found', 'Could not find company with uid: ', companyUID);
		}
	})
	.then( data => { 
		const employees = data.employees || null;
		const promises = Promise.all(employees.map( x => {
			return db.collection('users').doc(x).get()
			.then( docRef => { 
				return docRef.data(); 
			} )
			.catch( error => { 
				console.error(error); 
				throw new functions.https.HttpsError(error);
			})
		}
		));
		return promises
		.then( employeeProfiles => { 
			data.employees = employeeProfiles;
			return data;
		})
	})
	.then( data => { 
		const offices = data.offices || null;
		const promises = Promise.all(offices.map( x => {
			return db.collection('offices').doc(x).get()
			.then( docRef => { 
				return docRef.data(); 
			} )
			.catch( error => { 
				console.error(error); 
				throw new functions.https.HttpsError(error);
			})
		}
		));
		return promises
		.then( officeProfiles => { 
			data.offices = officeProfiles;
			return data;
		})
	})
	.catch( error => { 
		throw new functions.https.HttpsError('internal', 'Could not get company from database.', companyUID);
	})
})

exports.updateCompanyBioInfo = functions.https.onCall((data, context) => {

	// Authenticate person making change
	const companyUID = data.companyUID || null;
	const name = data.name || null;
	// const address = data.address || null;
	var dict = {};

	if (companyUID === null) {
		throw new functions.https.HttpsError('invalid-arguments', "Must provide company uid.")
	}

	if (name !== null) {
	  dict["name"] = name
	}

	const firestoreUpdate = db.collection("companies").doc(companyUID).update(dict);
	return Promise.all([firestoreUpdate])
	.then(res => {
		console.log("Successfully updated bio info for company: ", companyUID);
		return
	})
	.catch( error => {
		throw new functions.https.HttpsError('internal', "There was an issue updating company profile bio info: ", companyUID);
	})

});

exports.getAllOffices = functions.https.onCall((data, context) => { 
	return db.collection('offices').get()
	.then( snapshot => { 
		const docs = snapshot.docs.map( x => x.data());
		console.log("Successfully got all offices: ", docs);
		return docs;
	})
	.then( docs => {
		if (docs.length === 0) { 
			return docs;
		}
		const promises = Promise.all(docs.map( x => {
			const buildingUID = x.buildingUID || null; 
			if (buildingUID === null) { 
				throw new functions.https.HttpsError("not-found", "Unable to find office's buildingUID for office: ", x.uid);
			}
			return db.collection('buildings').doc(buildingUID).get()
			.then( docRef => { 
				if (docRef.exists) { 
					const data = docRef.data() 
					console.log(data);
					x.buildingName = data.name;
					console.log(x); 
					return x;
				} else { 
					throw new functions.https.HttpsError("not-found", "Unable to find office's building with id: ", x.buildingUID);
				}
			})
		}));

		return promises
		.then( offices => { 
			return { "offices": offices };
		})
		.catch( error => { 
			throw new functions.https.HttpsError("internal", "Unable to get all offices: ", error);
		})
	})
	.catch( error => { 
		throw new functions.https.HttpsError("internal", "Unable to get all offices: ", error);
	})
});

exports.createOffice = functions.https.onCall((data, context) => { 
	const name = data.name || null; 
	const buildingUID = data.buildingUID || null; 
	const floor = data.floor || null; 
	const roomNo = data.roomNo || null;
	const capacity = data.capacity || null;
	
	var dict = {}; 
	if (buildingUID === null) { 
		throw new functions.https.HttpsError('invalid-arguments','Must provide a building uid for office.');
	} else { 
		dict["buildingUID"] = buildingUID; 
	}

	if (name !== null) { 
		dict["name"] = name; 
	}

	if (floor !== null) { 
		dict["floor"] = floor; 
	}

	if (roomNo !== null) { 
		dict["roomNo"] = roomNo; 
	}

	if (capacity !== null) { 
		dict["capacity"] = capacity; 
	}

	return db.collection('offices').add(dict)
	.then((docRef) => {
		const id = docRef.id; 
		return db.collection('offices').doc(id).update({ 
			uid: id
		})
		.then( (docRef) => { 
			console.log("Successfully created office: ", docRef.id);
			return id
		})
		.catch( (error) => { 
			throw new functions.https.HttpsError("internal", "Unable to create office: ", error);
		})
	})
	.then((officeUID) => { 
		console.log('Successfully added office under building.');
		return db.collection('buildings').doc(buildingUID).update({'offices': admin.firestore.FieldValue.arrayUnion(officeUID)});
	})
	.catch( (error) => { 
		throw new functions.https.HttpsError("internal", "Unable to create office: ", error);
	})
})

exports.getOfficeProfile = functions.https.onCall((data, context) => { 
	const officeUID = data.officeUID || null;
	if (officeUID === null) { 
		throw new functions.https.HttpsError('invalid-arguments', 'Must provide office uid.')
	}
	return db.collection("offices").doc(officeUID).get()
	.then( docRef => { 
		if (docRef.exists) { 
			return docRef.data() 
		} else { 
			throw new functions.https.HttpsError('not-found', 'Could not find office with uid: ', officeUID);
		}
	})
	.then( docData => {
		const buildingUID = docData.buildingUID || null;
		if (buildingUID === null) { 
			throw new functions.https.HttpsError('internal', 'Could not get buildingUID for office from database.', officeUID);
		}
		return db.collection('buildings').doc(buildingUID).get()
		.then( docRef => { 
			if (docRef.exists) { 
				const data = docRef.data();
				docData.building = docRef.data();
			}
			return docData;
		})
	})
	.then( docData => {
		const companyUID = docData.companyUID || null;
		if (companyUID === null) { 
			return docData;
		}
		return db.collection('companies').doc(companyUID).get()
		.then( docRef => { 
			if (docRef.exists) { 
				const data = docRef.data();
				docData.company = docRef.data();
			}
			return docData;
		})
	})
	.then( docData => {
		const employees = docData.employees || null;
		if (employees === null) { 
			return docData; 
		}

		const promises = Promise.all(employees.map( x => {
			return db.collection('users').doc(x).get()
			.then( docRef => {
				if (docRef.exists) { 
					return docRef.data(); 
				} else { 
					throw new functions.https.HttpsError('not-found', 'Employee not found in database.');
				}
			} )
			.catch( error => { 
				console.error(error); 
				throw new functions.https.HttpsError(error);
			})
		}));

		return promises
		.then( employeeProfiles => { 
			docData.employees = employeeProfiles;
			return docData;
		})
		.catch( error => { 
			console.error(error);
			throw new functions.https.HttpsError(error);
		})
	})
	.catch( error => { 
		throw new functions.https.HttpsError('internal', 'Could not get office from database.', officeUID);
	})
});

exports.addOfficeToCompany = functions.https.onCall((data, context) => { 
	const officeUID = data.officeUID; 
	const companyUID = data.companyUID; 

	if (officeUID === null || companyUID === null) { 
		throw new functions.https.HttpsError('invalid-arguments', "Need to provide a officeUID and companyUID.");
	}
	return db.collection('offices').doc(officeUID).get()
	.then( docRef => { 
		if (docRef.exists) { 
			const data = docRef.data()
			const currCompanyUID = data.companyUID || null; 
			if (currCompanyUID !== null) { 
				if (currCompanyUID !== companyUID) { 
					throw new functions.https.HttpsError('failed-precondition','The office is currently assigned to a different company.');
				}
			}

			const dbop1 = db.collection('offices').doc(officeUID).update({'companyUID': companyUID})
			.then( docRef => { 
				console.log("Successfully added company to office.");
				return 
			})
			.catch( error => { 
				console.log("Error setting company for office.");
				throw new functions.https.HttpsError("internal", "Unable to add company to office in database: ", error);
			})

			const dbop2 = db.collection('companies').doc(companyUID).update({"offices": admin.firestore.FieldValue.arrayUnion(officeUID)})
			.then( docRef => { 
				console.log("Successfully added office to company.");
				return 
			})
			.catch( error => { 
				console.log("Error adding office for company.");
				throw new functions.https.HttpsError("internal", "Unable to add office to company in database: ", error);
			})

			return Promise.all([dbop1, dbop2]);
		} else { 
			throw new functions.https.HttpsError('not-found', "Can't find office with uid: ", officeUID); 
		}
	})
	.catch( error => { 
		throw new functions.https.HttpsError('not-found', "Can't find office with uid: ", officeUID); 
	})

});

exports.addUserToOffice = functions.https.onCall((data, context) => { 
	const officeUID = data.officeUID || null; 
	const userUID = data.userUID || null; 

	if (officeUID === null || userUID === null) { 
		throw new functions.https.HttpsError('invalid-arguments', "Need to provide a officeUID and userUID.");
	}

	return db.collection("offices").doc(officeUID).get() 
	.then( docRef => { 
		console.log('1');
		if (docRef.exists) { 
			const data = docRef.data();
			const officeCompanyUID = data.companyUID;
			return officeCompanyUID;
		} else { 
			throw new functions.https.HttpsError('not-found', "Unable to find companyUID for office: ", officeUID);
		}
	})
	.then ( officeCompanyUID => { 
		console.log('2');
		return db.collection('users').doc(userUID).get()
		.then( docRef => { 
			if (docRef.exists) { 
				const data = docRef.data() 
				const userCompanies = data.companies || null;
				if (userCompanies !== null) { 
					if (userCompanies.indexOf(officeCompanyUID) > -1) { 
						return 
					} else { 
						console.log('perm-den');
						throw new functions.https.HttpsError('permission-denied', "User is not part of the same company as office.", officeCompanyUID);
					}
				} else { 
					console.log('perm-den 2');
					throw new functions.https.HttpsError('permission-denied', "User is not part of the same company as office.", officeCompanyUID);
				}
			} else { 
				console.log('not-found');
				throw new functions.https.HttpsError('not-found', "Unable to find companyUID for user: ", userUID);
			}
		})
		.catch( error => { 
			console.log('3');
			console.error(error);
			throw new functions.https.HttpsError(error);
		})
	})
	.then( () => { 
		console.log('3');
		const dbop1 = db.collection('users').doc(userUID).update({'offices': admin.firestore.FieldValue.arrayUnion(officeUID)})

		const dbop2 = db.collection('offices').doc(officeUID).update({'employees': admin.firestore.FieldValue.arrayUnion(userUID)})

		return Promise.all([dbop1, dbop2])
		.then (docRefs => { 
			console.log("Successfully added user to office.");
			return 
		})
		.catch( error => { 
			console.error(error);
			throw new functions.https.HttpsError('internal', 'There was an issue updating the database.');
		})
	})
	.catch( error => { 
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
});

exports.addUserToCompany = functions.https.onCall((data, context) => { 
	const companyUID = data.companyUID || null; 
	const userUID = data.userUID || null; 

	if (companyUID === null || userUID === null) { 
		throw new functions.https.HttpsError('invalid-arguments', "Need to provide a companyUID and userUID.");
	}

	const dbop1 = db.collection('users').doc(userUID).update({'companies': admin.firestore.FieldValue.arrayUnion(companyUID)})

	const dbop2 = db.collection('companies').doc(companyUID).update({'employees': admin.firestore.FieldValue.arrayUnion(userUID)})

	return Promise.all([dbop1, dbop2])
	.then (docRefs => { 
		console.log("Successfully added user to company.");
		return 
	})
	.catch( error => { 
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
});

exports.setOfficeBuilding = functions.https.onCall((data, context) => { 
	const officeUID = data.officeUID || null; 
	const buildingUID = data.buildingUID || null; 

	if (buildingUID === null || officeUID === null) { 
		throw new functions.https.HttpsError('invalid-arguments', "Need to provide a officeUID and buildingUID.");
	}

	return db.collection('offices').doc(officeUID).get() 
	.then( (docRef) => { 

		if (docRef.exists) { 
			const data = docRef.data() 
			const oldBuildingUID = data.buildingUID || null; 
			const promises = []; 
			const dbop1 = db.collection('offices').doc(officeUID).update({'buildingUID': buildingUID})
			promises.push(dbop1); 

			if (oldBuildingUID !== null) { 
				const dbop2 = db.collection('buildings').doc(oldBuildingUID).update({'offices': admin.firestore.FieldValue.arrayRemove(officeUID)})
				promises.push(dbop2); 
			}
			const dbop3 = db.collection('buildings').doc(buildingUID).update({'offices': admin.firestore.FieldValue.arrayUnion(officeUID)})
			promises.push(dbop3); 

			return Promise.all(promises)
			.then (docRefs => { 
				console.log("Successfully added user to company.");
				return 
			})
			.catch( error => { 
				console.error(error);
				throw new functions.https.HttpsError(error);
			})
		} else { 
			throw new functions.https.HttpsError('not-found','Unable to find office in database');
		}
	})
	.catch( error => { 
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
});

// async function extractUserTypeFromUID(uid) { 
// 	return new Promise((resolve, reject) => { 
// 		if (uid === null)  { 
// 			reject(functions.https.HttpsError("invalid-arguments", "Need to provide a uid."));
// 			return
// 		} 

// 		db.collection("users").doc(uid).get()
// 		.then( doc => { 
// 			if (doc.exists) { 
// 				const data = doc.data();
// 				const type = data.type; 
// 				if (type === null) { 
// 					console.log('User type not found:');
// 					reject(new functions.https.HttpsError("not-found", "User type not found: ", uid));
// 				} else { 
// 					resolve(type); 
// 				}
// 			} else { 
// 				console.log('User does not exist in database.');
// 				reject(new functions.https.HttpsError("not-found", 'User does not exist in database.'));
// 			}
// 			return 
// 		})
// 		.catch( error => { 
// 			console.log('internal', "Unable to extract user from database.");
// 			reject(error); 
// 		})
// 	});
// }

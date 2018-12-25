'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const calendar = google.calendar('v3');
const googleCredentials = require('./credentials.json');

const ERROR_RESPONSE = { 
	status: "500", 
	message:"There was an issue adding to calendar."
};

const TIME_ZONE = 'America/Los_Angeles';

var db = admin.firestore();
const settings = {timestampsInSnapshots: true};
db.settings(settings);

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
	const authUserUID = context.auth.id || null
	const uid = data.uid || null;
	const firstName = data.firstName || null;
	const lastName = data.lastName || null;
	const type = data.type || null;
	const email = data.email || null;
	var dict = {};
	var adminStatus = false 

	if (uid === null) {
		throw new functions.https.HttpsError('invalid-arguments', "Must provide user uid.");
	}
	if (authUserUID === null) {
		throw new functions.https.HttpsError('unauthenticated', "User must be logged in.");
	}

	return db.collection('users').doc(uid).get()
	.then( docRef => { 
		if (doc.exists) {
       		const data = doc.data();
       		const userType = data.type; 

       		// need to add check to see if tenantAdmin in order to change email address 
       		if (userType === 'admin') { 
       			adminStatus = true;
       			return 
       		} else if (uid !== authUserUID)  { // check if an user is attempting to change another users info
       			throw new functions.https.HttpsError('permission-denied','User can not only change their own bio info.');
       		} else { 
       			// this case means uid === authUserUID
       			return 
       		}

    	} else {
       		// doc.data() will be undefined in this case
       	 	throw new functions.https.HttpsError('invalid-arguments','User uid is not valid.');
    	}
	})
	.then( x => { 
		if (firstName !== null) {
		  dict["firstName"] = firstName
		}

		if (lastName !== null) {
		  dict["lastName"] = lastName
		}

		if ((type !== null) && (adminStatus === true)) {
			dict["type"] = type;
		}

		if ((email !== null) && (adminStatus === true)) {
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
	})
	.catch( error => { 
		console.error(error);
		throw new functions.https.HttpsError(error);
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

	console.log(dict);
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

exports.getCurrentUsersOffices = functions.https.onCall((data, context) => { 
	const uid = context.auth.uid || null;
	if (uid === null) { 
		throw new functions.https.HttpsError('invalid-arguments','Unable to find user uid. User must be signed in.');
	}
	return db.collection('users').doc(uid).get()
	.then( docRef => { 
		if (docRef.exists) { 
			const data = docRef.data(); 
			return data.offices; 
		} else { 
			throw new functions.https.HttpsError('not-found','Unable to find user in database.');
		}
	})
	.then( userOffices => { 
		if (userOffices === null) { 
			return {};
		}

		const promises = userOffices.map( x => { 
			return db.collection('offices').doc(x).get()
			.then( docRef => { 
				if (docRef.exists) { 
					return docRef.data(); 
				} else { 
					throw new functions.https.HttpsError('not-found','Unable to find office.');
				}
			})
			.catch(error => { 
				throw new functions.https.HttpsError(error);
			})
		})

		return Promise.all(promises)
		.then( officeProfiles => { 
			return officeProfiles;
		})
		.catch(error => { 
			throw new functions.https.HttpsError(error);
		})
	})
	.then( officeData => { 
		var promises = officeData.map( x => { 
			const buildingUID = x.buildingUID;
			return db.collection('buildings').doc(buildingUID).get()
			.then( docRef => { 
				if (docRef.exists) { 
					const data = docRef.data();
					x.building = data; 
				}
				return x
			})
			.catch( error => { 
				throw new functions.https.HttpsError(error);
			})
		})

		return Promise.all(promises)
		.then( newOfficeData => { 
			return newOfficeData;
		})
		.catch(error => { 
			throw new functions.https.HttpsError(error);
		})
	})
	.catch( error => { 
		console.error(error); 
		throw new functions.https.HttpsError(error);
	})
});

exports.createRegisteredGuest = functions.https.onCall((data, context) => { 
	const hostUID = context.auth.uid || null; 
	const guestName = data.guestName || null;
	const guestEmail = data.guestEmail || null;
	const expectedVisitDate = new Date(data.expectedVisitDate) || null;
	const visitingOfficeUID = data.visitingOfficeUID || null;

	if (hostUID === null || guestName === null || expectedVisitDate === null || visitingOfficeUID === null) { 
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
		throw new functions.https.HttpsError(error);
	})
});

exports.updateUserFCMRegToken = functions.https.onCall((data, context) => { 
	const uid = context.auth.uid || null; 
	const regToken = data.regToken || null;
	const oldToken = data.oldToken || null;

	if (uid === null) { 
		throw new functions.https.HttpsError('invalid-arguments','User must be signed in. Must provide guestName, guestEmail, expectedVisitDate, and visitingOfficeUID.');
	}
	
	const promises = [];
	if (regToken !== null) { 
		const dbop1 =  db.collection('users').doc(uid).update({'registrationToken': admin.firestore.FieldValue.arrayUnion(regToken)})
		.then(res => { 
			console.log("Successfully added new registrationToken for user: ", uid);
			return 
		})
		.catch( error => { 
			console.error(error);
			throw new functions.https.HttpsError(error);
		})
		promises.push(dbop1);
	}
	if ((oldToken !== null) && (oldToken !== regToken)) {
		const dbop2 =  db.collection('users').doc(uid).update({'registrationToken': admin.firestore.FieldValue.arrayRemove(oldToken)})
		.then(res => { 
			console.log("Successfully removed old registrationToken for user: ", uid);
			return 
		})
		.catch( error => { 
			console.error(error);
			throw new functions.https.HttpsError(error);
		})
		promises.push(dbop2);
	}

	return Promise.all(promises)
	.catch( error => { 
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
});

exports.notifyUserOfArrivedGuest = functions.firestore.document('registeredGuests/{registrationID}').onUpdate((change, context) => { 
	const newValue = change.after.data(); 
	const oldValue = change.before.data();
	const arrived = newValue.arrived || null; 
	const hostUID = oldValue.hostUID || null;
	const guestName = oldValue.guestName || null;

	if (arrived === null || hostUID === null) { 
		console.log("Need to provide a value for arrived and hostUID to trigger notification to host.");
		return 
	}

	if (arrived === true && (oldValue.arrived === null || oldValue.arrived === false)) { 
		return db.collection('users').doc(hostUID).get()
		.then( docRef => { 
			if (docRef.exists) { 
				const data = docRef.data();
				const registrationTokens = data.registrationToken || null; 

				const notificationTitle = 'Your guest has arrived.';
				data.notificationTitle = notificationTitle;
				const notificationBody = 'Please meet '+ guestName +' by the reception area.';
				data.notificationBody = notificationBody;

				registrationTokens.forEach( x => { 

					var message = {
						"token" : x,
						"notification" : {
						    "title" : notificationTitle,
						    "body" : notificationBody
						 }
					};

					return admin.messaging().send(message)
					  .then((response) => {
					    // Response is a message ID string.
					    console.log('Successfully sent message:', response);
					    return data
					  })
					  .catch((error) => {
					    console.error(error);
					    throw new functions.https.HttpsError(error);
					  });
				});

				return data;
			} else { 
				throw new functions.https.HttpsError('not-found','Unable to find host user in database.');
			}
		})
		.then( arrivedGuestData => { 
			const dataDict = { 'registeredGuestUID': context.params.registrationID, 'guestName': guestName,'hostUID': hostUID };
			return db.collection('userNotifications').doc(hostUID).collection('notifications').add({
				type: 'arrivedGuestUpdate',
				readStatus: false,
				data: dataDict, 
				title: arrivedGuestData.notificationTitle,
				body: arrivedGuestData.notificationBody,
				timestamp: new Date(new Date().toUTCString())
			})
			.then(docRef => { 
				return db.collection('userNotifications').doc(hostUID).collection('notifications').doc(docRef.id).update({'uid': docRef.id});
			})
			.catch( error => { 
				throw new functions.https.HttpsError(error);
			})

		})
		.catch(error => { 
			console.error(error);
			throw new functions.https.HttpsError(error);
		})
	} 
	return 
});

exports.getUsersRegisteredGuests = functions.https.onCall((data, context) => { 
	const uid = context.auth.uid || null; 
	if (uid === null) { 
		throw new functions.https.HttpsError('invalid-arguments','User must be signed in.');
	}

	const dict = {}; 
	const promises = []
	const upcoming = db.collection('registeredGuests').where('hostUID','==',uid).where('arrived','==',false).where('canceled','==',false).orderBy('expectedVisitDate','asc').get()
	.then( docSnapshots => { 
		const docsData = docSnapshots.docs.map( x => x.data());
		const docs = docsData.map(x => { 
			const officeUID = x.visitingOfficeUID || null; 
			if (officeUID !== null) { 
				return db.collection('offices').doc(officeUID).get() 
				.then(docRef => { 
					const data = docRef.data() || null; 
					x.visitingOffice = data; 
					return x
				})
				.catch( error => { 
					throw new functions.https.HttpsError(error);
				})
			} else { 
				return x
			}
		})

		return Promise.all(docs)
		.then( updatedDocs => { 
			dict['upcoming'] = updatedDocs; 
			return 
		})
		.catch( error => { 
			throw new functions.https.HttpsError(error);
		})
	})
	const past = db.collection('registeredGuests').where('hostUID','==',uid).where('arrived','==',true).where('canceled','==',false).orderBy('expectedVisitDate','asc').get()
	.then( docSnapshots => { 
		const docsData = docSnapshots.docs.map( x => x.data());
		const docs = docsData.map(x => { 
			const officeUID = x.visitingOfficeUID || null; 
			if (officeUID !== null) { 
				return db.collection('offices').doc(officeUID).get() 
				.then(docRef => { 
					const data = docRef.data() || null; 
					x.visitingOffice = data; 
					return x
				})
			} else { 
				return x
			}
		})
		return Promise.all(docs)
		.then( updatedDocs => { 
			dict['past'] = updatedDocs; 
			return 
		})
		.catch( error => { 
			throw new functions.https.HttpsError(error);
		})
	})
	promises.push(upcoming);
	promises.push(past);

	return Promise.all(promises)
	.then( res => { 
		console.log('Successfully got all registered guests for user('+uid+') : '+dict);
		return dict
	})
	.catch( error => { 
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
});

exports.cancelRegisteredGuest = functions.https.onCall((data, context) => { 
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
			throw new functions.https.HttpsError(error);
		})
	})
	.catch( error => { 
		console.error(error); 
		throw new functions.https.HttpsError(error);
	})
});

exports.createServiceRequest = functions.https.onCall((data, context) => { 
	const note = data.note || null;
	const issueType = data.issueType || null;
	const officeUID = data.officeUID || null;
	const userUID = context.auth.uid || null;

	if (officeUID === null || issueType === null) { 
		throw new functions.https.HttpsError('invalid-arguments','Need to provide officeUID and issueType.');
	} else if (userUID === null) { 
		throw new functions.https.HttpsError('unauthenticated','User needs to be logged in');
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
	.then( docRef => { 
		const uid = docRef.id;
		return db.collection('serviceRequests').doc(uid).update({"uid": uid})
		.then( docRef => { 
			return { "id": uid }
		})
	})
	.catch( error => { 
		console.error(error); 
		throw new functions.https.HttpsError(error);
	})

});

exports.getUsersServiceRequests = functions.https.onCall((data, context) => { 
	const userUID = context.auth.uid || null;

	if (userUID === null) { 
		throw new functions.https.HttpsError('unauthenticated','User needs to be logged in.');
	}
	
	var dict = {};
	const open = db.collection('serviceRequests').where('userUID','==',userUID).where('status','==','open').where('canceled','==',false).orderBy('timestamp','asc').get()
	.then( docSnapshots => { 
		const docsData = docSnapshots.docs.map( x => { return x.data() });
		const docs = docsData.map(x => { 
			const officeUID = x.officeUID || null; 
			if (officeUID !== null) { 
				return db.collection('offices').doc(officeUID).get() 
				.then(docRef => { 
					const data = docRef.data() || null; 
					x.office = data; 
					return x
				})
				.catch( error => { 
					throw new functions.https.HttpsError(error);
				})
			} else { 
				return x
			}
		})

		return Promise.all(docs)
		.then( updatedDocs => { 
			dict['open'] = updatedDocs; 
			return
		})
		.catch( error => { 
			throw new functions.https.HttpsError(error);
		})
	});

	const pending = db.collection('serviceRequests').where('userUID','==',userUID).where('status','==','pending').where('canceled','==',false).orderBy('timestamp','asc').get()
	.then( docSnapshots => { 
		const docsData = docSnapshots.docs.map( x => { return x.data() });
		const docs = docsData.map(x => { 
			const officeUID = x.officeUID || null; 
			if (officeUID !== null) { 
				return db.collection('offices').doc(officeUID).get() 
				.then(docRef => { 
					const data = docRef.data() || null; 
					x.office = data; 
					return x
				})
				.catch( error => { 
					throw new functions.https.HttpsError(error);
				})
			} else { 
				return x
			}
		})

		return Promise.all(docs)
		.then( updatedDocs => { 
			dict['pending'] = updatedDocs; 
			return 
		})
		.catch( error => { 
			throw new functions.https.HttpsError(error);
		}) 
	});

	const closed = db.collection('serviceRequests').where('userUID','==',userUID).where('status','==','closed').where('canceled','==',false).orderBy('timestamp','asc').get()
	.then( docSnapshots => { 
		const docsData = docSnapshots.docs.map( x => { return x.data() });
		const docs = docsData.map(x => { 
			const officeUID = x.officeUID || null; 
			if (officeUID !== null) { 
				return db.collection('offices').doc(officeUID).get() 
				.then(docRef => { 
					const data = docRef.data() || null; 
					x.office = data; 
					return x
				})
				.catch( error => { 
					throw new functions.https.HttpsError(error);
				})
			} else { 
				return x
			}
		})

		return Promise.all(docs)
		.then( updatedDocs => { 
			dict['closed'] = updatedDocs; 
			return 
		})
		.catch( error => { 
			throw new functions.https.HttpsError(error);
		})
	});

	return Promise.all([open, pending, closed])
	.then( res => { 
		console.log(dict);
		return dict
	})
	.catch( error => { 
		console.error(error); 
		throw new functions.https.HttpsError(error);
	})
});

exports.cancelServiceRequest = functions.https.onCall((data, context) => { 
	const serviceRequestID = data.serviceRequestID || null;
	const userUID = context.auth.uid || null; 
	// check permissions to see if user is allowed to cancel service request 

	if (serviceRequestID === null || userUID === null) { 
		throw new functions.https.HttpsError('invalid-arguments','Must provide service request UID and user UID.');
	}

	return db.collection("serviceRequests").doc(serviceRequestID).update({'canceled':true})
	.catch(error => { 
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
});

function getTitlefromServiceRequestType(type) { 
	if (type === null) { 
		return "Service Request Update"
	} else if (type === 'coffeeRefill') { 
		return 'Coffee needs to be restocked.'
	} else if (type === 'deskRepair') { 
		return "Desk needs to be repaired."
	} else { 
		return "Service Request Update"
	}
}

exports.notifyUserofServiceRequestStatusChange = functions.firestore.document('serviceRequests/{serviceRequestID}').onUpdate((change, context) => { 
	const newValue = change.after.data(); 
	const oldValue = change.before.data();
	const hostUID = newValue.userUID || null;
	const issueType = newValue.issueType || null; 

	if (newValue.status !== oldValue.status) {
		if (hostUID === null) { 
			return 
		}
		return db.collection('users').doc(hostUID).get()
		.then( docRef => { 
			if (docRef.exists) { 
				const data = docRef.data();
				const registrationTokens = data.registrationToken || null; 

				var notBody = ""
				if (newValue.status === "open") { 
					notBody = "We have received your request and will start working on it asap."
				} else if (newValue.status === "pending")  {
					notBody = "We have started working on your request."
				} else if (newValue.status === "closed")  {
					notBody = "We have finished working on your request."
				}
				const notificationTitle = getTitlefromServiceRequestType(issueType);
				data.notificationTitle = notificationTitle
				data.notificationBody = notBody;

				 registrationTokens.forEach( x => { 
					var message = {
						"token" : x,
						"notification" : {
						    "title" : notificationTitle,
						    "body" : notBody, 
						 }, 
						 "data": { 
 							"type" : "serviceRequestUpdate",
						    'requestUID': context.params.serviceRequestID
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
					    throw new functions.https.HttpsError(error);
					  });
				});

				 return data;
			} else { 
				throw new functions.https.HttpsError('not-found','Unable to find host user in database.');
			}   
		}). then ( serviceRequestData => { 
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
				return db.collection('userNotifications').doc(hostUID).collection('notifications').doc(docRef.id).update({'uid': docRef.id});
			})
			.catch( error => { 
				throw new functions.https.HttpsError(error);
			})
		})
	}
});

exports.findAvailableConferenceRooms = functions.https.onCall((data, context) => { 
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

			return db.collection('conferenceRoomReservations').where('roomUID','==',uid).where('endDate','>=',startDate).get()
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
				throw new functions.https.HttpsError(error);
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
			throw new functions.https.HttpsError(error);
		})

	})
	.then( updatedRoomsData => { 
		console.log(updatedRoomsData);
		var promises = updatedRoomsData.map(x => { 
			const officeUIDs = x.officeUID; 
			return getExpandedOfficeData(officeUIDs)
			.then( officeData => { 
				x.offices = officeData;
				return x
			})
			.catch(error => { 
				throw new functions.https.HttpsError(error);
			})
		});

				// var officePromises = officeUIDs.map( y => { 
			// 	return db.collection('offices').doc(y).get() 
			// 	.then( docRef => { 
			// 		if (docRef.exists) { 
			// 			return docRef.data();
			// 		} else { 
			// 			return {"officeUID": y};
			// 		}
			// 		// throw new functions('not-found','Office not found in database.');
			// 	})
			// 	.catch(error => { 
			// 		throw new functions.https.HttpsError(error);
			// 	})
			// })
			// return Promise.all(officePromises)
			// .then( officeData => { 
			// 	x.offices = officeData;
			// 	return x
			// })
			// .catch(error => { 
			// 	throw new functions.https.HttpsError(error);
			// })

		return Promise.all(promises)
		.then( finalRoomData => { 
			console.log(finalRoomData);
			return finalRoomData
		})
		.catch( error => { 
			throw new functions.https.HttpsError(error);
		})
	})
	.catch( error => { 
		console.error(error);
		throw new functions.https.HttpsError(error);
	})	
});

exports.getReservationsForConferenceRoom = functions.https.onCall((data, context) => { 
	const givenStartDate = new Date(data.startDate) || null;
	const givenEndDate = new Date(data.endDate) || null; 
	const roomUID = data.roomUID || null; 

	if ((givenStartDate === null) || (givenEndDate === null) || (roomUID === null)) { 
		throw new functions.https.HttpsError('invalid-arguments','Need to provide a startDate, endDate, and roomUID')
	}

	return db.collection('conferenceRoomReservations').where('roomUID','==',roomUID).where('endDate','>=',givenStartDate).get()
	.then( docSnapshots => { 
		const docData = docSnapshots.docs.map( x => x.data());
		return docData.filter( x => { 
			// check if startDate of existing res is less than endDate of new res
			const exStartDate = x.startDate.toDate();
			return !(exStartDate > givenEndDate); 
		})
	})
});

// add location to call
// add proper timezone 
function addEvent(event, auth) {
    return new Promise(function(resolve, reject) {
        calendar.events.insert({
            auth: auth,
            calendarId: 'primary',
            sendUpdates:'all',
            resource: {
            	'location': event.location,
                'summary': event.eventName,
                'description': event.description,
                'start': {
                    'dateTime': event.startTime,
                    'timeZone': TIME_ZONE,
                },
                'end': {
                    'dateTime': event.endTime,
                    'timeZone': TIME_ZONE,
                },
                'guestsCanModify': true, 
                'guestsCanInviteOthers': true, 
                'attendees': event.attendees
            },
        }, (err, res) => {
            if (err) {
                console.log('Rejecting because of error');
                reject(err);
            } else { 
            	console.log('Request successful');
            	resolve(res.data);
            }
        });
    });
}

function getExpandedOfficeData(officeUIDs) { 

		// var officePromises = updatedRoomData.map(x => { 
			// const officeUIDs = x.officeUID; 
			var officePromises = officeUIDs.map( y => { 
				return db.collection('offices').doc(y).get() 
				.then( docRef => { 
					if (docRef.exists) { 
						return docRef.data();
					} else { 
						return {"officeUID": y};
					}
					// throw new functions('not-found','Office not found in database.');
				})
				.catch(error => { 
					throw new functions.https.HttpsError(error);
				})
			});

			return Promise.all(officePromises)
			.then( officeData => { 
				var promises = officeData.map( x => { 
					const buildingUID = x.buildingUID;
					return db.collection('buildings').doc(buildingUID).get()
					.then( docRef => { 
						if (docRef.exists) { 
							const data = docRef.data();
							x.building = data; 
						}
						return x
					})
					.catch( error => { 
						throw new functions.https.HttpsError(error);
					})
				});

				return Promise.all(promises)
				.then( newOfficeData => { 
					return newOfficeData;
				})
				.catch(error => {
					console.error(error);
					throw new functions.https.HttpsError(error);
				})
			})
			.catch(error => { 
				throw new functions.https.HttpsError(error);
			})
}

exports.createConferenceRoomReservation = functions.https.onCall((data, context) => { 

	const startTime = new Date(data.startTime) || null;
	const endTime = new Date(data.endTime) || null; 
	const conferenceRoomUID = data.conferenceRoomUID || null;
	const conferenceRoomName = data.conferenceRoomName || null; 
	const officeAddress = data.officeAddress || null;
	const eventName = data.eventName || "No event name provided";
	const description = data.description || "No event description provided";
	const attendees = data.attendees || null;
	const userUID = context.auth.uid || null;
	const shouldCreateCalendarEvent = data.shouldCreateCalendarEvent || null;


	const currentDate = new Date(new Date - (5 * 60000));
	if ((startTime <= currentDate) || (endTime <= currentDate)) { 
		throw new functions.https.HttpsError('invalid-arguments','Cannot make a reservation in the past');
	}

	if ((startTime === null) || (endTime === null) || (conferenceRoomName === null) || (officeAddress === null) || (conferenceRoomUID === null) || (shouldCreateCalendarEvent === null)) { 
		throw new functions.https.HttpsError('invalid-arguments','Need to provide startTime, endTime, conferenceRoomName, officeAddress, shouldCreateCalendarEvent, and conferenceRoomUID.');
	}

	if (userUID === null) { 
		throw new functions.https.HttpsError('unauthenticated','User must be logged in.');
	}

	// check to make sure user can book conference room??????  

	// check that conference room is free at that time and reservable 
	return db.collection('conferenceRoomReservations').where('roomUID','==',conferenceRoomUID).where('endDate','>=',startTime).get()
	.then( docSnapshots => { 
		const docData = docSnapshots.docs.map( x => x.data());
		var conflicts = docData.filter( x => { 
			// check if startDate of existing res is less than endDate of new res
			const exStartDate = x.startDate.toDate();
			const check = (exStartDate < endTime); 
			return check
		});

		if (conflicts.length !== 0) { 
			throw new functions.https.HttpsError('resource-exhausted','Reservations already exists in time frame for conference room.');
		} 
		return
	})
	.then( x => { 
		// create conference room reservation 
		return db.collection('conferenceRoomReservations').add({ 
			title: eventName,
			note: description, 
			roomUID: conferenceRoomUID, 
			startDate: startTime, 
			endDate: endTime, 
			userUID: userUID
		})
		.catch( error => { 
			throw new functions.https.HttpsError(error); 
		})
	})
	.then(docRef => { 
			// if (docRef.exists) { 
		const uid = docRef.id; 
		if (uid === null) { 
			throw new functions.https.HttpsError('internal', 'Unable to add new reservation to database.');
		}

		return db.collection('conferenceRoomReservations').doc(uid).update({"uid":uid})
		.then(docRef => { 
					return 
		})
		.catch(error => { 
			throw new functions.https.HttpsError(error);
		})
	})
	.then( y => { 
		if (shouldCreateCalendarEvent === false) { 
			return 
		}

		// create calendar invite 
		const eventData = {
	        eventName: eventName,
	        description: description,
	        startTime: startTime,
	        endTime: endTime, 
	        attendees: attendees,
	        location: conferenceRoomName+", "+officeAddress
    	};
    	const oAuth2Client = new OAuth2(
	    	 googleCredentials.web.client_id,
	        googleCredentials.web.client_secret,
	        googleCredentials.web.redirect_uris[0]
    	);

	    oAuth2Client.setCredentials({
	        refresh_token: googleCredentials.refresh_token
	    });

    	return addEvent(eventData, oAuth2Client).then(data => {
        	return data;
    	}).catch(err => {
        	console.error('Error adding event: ' + err.message); 
        	throw new functions.https.HttpsError(err);
   		});
	})
	.catch(error => { 
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
});

exports.getEmployeesForOffice = functions.https.onCall((data, context) => { 
	// check to see that user has permission (is part of office)

	const officeUID = data.officeUID || null; 
	const userUID = context.auth.uid || null;

	if (officeUID === null) { 
		throw new functions.https.HttpsError('invalid-arguments','Need to provide officeUID.');
	}
	if (userUID === null) { 
		throw new functions.https.HttpsError('invalid-arguments','User must be logged in.');
	}

	return db.collection('offices').doc(officeUID).get()
	.then( docRef => { 
		if (docRef.exists) { 
			const data = docRef.data(); 
			const employees = data.employees;
			const filteredEmployees = employees.filter(x => { 
				return (x !== userUID)
			});
			return filteredEmployees 
		} else { 
			throw new functions.https.HttpsError('not-found','Could not find office in database.');
		}
	})
	.then( employees => { 
		var promises = employees.map(x => { 
			return db.collection('users').doc(x).get()
			.then( docRef => { 
				if (docRef.exists) { 
					return docRef.data()
				} else { 
					return x;
				}
			})
			.catch( error => { 
				throw new functions.https.HttpsError(error);
			})
		})

		return Promise.all(promises)
		.then( employeeDataArray => { 
			return employeeDataArray
		})
		.catch( error => { 
			throw new functions.https.HttpsError(error);
		})
	})
	.catch( error => { 
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
});

exports.getUsersNotifications = functions.https.onCall((data, context) => { 
	const userUID = context.auth.uid || null; 

	if (userUID === null) {
		throw new functions.https.HttpsError('invalid-arguments', 'User must be logged in.');
	}

	return db.collection('userNotifications').doc(userUID).collection('notifications').orderBy('timestamp','desc').get()
	.then( docSnapshots => { 
		const docsData = docSnapshots.docs.map( x => x.data());
		return docsData;
	})
	.catch( error => { 
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
});

exports.getAllConferenceRoomsForUser = functions.https.onCall((data, context) => { 
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
	  				
	  				return getExpandedOfficeData(x.officeUID)
	  				.then( officeData => { 
	  					x.offices = officeData; 
	  					conferenceRooms.push(x);
	  					return 
	  				})
	  				.catch(error => { 
						throw new functions.https.HttpsError(error);
	  				})

	  			})

	  			return Promise.all(roomPromises)
	  			.catch(error => { 
	  				throw new functions.https.HttpsError(error);
	  			})
	  		})
	  		.catch( error => { 
	  			throw new functions.https.HttpsError(error);
			})
	  	})

	  	return Promise.all(promises)
	  	.then( res => { 
	  		return conferenceRooms
	  	})
	  	.catch( error => { 
	  		throw new functions.https.HttpsError(error);
	  	})

	})
	.catch(error => { 
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
});

exports.getAllConferenceRoomReservationsForUser = functions.https.onCall((data, context) => { 
	const userUID = context.auth.uid || null;

	if (userUID === null) { 
		throw new functions.https.HttpsError('unauthenticated','User must be logged in');
	}

	return db.collection('conferenceRoomReservations').where('userUID','==',userUID).orderBy('startDate','desc').get()
	.then( docSnapshots => { 
		const docsData = docSnapshots.docs.map( x => x.data() );
		return docsData
	})
	.catch( error => { 
		console.log(error);
		throw new functions.https.HttpsError(error);
	})

});


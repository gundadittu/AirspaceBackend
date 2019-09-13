'use strict';

var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	storageBucket: "airspace-management-app.appspot.com"
});

const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'https://8825e624e2594f1d8ca77d056c8b56dd@sentry.io/1395312' });
var Airtable = require('airtable');
const stripe = require('stripe')('sk_live_xp58HHXNsSPDi6GPBrB2ozvT005TEJMfpl');

const functions = require('firebase-functions');
const conferenceRoomFunctions = require('./conferenceRooms');
const hotDeskFunctions = require('./hotDesks');
const eventFunctions = require('./events');
const reservationFunctions = require('./reservations');
const notificationFunctions = require('./notifications');
const serviceRequestFunctions = require('./serviceRequests');
const registerGuestFunctions = require('./registerGuests');
const officeFunctions = require('./offices');
const officeAdminFunctions = require('./officeAdmin');
const helperFunctions = require('./helpers');
const emailHelperFunctions = require('./emailHelper');
const storageFunctions = require('./storage');
const servicePortalFunctions = require('./servicePortal');
const alexaFunctions = require('./alexaFunctions');

var db = admin.firestore();
// const settings = { timestampsInSnapshots: true };
// db.settings(settings);

const webAppBaseURL = 'https://airspace-management-app.firebaseapp.com'

exports.getUsersReservationsForRange = functions.https.onCall((data, context) => {
	return reservationFunctions.getUsersReservationsForRange(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.findAvailableConferenceRooms = functions.https.onCall((data, context) => {
	return conferenceRoomFunctions.findAvailableConferenceRooms(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.getReservationsForConferenceRoom = functions.https.onCall((data, context) => {
	return conferenceRoomFunctions.getReservationsForConferenceRoom(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.createConferenceRoomReservation = functions.https.onCall((data, context) => {
	return conferenceRoomFunctions.createConferenceRoomReservation(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.getAllConferenceRoomsForUser = functions.https.onCall((data, context) => {
	return conferenceRoomFunctions.getAllConferenceRoomsForUser(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.getAllConferenceRoomReservationsForUser = functions.https.onCall((data, context) => {
	return conferenceRoomFunctions.getAllConferenceRoomReservationsForUser(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.cancelRoomReservation = functions.https.onCall((data, context) => {
	return conferenceRoomFunctions.cancelRoomReservation(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.updateConferenceRoomReservation = functions.https.onCall((data, context) => {
	return conferenceRoomFunctions.updateConferenceRoomReservation(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.createHotDeskReservation = functions.https.onCall((data, context) => {
	return hotDeskFunctions.createHotDeskReservation(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.findAvailableHotDesks = functions.https.onCall((data, context) => {
	return hotDeskFunctions.findAvailableHotDesks(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.getReservationsForHotDesk = functions.https.onCall((data, context) => {
	return hotDeskFunctions.getReservationsForHotDesk(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.getAllHotDesksForUser = functions.https.onCall((data, context) => {
	return hotDeskFunctions.getAllHotDesksForUser(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.getAllHotDeskReservationsForUser = functions.https.onCall((data, context) => {
	return hotDeskFunctions.getAllHotDeskReservationsForUser(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.updateHotDeskReservation = functions.https.onCall((data, context) => {
	return hotDeskFunctions.updateHotDeskReservation(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.cancelHotDeskReservation = functions.https.onCall((data, context) => {
	return hotDeskFunctions.cancelHotDeskReservation(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.getUsersNotifications = functions.https.onCall((data, context) => {
	return notificationFunctions.getUsersNotifications(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.getUpcomingEventsForUser = functions.https.onCall((data, context) => {
	return eventFunctions.getUpcomingEventsForUser(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.createRegisteredGuest = functions.https.onCall((data, context) => {
	return registerGuestFunctions.createRegisteredGuest(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.updateUserFCMRegToken = functions.https.onCall((data, context) => {
	return notificationFunctions.updateUserFCMRegToken(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.getUsersRegisteredGuests = functions.https.onCall((data, context) => {
	return registerGuestFunctions.getUsersRegisteredGuests(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.cancelRegisteredGuest = functions.https.onCall((data, context) => {
	return registerGuestFunctions.cancelRegisteredGuest(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.createServiceRequest = functions.https.onCall((data, context) => {
	return serviceRequestFunctions.createServiceRequest(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.getUsersServiceRequests = functions.https.onCall((data, context) => {
	return serviceRequestFunctions.getUsersServiceRequests(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.cancelServiceRequest = functions.https.onCall((data, context) => {
	return serviceRequestFunctions.cancelServiceRequest(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.notifyUserOfArrivedGuest = functions.firestore.document('registeredGuests/{registrationID}').onUpdate((change, context) => {
	return notificationFunctions.notifyUserOfArrivedGuest(change, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.notifyUserofServiceRequestStatusChange = functions.firestore.document('serviceRequests/{serviceRequestID}').onUpdate((change, context) => {
	return notificationFunctions.notifyUserofServiceRequestStatusChange(change, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.notifyUserofEventCreation = functions.firestore.document('events/{eventID}').onCreate((snap, context) => {
	return notificationFunctions.notifyUserofEventCreation(snap, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.notifyUserofOfficeAnnouncement = functions.firestore.document('officeAnnouncements/{announcementID}').onCreate((snap, context) => {
	return notificationFunctions.notifyUserofOfficeAnnouncement(snap, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.getEmployeesForOffice = functions.https.onCall((data, context) => {
	return officeFunctions.getEmployeesForOffice(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.getSpaceInfoForUser = functions.https.onCall((data, context) => {
	return officeFunctions.getSpaceInfoForUser(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.guestSelfCheckIn = functions.https.onCall((data, context) => {
	return registerGuestFunctions.guestSelfCheckIn(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

// *---- OFFICE ADMIN FUNCTIONS ---* 

exports.getAllUsersForOffice = functions.https.onCall((data, context) => {
	return officeAdminFunctions.getAllUsersForOffice(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.addUserToOffice = functions.https.onCall((data, context) => {
	return officeAdminFunctions.addUserToOffice(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.removeUserFromOffice = functions.https.onCall((data, context) => {
	return officeAdminFunctions.removeUserFromOffice(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.editUserForOffice = functions.https.onCall((data, context) => {
	return officeAdminFunctions.editUserForOffice(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
})

exports.getAllConferenceRoomsForOffice = functions.https.onCall((data, context) => {
	return officeAdminFunctions.getAllConferenceRoomsForOffice(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.getAllHotDesksForOffice = functions.https.onCall((data, context) => {
	return officeAdminFunctions.getAllHotDesksForOffice(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.addConferenceRoomForOfficeAdmin = functions.https.onCall((data, context) => {
	return officeAdminFunctions.addConferenceRoomForOfficeAdmin(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.addHotDeskForOfficeAdmin = functions.https.onCall((data, context) => {
	return officeAdminFunctions.addHotDeskForOfficeAdmin(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.editConferenceRoomForOfficeAdmin = functions.https.onCall((data, context) => {
	return officeAdminFunctions.editConferenceRoomForOfficeAdmin(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
})

exports.editHotDeskForOfficeAdmin = functions.https.onCall((data, context) => {
	return officeAdminFunctions.editHotDeskForOfficeAdmin(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
})

exports.getAllRegisteredGuestsForOfficeAdmin = functions.https.onCall((data, context) => {
	return officeAdminFunctions.getAllRegisteredGuestsForOfficeAdmin(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
})

exports.getEventsForOfficeAdmin = functions.https.onCall((data, context) => {
	return officeAdminFunctions.getEventsForOfficeAdmin(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
})

exports.editEventsForOfficeAdmin = functions.https.onCall((data, context) => {
	return officeAdminFunctions.editEventsForOfficeAdmin(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.createEventForOfficeAdmin = functions.https.onCall((data, context) => {
	return officeAdminFunctions.createEventForOfficeAdmin(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.getSpaceInfoForOfficeAdmin = functions.https.onCall((data, context) => {
	return officeAdminFunctions.getSpaceInfoForOfficeAdmin(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.getAllServiceRequestsForOfficeAdmin = functions.https.onCall((data, context) => {
	return officeAdminFunctions.getAllServiceRequestsForOfficeAdmin(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
})

exports.updateServiceRequestStatusForOfficeAdmin = functions.https.onCall((data, context) => {
	return officeAdminFunctions.updateServiceRequestStatusForOfficeAdmin(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
})

exports.getServiceRequestAutoRoutingForOfficeAdmin = functions.https.onCall((data, context) => {
	return officeAdminFunctions.getServiceRequestAutoRoutingForOfficeAdmin(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
})

exports.updateServiceRequestAutoRoutingForOfficeAdmin = functions.https.onCall((data, context) => {
	return officeAdminFunctions.updateServiceRequestAutoRoutingForOfficeAdmin(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
})

exports.postAnnouncementForOfficeAdmin = functions.https.onCall((data, context) => {
	return officeAdminFunctions.postAnnouncementForOfficeAdmin(data, context, db, admin)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
})

exports.getAnnouncementsForOfficeAdmin = functions.https.onCall((data, context) => {
	return officeAdminFunctions.getAnnouncementsForOfficeAdmin(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
})

exports.changeRegisteredGuestStatusForOfficeAdmin = functions.https.onCall((data, context) => {
	return officeAdminFunctions.changeRegisteredGuestStatusForOfficeAdmin(data, context, db)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
})

// *--- ALEXA ---*

// exports.handler = functions.https.onRequest((req, res) => {
// 	console.log(14);

// 	try { 
// 		const body = req.body; 
// 		const response = alexaFunctions.handler(body); 
// 		res.status(200).send(response);
// 	} catch(err) { 
// 		console.error(err);
// 		Sentry.captureException(err);
// 		res.status(400).send(err);
// 	}
// })

exports.addRequestFromAlexa = functions.https.onCall((data, context) => {
	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
	return servicePortalFunctions.addRequestFromAlexa(data, context, db, base)
		.catch(error => {
			console.error(error);
			Sentry.captureException(error);
			throw error;
		});
});

exports.submitSupportTicket = functions.https.onCall((data, context) => {
	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
	return servicePortalFunctions.submitSupportTicket(data, context, db, base)
		.catch(error => {
			console.error(error);
			Sentry.captureException(error);
			throw error;
		});
})

exports.getAlexaToken = functions.https.onRequest((req, res) => {
	const body = req.body;
	return servicePortalFunctions.getAlexaToken(body, res, db, admin)
		.catch(error => {
			console.error(error);
			Sentry.captureException(error);
			res.status(500).send(error);
			return
		});
});

exports.linkAlexa = functions.https.onCall((data, context) => {
	return servicePortalFunctions.linkAlexa(data, context, db)
		.catch(error => {
			console.error(error);
			Sentry.captureException(error);
			throw error;
		});
})

// *--- SERVICE PORTAL FUNCTIONS ----*

// exports.getPendingPackages = functions.https.onCall((data, context) => {
// 	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
// 	return servicePortalFunctions.getPendingPackages(data, context, db, base)
// 		.catch(error => {
// 			console.error(error);
// 			Sentry.captureException(error);
// 			throw error;
// 		});
// });

exports.getFeaturedAdminFeed = functions.https.onCall((data, context) => {
	// "Featured Services" base
	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('appstwGksX7xX4s1u');
	return servicePortalFunctions.getFeaturedAdminFeed(base)
		.catch(error => {
			console.error(error);
			Sentry.captureException(error);
			throw error;
		});
})

exports.acceptServicePlanOption = functions.https.onCall((data, context) => {
	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
	return servicePortalFunctions.acceptServicePlanOption(data, context, db, base)
		.catch(error => {
			console.error(error);
			Sentry.captureException(error);
			throw error;
		});
})

exports.pendingServicePlanOption = functions.https.onCall((data, context) => {
	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
	return servicePortalFunctions.pendingServicePlanOption(data, context, db, base)
		.catch(error => {
			console.error(error);
			Sentry.captureException(error);
			throw error;
		});
})

exports.confirmPendingPackage = functions.https.onCall((data, context) => {
	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
	return servicePortalFunctions.confirmPendingPackage(data, context, db, base)
		.catch(error => {
			console.error(error);
			Sentry.captureException(error);
			throw error;
		});
})

exports.rejectPendingPackage = functions.https.onCall((data, context) => {
	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
	return servicePortalFunctions.rejectPendingPackage(data, context, db, base)
		.catch(error => {
			console.error(error);
			Sentry.captureException(error);
			throw error;
		});
})

// exports.acceptServicePlanAddOn = functions.https.onCall((data, context) => {
// 	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
// 	return servicePortalFunctions.acceptServicePlanAddOn(data, context, db, base)
// 		.catch(error => {
// 			console.error(error);
// 			Sentry.captureException(error);
// 			throw error;
// 		});
// })

// exports.pendingServicePlanAddOn = functions.https.onCall((data, context) => {
// 	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
// 	return servicePortalFunctions.pendingServicePlanAddOn(data, context, db, base)
// 		.catch(error => {
// 			console.error(error);
// 			Sentry.captureException(error);
// 			throw error;
// 		});
// })

exports.addRequestFromPortal = functions.https.onCall((data, context) => {
	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
	return servicePortalFunctions.addRequestFromPortal(data, context, db, base)
		.catch(error => {
			console.error(error);
			Sentry.captureException(error);
			throw error;
		});
});

exports.getOfficeProfileForAdmin = functions.https.onCall((data, context) => {
	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
	return servicePortalFunctions.getOfficeProfileForAdmin(data, context, db, base)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
})

exports.updateOfficeProfileForAdmin = functions.https.onCall((data, context) => {
	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
	return servicePortalFunctions.updateOfficeProfileForAdmin(data, context, db, base)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
})

exports.uploadAttachmentOfficeProfileForAdmin = functions.https.onCall((data, context) => {
	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
	return servicePortalFunctions.uploadAttachmentOfficeProfileForAdmin(data, context, db, base)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
})

exports.getExperienceManagerInfoForOffice = functions.https.onCall((data, context) => {
	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
	return servicePortalFunctions.getExperienceManagerInfoForOffice(data, context, db, base)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		})
})

exports.getAllInvoicesForOffice = functions.https.onCall((data, context) => {
	return servicePortalFunctions.getAllInvoicesForOffice(data, context, db, stripe)
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		});
});

exports.getServicePlanForOffice = functions.https.onCall((data, context) => {
	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
	return servicePortalFunctions.getServicePlanForOffice(data, context, db, base)
		.catch(error => {
			Sentry.captureException(error);
			console.error(error);
			throw error;
		})
});

exports.getOfficeReport = functions.https.onCall((data, context) => {
	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
	return servicePortalFunctions.getOfficeReport(data, context, db, base)
		.catch(error => {
			Sentry.captureException(error);
			console.error(error);
			throw error;
		})

});

// *---- LANDLORD FUNCTIONS -----*

exports.getBuildingOfficeReport = functions.https.onCall((data, context) => {
	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
	return servicePortalFunctions.getBuildingOfficeReport(data, context, db, base)
		.catch(error => {
			Sentry.captureException(error);
			console.error(error);
			throw error;
		})

});

// *--------------*

exports.updateServiceRequestStatusFromEmailLink = functions.https.onCall((data, context) => {
	const selectedServiceRequestUID = data.selectedServiceRequestUID || null;
	const newStatus = data.newStatus || null;

	if ((selectedServiceRequestUID === null) || (newStatus === null)) {
		throw new functions.https.HttpsError('invalid-arguments', 'Must provide selectedServiceRequestUID & newStatus.');
	}

	const allStatusOptions = ['open', 'pending', 'closed'];
	if (allStatusOptions.includes(newStatus) === false) {
		throw new functions.https.HttpsError('invalid-arguments', 'Must provide a valid newStatus.');
	}

	return db.collection('serviceRequests').doc(selectedServiceRequestUID).get()
		.then(docRef => {
			if (docRef.exists) {
				const data = docRef.data();
				const officeUID = data.officeUID || null;
				if (officeUID === null) {
					throw new functions.https.HttpsError('permission-denied', 'This service request does not belong to an office.');
				}
				return
			} else {
				throw new functions.https.HttpsError('not-found', 'Service request not found.')
			}
		})
		.then(() => {
			return db.collection('serviceRequests').doc(selectedServiceRequestUID).update({ status: newStatus });
		})
})

exports.getCreatePasswordLink = functions.https.onCall((data, context) => {
	const uid = data.uid || null;
	if (uid === null) {
		throw new functions.https.HttpsError('invalid-argument', 'Need to provide a value for uid argument.');
	}
	return db.collection('users').doc(uid).get()
		.then(docRef => {
			const data = docRef.data() || null;
			if (data === null) {
				throw new functions.https.HttpsError('not-found', 'Data not found for user object.');
			}
			const email = data.email || null;
			if (email === null) {
				throw new functions.https.HttpsError('not-found', 'Email not found for user object.');
			}
			const setInitialPassword = data.setInitialPassword || null;
			if (setInitialPassword === true) {
				throw new functions.https.HttpsError('permission-denied', 'This link has expired. User has already set their initial password.');
			}
			return email
		})
		.then(email => {
			return admin.auth().generatePasswordResetLink(email)
		})
		.then((passwordResetURL) => {
			return db.collection('users').doc(uid).update({ setInitialPassword: true })
				.then(() => {
					return passwordResetURL;
				})
		})
})

exports.triggerRegGuestCreationEmail = functions.firestore.document('registeredGuests/{uid}').onCreate((snap, context) => {
	const newValue = snap.data();
	const regGuestUID = context.params.uid || null;
	if (regGuestUID === null) {
		throw new functions.https.HttpsError('invalid-arguments', 'Missing required arguments');
	}
	const guestName = newValue.guestName || null;
	const guestEmail = newValue.guestEmail || null;
	const hostUID = newValue.hostUID || null;
	const visitingOfficeUID = newValue.visitingOfficeUID || null;
	var chicagoTime = newValue.expectedVisitDate.toDate().toLocaleString("en-US", { timeZone: "America/Chicago" });
	const visitingDateTime = chicagoTime || null;
	const checkInURL = webAppBaseURL + '/general/arrivedGuest/' + regGuestUID;
	let visitingOfficeName = null;
	let visitingOfficeAddress = null;
	let hostName = null;

	if ((guestName === null) || (guestEmail === null) || (visitingOfficeUID === null) || (visitingDateTime === null) || (hostUID === null)) {
		throw new functions.https.HttpsError('invalid-arguments', 'Missing required arguments');
	}

	return db.collection('offices').doc(visitingOfficeUID).get()
		.then(docRef => {
			const data = docRef.data() || null;
			if (data === null) {
				throw new functions.https.HttpsError('not-found', 'Data not found for office');
			}
			visitingOfficeName = data.name || null;
			const buildingUID = data.buildingUID || null;
			if (buildingUID === null) {
				throw new functions.https.HttpsError('not-found', 'buildingUID not found for office.');
			}

			return db.collection('buildings').doc(buildingUID).get()
				.then(docRef => {
					const data = docRef.data() || null;
					if (data === null) {
						throw new functions.https.HttpsError('not-found', 'Data not found for building.');
					}
					const address = data.address || null;
					visitingOfficeAddress = address;
					return
				})
		})
		.then(() => {
			return db.collection('users').doc(hostUID).get()
				.then(docRef => {
					const data = docRef.data() || null;
					if (data === null) {
						throw new functions.https.HttpsError('not-found', 'Data not found for users.');
					}
					hostName = data.firstName || null;
					return
				})
		})
		.then(() => {
			let dict = {
				guestEmail: guestEmail,
				guestName: guestName,
				hostName: hostName,
				visitingOfficeName: visitingOfficeName,
				visitingOfficeAddress: visitingOfficeAddress,
				visitingDateTime: visitingDateTime,
				checkInURL: checkInURL
			};
			return emailHelperFunctions.sendRegGuestCreationEmail(dict);
		})
})

exports.triggerServiceRequestAutoRoutingEmail = functions.firestore.document('serviceRequests/{uid}').onCreate((snap, context) => {
	const newValue = snap.data();
	const issueType = newValue.issueType || null;
	const officeUID = newValue.officeUID || null;
	const hostUID = newValue.userUID || null;
	const requestUID = context.params.uid || null;

	if ((officeUID === null) || (issueType === null) || (hostUID === null) || (requestUID === null)) {
		throw new functions.https.HttpsError('invalid-arguments', 'Missing required arguments');
	}

	if (helperFunctions.validateServiceRequestType(issueType) === false) {
		throw new functions.https.HttpsError('not-found', 'Not a valid service issue type');
	}

	let allEmails = [];

	let requestType = helperFunctions.getServiceRequestTitle(issueType);
	let requestStatus = newValue.status || null;
	var chicagoTime = newValue.timestamp.toDate().toLocaleString("en-US", { timeZone: "America/Chicago" });
	let requestTimestamp = chicagoTime || null;
	let requestDetails = newValue.note || null;
	let requestOfficeName = null;
	let requestAddress = null;
	let requestHostName = null;
	let requestHostEmail = null;
	let requestImageURL = null;
	let finishedURL = webAppBaseURL + '/general/updateServiceRequestStatus/' + requestUID + '/closed';
	let inProgressURL = webAppBaseURL + '/general/updateServiceRequestStatus/' + requestUID + '/pending';

	return db.collection('serviceRequestsAutoRouting').doc(officeUID).get()
		.then(docRef => {
			if (docRef.exists) {
				const data = docRef.data();
				const emails = data[issueType] || null;

				if (emails === null) {
					throw new functions.https.HttpsError('not-found', 'No emails provided for this service request.');
				}
				allEmails = emails;
				return
			} else {
				throw new functions.https.HttpsError('not-found', 'No emails provided for this service request.');
			}
		})
		.then(() => {
			const firstPromise = db.collection('users').doc(hostUID).get()
				.then(docRef => {
					const data = docRef.data() || null;
					if (data === null) {
						throw new functions.https.HttpsError('not-found', 'No user info found for this service request.');
					}
					requestHostName = data.firstName + " " + data.lastName;
					requestHostEmail = data.email;
					return
				})

			const secondPromise = db.collection('offices').doc(officeUID).get()
				.then(docRef => {
					const data = docRef.data() || null;
					if (data === null) {
						return
					}
					requestOfficeName = data.name;
					const buildingUID = data.buildingUID || null;
					if (buildingUID === null) {
						return
					}
					return db.collection('buildings').doc(buildingUID).get()
						.then(bDocRef => {
							const bData = bDocRef.data() || null;
							if (bData === null) {
								return
							}
							requestAddress = bData.address;
							return
						})
				})

			return Promise.all([firstPromise, secondPromise]);
		})
		.then(() => {
			return storageFunctions.getServiceRequestImageURL(requestUID, admin)
				.then(url => {
					requestImageURL = url;
					return
				})
		})
		.then(() => {
			let dict = {
				recipientEmails: allEmails,
				requestType: requestType,
				requestStatus: requestStatus,
				requestTimestamp: requestTimestamp,
				requestDetails: requestDetails,
				requestOfficeName: requestOfficeName,
				requestAddress: requestAddress,
				requestHostName: requestHostName,
				requestHostEmail: requestHostEmail,
				requestImageURL: requestImageURL,
				finishedURL: finishedURL,
				inProgressURL: inProgressURL
			};
			return emailHelperFunctions.sendServiceRequestAutoRoutingEmail(dict);
		})
});

// *--- ADMIN FUNCTIONS ----*

exports.getUserTypeFromEmail = functions.https.onCall((data, context) => {
	const userEmail = data.email || null;
	if (userEmail === null) {
		throw new functions.https.HttpsError('invalid-argument', 'Must provide email.');
	}

	return admin.auth().getUserByEmail(userEmail)
		.then(userRecord => {
			const userUID = userRecord.uid || null;
			if (userUID === null) {
				throw new functions.https.HttpsError('not-found', 'User not found.');
			}

			return db.collection('users').doc(userUID).get()
				.then(docRef => {
					if (docRef.exists) {
						const data = docRef.data();
						const type = data.type || null;
						return { "type": type };
					} else {
						throw new functions.https.HttpsError('not-found', 'Could not find user with uid: ', userUID);
					}
				})
				.catch(error => {
					Sentry.captureException(error);
					throw error;
				})
		})
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		})
});


exports.getUserInfo = functions.https.onCall((data, context) => {
	const userUID = context.auth.uid;
	if (userUID === null) {
		throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
	}

	return db.collection('users').doc(userUID).get()
		.then(docRef => {
			if (docRef.exists) {
				const data = docRef.data();
				return data;
			} else {
				throw new functions.https.HttpsError('not-found', 'Could not find user with uid: ', userUID);
			}
		})
		.then(data => {
			const officeAdmin = data.officeAdmin || null;
			if ((officeAdmin === null) || (officeAdmin.length === 0)) {
				return data
			}
			return helperFunctions.getExpandedOfficeData(officeAdmin, db)
				.then(officeData => {
					data.officeAdmin = officeData;
					return data;
				})
		})
		.then(data => {
			const userOffices = data.offices || null;
			if ((userOffices === null) || (userOffices.length === 0)) {
				return data
			}
			return helperFunctions.getExpandedOfficeData(userOffices, db)
				.then(officeData => {
					data.offices = officeData;
					return data;
				})
		})
		.then(data => {
			const userBuildings = data.buildingUIDs || null;
			if ((userBuildings === null) || (userBuildings.length === 0)) {
				return data
			}
			return helperFunctions.getExpandedBuildingData(userBuildings, db)
				.then(buildingData => {
					data.buildings = buildingData;
					data.buildingUIDs = userBuildings;
					return data;
				})
		})
		.then(data => {
			const currUserUID = data.uid || null;
			if (currUserUID === null) {
				return data;
			}

			return storageFunctions.getProfileImageURL(currUserUID, admin)
				.then(url => {
					if (url === null) {
						return data
					}
					data.profileImageURL = url;
					return data;
				})
				.catch(error => {
					Sentry.captureException(error);
					return data;
				})
		})
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		})
});

exports.getUserType = functions.https.onCall((data, context) => {
	const userUID = context.auth.uid;
	if (userUID === null) {
		throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
	}

	return db.collection('users').doc(userUID).get()
		.then(docRef => {
			if (docRef.exists) {
				const data = docRef.data();
				return data;
			} else {
				throw new functions.https.HttpsError('not-found', 'Could not find user with uid: ', userUID);
			}
		})
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		})
});


exports.getUserProfile = functions.https.onCall((data, context) => {
	const userUID = data.userUID || null;
	if (userUID === null) {
		throw new functions.https.HttpsError('invalid-arguments', 'Need to provide a userUID.');
	}

	return db.collection('users').doc(userUID).get()
		.then(docRef => {
			if (docRef.exists) {
				const data = docRef.data();
				return data;
			} else {
				throw new functions.https.HttpsError('not-found', 'Could not find user with uid: ', userUID);
			}
		})
		.then(data => {
			const companies = data.companies || null;
			if (companies === null) {
				return data
			}
			const promises = Promise.all(companies.map(x => {
				return db.collection('companies').doc(x).get()
					.then(docRef => {
						return docRef.data();
					})
					.catch(error => {
						Sentry.captureException(error);
						throw error;
					})
			}
			));
			return promises
				.then(companyProfiles => {
					data.companies = companyProfiles;
					return data;
				})
		})
		.then(data => {
			const offices = data.offices || null;
			if (offices === null) {
				return data
			}
			const promises = Promise.all(offices.map(x => {
				return db.collection('offices').doc(x).get()
					.then(docRef => {
						return docRef.data();
					})
					.catch(error => {
						Sentry.captureException(error);
						throw error;
					})
			}
			));
			return promises
				.then(officeProfiles => {
					data.offices = officeProfiles;
					return data;
				})
		})
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		})
});

exports.createUser = functions.https.onCall((data, context) => {
	return helperFunctions.createUser(data, context, db, admin);
});

exports.getAllUsers = functions.https.onCall((data, context) => {
	// confirm user is admin !!!!
	const uid = context.auth.uid;
	const page = data.page || "0";
	return admin.auth().listUsers(1000, page).then(listUserResults => {
		console.log("Successfully retrieved list of users: ", listUserResults);
		const users = listUserResults.users;
		const nextPageToken = listUserResults.pageToke || null;
		return {
			"users": users,
			"nextPageToken": nextPageToken
		};
	}).catch(error => {
		console.log("Error getting all users: ", error);
		Sentry.captureException(error);
		throw new functions.https.HttpsError('internal', 'Error fetching list of users.')
	})
});

exports.updateUserBioInfo = functions.https.onCall((data, context) => {
	const authUserUID = context.auth.uid || null
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
		.then(docRef => {
			if (doc.exists) {
				const data = doc.data();
				const userType = data.type;

				// need to add check to see if tenantAdmin in order to change email address
				if (userType === 'admin') {
					adminStatus = true;
					return
				} else if (uid !== authUserUID) { // check if an user is attempting to change another users info
					throw new functions.https.HttpsError('permission-denied', 'User can not only change their own bio info.');
				} else {
					// this case means uid === authUserUID
					return
				}

			} else {
				// doc.data() will be undefined in this case
				throw new functions.https.HttpsError('invalid-arguments', 'User uid is not valid.');
			}
		})
		.then(x => {
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

			const firestoreUpdate = db.collection("users").doc(uid).update(dict);
			return Promise.all([firestoreUpdate])
				.then(res => {
					console.log("Successfully update bio info for user profile: ", uid);
					return
				})
				.catch(error => {
					Sentry.captureException(error);
					throw new functions.https.HttpsError('internal', "There was an issue updating user profile bio info: ", uid);
				})
		})
		.catch(error => {
			Sentry.captureException(error);
			throw error;
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
		.then((userRecord) => {
			console.log("Successfully updated user info for: ", uid);
			return
		})
		.catch((error) => {
			Sentry.captureException(error);
			throw error;
		})
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
			Sentry.captureException(error);
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
	}).then((docRef) => {
		const id = docRef.id
		return db.collection('buildings').doc(id).update({
			uid: id
		})
			.then((docRef) => {
				console.log("Successfully added building.");
				return
			})
			.catch((error) => {
				console.log("Error adding building id to database: ", error);
				Sentry.captureException(error);
				throw new functions.https.HttpsError("internal", "Error adding new building ID into database.")
			})
	})
		.catch((error) => {
			console.log("Error adding building: ", error);
			Sentry.captureException(error);
			throw new functions.https.HttpsError("internal", "Error adding new building data into database.")
		})
});

exports.getAllBuildings = functions.https.onCall((data, context) => {
	return db.collection('buildings').get()
		.then((snapshot) => {
			const docs = snapshot.docs.map(x => x.data());
			console.log("Successfully got all buildings: ", docs);
			return { "buildings": docs }
		})
		.catch((error) => {
			Sentry.captureException(error);
			throw new functions.https.HttpsError("internal", "Unable to get all buildings: ", error);
		})
});

exports.addLandlordToBuilding = functions.https.onCall((data, context) => {
	const userUID = data.userUID || null;
	const buildingUID = data.buildingUID || null;
	if (userUID === null || buildingUID === null) {
		throw new functions.https.HttpsError("invalid-arguments", "Need to provide building and landlord UID.");
	}

	const dbop1 = db.collection("buildings").doc(buildingUID).update({ "landlords": admin.firestore.FieldValue.arrayUnion(userUID) })
		.then(docRef => {
			console.log("Successfully added landlord to building.");
			return
		})
		.catch(error => {
			console.log("Error setting landlord for building.");
			Sentry.captureException(error);
			throw new functions.https.HttpsError("internal", "Unable to add landlord for building in database: ", error);
		})

	const dbop2 = db.collection("users").doc(userUID).update({ "buildings": admin.firestore.FieldValue.arrayUnion(buildingUID) })
		.then(docRef => {
			console.log("Successfully added building under landlord.");
			return
		})
		.catch(error => {
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

	const dbop1 = db.collection("buildings").doc(buildingUID).update({ "landlords": admin.firestore.FieldValue.arrayRemove(userUID) })
		.then(docRef => {
			console.log("Successfully removed landlord to building.");
			return
		})
		.catch(error => {
			console.log("Error removing landlord for building.");
			Sentry.captureException(error);
			throw new functions.https.HttpsError("internal", "Unable to remove landlord for building in database: ", error);
		})

	const dbop2 = db.collection("users").doc(userUID).update({ "buildings": admin.firestore.FieldValue.arrayRemove(buildingUID) })
		.then(docRef => {
			console.log("Successfully removed building under landlord.");
			return
		})
		.catch(error => {
			console.log("Error removing building under landlord in database.");
			Sentry.captureException(error);
			throw new functions.https.HttpsError("internal", "Unable to remove building under landlord in database.")
		})

	return Promise.all([dbop1, dbop2]);
});

exports.getAllLandlords = functions.https.onCall((data, context) => {
	const query = db.collection("users").where('type', '==', 'landlord');
	return query.get()
		.then((querySnapshot) => {
			const landlordsArray = querySnapshot.docs.map(x => x.data());
			console.log("Successfully got all landlords: ", landlordsArray);
			return landlordsArray;
		})
		.catch(error => {
			Sentry.captureException(error);
			throw new functions.https.HttpsError('internal', 'Unable to access database: ', error);
		})
});

exports.getBuildingProfile = functions.https.onCall((data, context) => {
	const buildingUID = data.buildingUID || null;
	if (buildingUID === null) {
		throw new functions.https.HttpsError('invalid-arguments', 'Must provide building uid.')
	}
	return db.collection("buildings").doc(buildingUID).get()
		.then(doc => {
			if (doc.exists) {
				const data = doc.data();
				return data;
			} else {
				throw new functions.https.HttpsError('not-found', "Unable to find building in database: ", buildingUID);
			}
		})
		.then(data => {
			const landlords = data.landlords || null;
			if (landlords === null) {
				return data;
			}
			const promise = Promise.all(landlords.map(x => {
				return db.collection("users").doc(x).get()
					.then((docRef) => {
						if (docRef.exists) {
							const data = docRef.data();
							return data;
						}
						return {};
					})
			}));
			return promise
				.then((landlordProfiles) => {
					data.landlords = landlordProfiles;
					return data
				})
				.catch(error => {
					Sentry.captureException(error);
					throw new functions.https.HttpsError('internal', "Unable to extract landlords for building from database: ", buildingUID);
				})
		})
		.then(data => {
			const offices = data.offices || null;
			if (offices === null) {
				return data;
			}
			const promise = Promise.all(offices.map(x => {
				return db.collection("offices").doc(x).get()
					.then((docRef) => {
						if (docRef.exists) {
							const data = docRef.data();
							return data;
						}
						return {};
					})
			}));
			return promise
				.then((officeProfiles) => {
					data.offices = officeProfiles;
					return data;
				})
				.catch(error => {
					Sentry.captureException(error);
					throw new functions.https.HttpsError('internal', "Unable to extract offices for building from database: ", buildingUID);
				})
		})
		.catch(error => {
			Sentry.captureException(error);
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

	const firestoreUpdate = db.collection("buildings").doc(uid).update(dict);
	return Promise.all([firestoreUpdate])
		.then(res => {
			console.log("Successfully updated bio info for building: ", uid);
			return
		})
		.catch(error => {
			Sentry.captureException(error);
			throw new functions.https.HttpsError('internal', "There was an issue updating building profile bio info: ", uid);
		})

});

exports.getAllCompanies = functions.https.onCall((data, context) => {
	return db.collection('companies').get()
		.then((snapshot) => {
			const docs = snapshot.docs.map(x => x.data());
			console.log("Successfully got all companies: ", docs);
			return { "companies": docs }
		})
		.catch((error) => {
			Sentry.captureException(error);
			throw new functions.https.HttpsError("internal", "Unable to get all companies: ", error);
		})
});

exports.createCompany = functions.https.onCall((data, context) => {
	const name = data.name || null;
	if (name === null) {
		throw new functions.https.HttpsError("invalid-arguments", "Need to provide a company name.");
	}

	return db.collection('companies').add({ name: name })
		.then(docRef => {
			const id = docRef.id
			return db.collection('companies').doc(id).update({
				uid: id
			})
				.then((docRef) => {
					console.log("Successfully created new company", id)
					return
				})
				.catch((error) => {
					console.log("Error adding new company id to database: ", error);
					throw new functions.https.HttpsError("internal", "Error adding new company ID into database.")
				})
		})
		.catch(error => {
			Sentry.captureException(error);
			throw new functions.https.HttpsError('internal', 'Unable to create new company in database.')
		})
});

exports.getCompanyProfile = functions.https.onCall((data, context) => {
	const companyUID = data.companyUID || null;

	if (companyUID === null) {
		throw new functions.https.HttpsError('invalid-arguments', 'Must provide company uid.')
	}
	return db.collection("companies").doc(companyUID).get()
		.then(docRef => {
			if (docRef.exists) {
				return docRef.data()
			} else {
				throw new functions.https.HttpsError('not-found', 'Could not find company with uid: ', companyUID);
			}
		})
		.then(data => {
			const employees = data.employees || null;
			const promises = Promise.all(employees.map(x => {
				return db.collection('users').doc(x).get()
					.then(docRef => {
						return docRef.data();
					})
					.catch(error => {
						Sentry.captureException(error);
						throw error;
					})
			}
			));
			return promises
				.then(employeeProfiles => {
					data.employees = employeeProfiles;
					return data;
				})
		})
		.then(data => {
			const offices = data.offices || null;
			const promises = Promise.all(offices.map(x => {
				return db.collection('offices').doc(x).get()
					.then(docRef => {
						return docRef.data();
					})
					.catch(error => {
						Sentry.captureException(error);
						throw error;
					})
			}
			));
			return promises
				.then(officeProfiles => {
					data.offices = officeProfiles;
					return data;
				})
		})
		.catch(error => {
			Sentry.captureException(error);
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
		.catch(error => {
			Sentry.captureException(error);
			throw new functions.https.HttpsError('internal', "There was an issue updating company profile bio info: ", companyUID);
		})

});

exports.getAllOffices = functions.https.onCall((data, context) => {
	return db.collection('offices').get()
		.then(snapshot => {
			const docs = snapshot.docs.map(x => x.data());
			console.log("Successfully got all offices: ", docs);
			return docs;
		})
		.then(docs => {
			if (docs.length === 0) {
				return docs;
			}
			const promises = Promise.all(docs.map(x => {
				const buildingUID = x.buildingUID || null;
				if (buildingUID === null) {
					throw new functions.https.HttpsError("not-found", "Unable to find office's buildingUID for office: ", x.uid);
				}
				return db.collection('buildings').doc(buildingUID).get()
					.then(docRef => {
						if (docRef.exists) {
							const data = docRef.data()
							x.buildingName = data.name;
							return x;
						} else {
							throw new functions.https.HttpsError("not-found", "Unable to find office's building with id: ", x.buildingUID);
						}
					})
			}));

			return promises
				.then(offices => {
					return { "offices": offices };
				})
				.catch(error => {
					Sentry.captureException(error);
					throw new functions.https.HttpsError("internal", "Unable to get all offices: ", error);
				})
		})
		.catch(error => {
			Sentry.captureException(error);
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
		throw new functions.https.HttpsError('invalid-arguments', 'Must provide a building uid for office.');
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
				.then((docRef) => {
					console.log("Successfully created office: ", docRef.id);
					return id
				})
				.catch((error) => {
					Sentry.captureException(error);
					throw new functions.https.HttpsError("internal", "Unable to create office: ", error);
				})
		})
		.then((officeUID) => {
			console.log('Successfully added office under building.');
			return db.collection('buildings').doc(buildingUID).update({ 'offices': admin.firestore.FieldValue.arrayUnion(officeUID) });
		})
		.catch((error) => {
			Sentry.captureException(error);
			throw new functions.https.HttpsError("internal", "Unable to create office: ", error);
		})
})

exports.getOfficeProfile = functions.https.onCall((data, context) => {
	const officeUID = data.officeUID || null;
	if (officeUID === null) {
		throw new functions.https.HttpsError('invalid-arguments', 'Must provide office uid.')
	}
	return db.collection("offices").doc(officeUID).get()
		.then(docRef => {
			if (docRef.exists) {
				return docRef.data()
			} else {
				throw new functions.https.HttpsError('not-found', 'Could not find office with uid: ', officeUID);
			}
		})
		.then(docData => {
			const buildingUID = docData.buildingUID || null;
			if (buildingUID === null) {
				throw new functions.https.HttpsError('internal', 'Could not get buildingUID for office from database.', officeUID);
			}
			return db.collection('buildings').doc(buildingUID).get()
				.then(docRef => {
					if (docRef.exists) {
						const data = docRef.data();
						docData.building = docRef.data();
					}
					return docData;
				})
		})
		.then(docData => {
			const companyUID = docData.companyUID || null;
			if (companyUID === null) {
				return docData;
			}
			return db.collection('companies').doc(companyUID).get()
				.then(docRef => {
					if (docRef.exists) {
						const data = docRef.data();
						docData.company = docRef.data();
					}
					return docData;
				})
		})
		.then(docData => {
			const employees = docData.employees || null;
			if (employees === null) {
				return docData;
			}

			const promises = Promise.all(employees.map(x => {
				return db.collection('users').doc(x).get()
					.then(docRef => {
						if (docRef.exists) {
							return docRef.data();
						} else {
							throw new functions.https.HttpsError('not-found', 'Employee not found in database.');
						}
					})
					.catch(error => {
						console.error(error);
						throw error;
					})
			}));

			return promises
				.then(employeeProfiles => {
					docData.employees = employeeProfiles;
					return docData;
				})
				.catch(error => {
					Sentry.captureException(error);
					throw error;
				})
		})
		.catch(error => {
			Sentry.captureException(error);
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
		.then(docRef => {
			if (docRef.exists) {
				const data = docRef.data()
				const currCompanyUID = data.companyUID || null;
				if (currCompanyUID !== null) {
					if (currCompanyUID !== companyUID) {
						throw new functions.https.HttpsError('failed-precondition', 'The office is currently assigned to a different company.');
					}
				}

				const dbop1 = db.collection('offices').doc(officeUID).update({ 'companyUID': companyUID })
					.then(docRef => {
						console.log("Successfully added company to office.");
						return
					})
					.catch(error => {
						console.log("Error setting company for office.");
						throw new functions.https.HttpsError("internal", "Unable to add company to office in database: ", error);
					})

				const dbop2 = db.collection('companies').doc(companyUID).update({ "offices": admin.firestore.FieldValue.arrayUnion(officeUID) })
					.then(docRef => {
						console.log("Successfully added office to company.");
						return
					})
					.catch(error => {
						Sentry.captureException(error);
						throw new functions.https.HttpsError("internal", "Unable to add office to company in database: ", error);
					})

				return Promise.all([dbop1, dbop2]);
			} else {
				throw new functions.https.HttpsError('not-found', "Can't find office with uid: ", officeUID);
			}
		})
		.catch(error => {
			Sentry.captureException(error);
			throw new functions.https.HttpsError('not-found', "Can't find office with uid: ", officeUID);
		})

});

// exports.addUserToOffice = functions.https.onCall((data, context) => {
// 	const officeUID = data.officeUID || null;
// 	const userUID = data.userUID || null;

// 	if (officeUID === null || userUID === null) {
// 		throw new functions.https.HttpsError('invalid-arguments', "Need to provide a officeUID and userUID.");
// 	}

// 	return db.collection("offices").doc(officeUID).get()
// 	.then( docRef => {
// 		if (docRef.exists) {
// 			const data = docRef.data();
// 			const officeCompanyUID = data.companyUID;
// 			return officeCompanyUID;
// 		} else {
// 			throw new functions.https.HttpsError('not-found', "Unable to find companyUID for office: ", officeUID);
// 		}
// 	})
// 	.then ( officeCompanyUID => {
// 		return db.collection('users').doc(userUID).get()
// 		.then( docRef => {
// 			if (docRef.exists) {
// 				const data = docRef.data()
// 				const userCompanies = data.companies || null;
// 				if (userCompanies !== null) {
// 					if (userCompanies.indexOf(officeCompanyUID) > -1) {
// 						return
// 					} else {
// 						throw new functions.https.HttpsError('permission-denied', "User is not part of the same company as office.", officeCompanyUID);
// 					}
// 				} else {
// 					throw new functions.https.HttpsError('permission-denied', "User is not part of the same company as office.", officeCompanyUID);
// 				}
// 			} else {
// 				throw new functions.https.HttpsError('not-found', "Unable to find companyUID for user: ", userUID);
// 			}
// 		})
// 		.catch( error => {
// 			console.error(error);
// 			throw error;
// 		})
// 	})
// 	.then( () => {
// 		const dbop1 = db.collection('users').doc(userUID).update({'offices': admin.firestore.FieldValue.arrayUnion(officeUID)})

// 		const dbop2 = db.collection('offices').doc(officeUID).update({'employees': admin.firestore.FieldValue.arrayUnion(userUID)})

// 		return Promise.all([dbop1, dbop2])
// 		.then (docRefs => {
// 			console.log("Successfully added user to office.");
// 			return
// 		})
// 		.catch( error => {
// 			console.error(error);
// 			throw new functions.https.HttpsError('internal', 'There was an issue updating the database.');
// 		})
// 	})
// 	.catch( error => {
// 		console.error(error);
// 		throw error;
// 	})
// });

exports.addUserToCompany = functions.https.onCall((data, context) => {
	const companyUID = data.companyUID || null;
	const userUID = data.userUID || null;

	if (companyUID === null || userUID === null) {
		throw new functions.https.HttpsError('invalid-arguments', "Need to provide a companyUID and userUID.");
	}

	const dbop1 = db.collection('users').doc(userUID).update({ 'companies': admin.firestore.FieldValue.arrayUnion(companyUID) })

	const dbop2 = db.collection('companies').doc(companyUID).update({ 'employees': admin.firestore.FieldValue.arrayUnion(userUID) })

	return Promise.all([dbop1, dbop2])
		.then(docRefs => {
			console.log("Successfully added user to company.");
			return
		})
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		})
});

exports.setOfficeBuilding = functions.https.onCall((data, context) => {
	const officeUID = data.officeUID || null;
	const buildingUID = data.buildingUID || null;

	if (buildingUID === null || officeUID === null) {
		throw new functions.https.HttpsError('invalid-arguments', "Need to provide a officeUID and buildingUID.");
	}

	return db.collection('offices').doc(officeUID).get()
		.then((docRef) => {

			if (docRef.exists) {
				const data = docRef.data()
				const oldBuildingUID = data.buildingUID || null;
				const promises = [];
				const dbop1 = db.collection('offices').doc(officeUID).update({ 'buildingUID': buildingUID })
				promises.push(dbop1);

				if (oldBuildingUID !== null) {
					const dbop2 = db.collection('buildings').doc(oldBuildingUID).update({ 'offices': admin.firestore.FieldValue.arrayRemove(officeUID) })
					promises.push(dbop2);
				}
				const dbop3 = db.collection('buildings').doc(buildingUID).update({ 'offices': admin.firestore.FieldValue.arrayUnion(officeUID) })
				promises.push(dbop3);

				return Promise.all(promises)
					.then(docRefs => {
						console.log("Successfully added user to company.");
						return
					})
					.catch(error => {
						Sentry.captureException(error);
						throw error;
					})
			} else {
				throw new functions.https.HttpsError('not-found', 'Unable to find office in database');
			}
		})
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		})
});

exports.getCurrentUsersOffices = functions.https.onCall((data, context) => {
	const uid = context.auth.uid || null;
	if (uid === null) {
		throw new functions.https.HttpsError('invalid-arguments', 'Unable to find user uid. User must be signed in.');
	}
	return db.collection('users').doc(uid).get()
		.then(docRef => {
			if (docRef.exists) {
				const data = docRef.data();
				return data.offices;
			} else {
				throw new functions.https.HttpsError('not-found', 'Unable to find user in database.');
			}
		})
		.then(userOffices => {
			if (userOffices === null) {
				return {};
			}

			const promises = userOffices.map(x => {
				return db.collection('offices').doc(x).get()
					.then(docRef => {
						if (docRef.exists) {
							return docRef.data();
						} else {
							throw new functions.https.HttpsError('not-found', 'Unable to find office.');
						}
					})
					.catch(error => {
						Sentry.captureException(error);
						throw error;
					})
			})

			return Promise.all(promises)
				.then(officeProfiles => {
					return officeProfiles;
				})
				.catch(error => {
					Sentry.captureException(error);
					throw error;
				})
		})
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
						Sentry.captureException(error);
						throw error;
					})
			})

			return Promise.all(promises)
				.then(newOfficeData => {
					return newOfficeData;
				})
				.catch(error => {
					Sentry.captureException(error);
					throw error;
				})
		})
		.catch(error => {
			Sentry.captureException(error);
			throw error;
		})
});

exports.getStartedForm = functions.https.onCall((data, context) => {

	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');
	const newServicesArray = data.newServices || null;
	let newServices = "";
	if (newServicesArray !== null) {
		newServices = newServicesArray.join(', ');
	}

	let values = {
		'Company Name': data.companyName || null,
		'First Name': data.firstName || null,
		'Last Name': data.lastName || null,
		'Role in Company': data.companyRole || null,
		'Email': data.email || null,
		'Phone': data.phone || null,
		'New Services': newServices || null,
		'Company URL': data.companyURL || null,
		'Street Address - 1': data.streetAddr1 || null,
		'Street Address - 2': data.streetAddr2 || null,
		'City': data.city || null,
		'State': data.stateAddr || null,
		'Zip Code': data.zipCode || null,
		'Floor No.': data.floorNo || null,
		'Suite No.': data.suiteNo || null,
		'Square Feet': data.squareFT || null,
		'No. of Employees': data.employeeNo || null,
		'Move-in Date': data.moveDate || null,
		'Building Contact Name': data.buildingContName || null,
		'Building Contact Role': data.buildingContRole || null,
		'Building Contact Email': data.buildingContEmail || null,
		'Building Contact Phone': data.buildingContPhone || null
	}
	console.log(values);

	base('Get Started Form').create(values, (err, record) => {
		if (err) {
			console.log(err);
			throw err;
		}
		console.log('Success: ' + record.getId());
		return
	});

});

exports.getStartedFormNew = functions.https.onCall((data, context) => {

	var base = new Airtable({ apiKey: 'keyz3xvywRem7PtDO' }).base('app3AbmyNz7f8Mkb4');

	const newServicesArray = data.newServices || null;
	const officeName = (data.companyName || null) + " - " + (data.streetAddr1 || null);

	let newServices = "";
	if (newServicesArray !== null) {
		newServices = newServicesArray.join(', ');
	}

	let newUserUID = null;
	let newOfficeUID = null;
	let stripeID = null;
	let newCompanyUID = null;
	let newBuildingUID = null;

	let getStartedATID = null;
	let officeProfileATID = null;
	let servicePlanATID = null;

	const createUser = () => {
		let dict = {
			firstName: data.firstName || null,
			lastName: data.lastName || null,
			email: data.email || null,
			type: "regular",
			password: data.password || null
		}
		return helperFunctions.createUser(dict, context, db, admin)
			.then((uid) => {
				newUserUID = uid;
				return
			})
	}

	const insertOfficeUID = () => {
		if (newOfficeUID === null) {
			return
		}
		return db.collection('offices').doc(newOfficeUID).update({ uid: newOfficeUID });
	}

	const createStripeCustomer = () => {
		return stripe.customers.create({
			description: "For company: " + (data.companyName || null) + ", For office: " + (newOfficeUID),
			email: (data.email || null),
			metadata: {
				officeUID: newOfficeUID
			}
		}, (err, customer) => {
			if (err) {
				Sentry.captureException(err);
				return null
			}
			const stripeIdentifier = customer.id;
			stripeID = stripeIdentifier;
			return stripeIdentifier;
		});
	}

	const createOffice = () => {
		const dict = {
			capacity: data.employeeNo || null,
			employees: admin.firestore.FieldValue.arrayUnion(newUserUID),
			floor: data.floorNo || null,
			name: officeName,
			officeAdmin: admin.firestore.FieldValue.arrayUnion(newUserUID),
			roomNo: data.suiteNo || null,
		}

		return db.collection('offices').add(dict)
			.then((docRef) => {
				const uid = docRef.id;
				newOfficeUID = uid;
				if (newOfficeUID === null) {
					throw Error("There was an issue storing the newOfficeUID");
				}
				return uid
			})
			.then(() => insertOfficeUID())
	}

	const insertCompanyUID = () => {
		if (newCompanyUID === null) {
			return
		}
		return db.collection('companies').doc(newCompanyUID).update({ uid: newCompanyUID });
	}

	const createCompany = () => {
		const dict = {
			employees: admin.firestore.FieldValue.arrayUnion(newUserUID),
			name: data.companyName || null,
			offices: admin.firestore.FieldValue.arrayUnion(newOfficeUID),
		}

		return db.collection('companies').add(dict)
			.then((docRef) => {
				const uid = docRef.id;
				newCompanyUID = uid;
				if (newCompanyUID === null) {
					throw Error("There was an issue storing the newCompanyUID");
				}
				return uid
			})
			.then(() => insertCompanyUID());
	}

	const insertBuildingUID = () => {
		if (newBuildingUID === null) {
			return
		}
		return db.collection('buildings').doc(newBuildingUID).update({ uid: newBuildingUID });
	}

	const createBuilding = () => {

		let address = "";
		address += (data.streetAddr1 || null);
		address += (data.streetAddr2 !== null ? " " + data.streetAddr2 : "");
		address += " " + (data.city || null);
		address += ", " + (data.stateAddr || null);
		address += " " + (data.zipCode || null);

		const dict = {
			address: address,
			name: data.streetAddr1 || null,
			offices: admin.firestore.FieldValue.arrayUnion(newOfficeUID),
		}

		return db.collection('buildings').add(dict)
			.then((docRef) => {
				const uid = docRef.id;
				newBuildingUID = uid;
				if (newBuildingUID === null) {
					throw Error("There was an issue storing the newBuildingUID");
				}
				return uid;
			})
			.then(() => insertBuildingUID());
	}

	const updateUserInfo = () => {
		let dict = {
			offices: admin.firestore.FieldValue.arrayUnion(newOfficeUID),
			officeAdmin: admin.firestore.FieldValue.arrayUnion(newOfficeUID),
			companies: admin.firestore.FieldValue.arrayUnion(newCompanyUID)
		}
		if (newUserUID === null) {
			throw Error("Could not update user info. newUserUID is null.");
		}
		return db.collection('users').doc(newUserUID).update(dict);
	}

	const updateOfficeInfo = () => {
		if (newOfficeUID === null) {
			throw Error("Could not update office info. newOfficeUID is null.");
		}
		return db.collection('offices').doc(newOfficeUID).update({ stripeID: stripeID, buildingUID: newBuildingUID, companyUID: newCompanyUID });
	}

	const submitForm = (resolve, reject) => {

		let submitValues = {
			'Company Name': data.companyName || null,
			'First Name': data.firstName || null,
			'Last Name': data.lastName || null,
			'Role in Company': data.companyRole || null,
			'Email': data.email || null,
			'Phone': data.phone || null,
			'New Services': newServices || null,
			'Other Services and Details': data.otherServicesDetails || null,
			'Company URL': data.companyURL || null,
			'Street Address - 1': data.streetAddr1 || null,
			'Street Address - 2': data.streetAddr2 || null,
			'City': data.city || null,
			'State': data.stateAddr || null,
			'Zip Code': data.zipCode || null,
			'Floor No.': data.floorNo || null,
			'Suite No.': data.suiteNo || null,
			'Square Feet': data.squareFT || null,
			'No. of Employees': data.employeeNo || null,
			'Move-in Date': data.moveDate || null
			// 'Building Contact Name': data.buildingContName || null,
			// 'Building Contact Role': data.buildingContRole || null,
			// 'Building Contact Email': data.buildingContEmail || null,
			// 'Building Contact Phone': data.buildingContPhone || null
		}

		return base('Get Started Form').create(submitValues, (err, record) => {
			if (err) {
				reject(err);
				Sentry.captureException(err);
				return
			}
			const recordID = record.getId();
			getStartedATID = recordID;
			resolve()
		})
	};

	const createServicePlan = (resolve, reject) => {
		if (newOfficeUID === null) {
			let error = Error("Unable to create service plan. newOfficeUID is null.");
			reject(error);
			return
		}

		let values = {
			'Office Name': officeName,
			'Office': [officeProfileATID],
			'Company Name': data.companyName || null,
			'Status': "Pending"
		}

		return base('Service Plans').create(values, { typecast: true }, (err, record) => {
			if (err) {
				Sentry.captureException(err);
				reject(err);
				return
			}
			const recordID = record.getId();
			servicePlanATID = recordID;
			resolve()
		});
	};

	const createOfficeProfile = (resolve, reject) => {
		const profileValues = {
			'Office Name': officeName,
			'Office UID': newOfficeUID,
			'Company Name': data.companyName || null,
			'Street Address - 1': data.streetAddr1 || null,
			'Street Address - 2': data.streetAddr2 || null,
			'City': data.city || null,
			'State': data.stateAddr || null,
			'Zip Code': data.zipCode || null,
			'Floor No.': data.floorNo || null,
			'Suite No.': data.suiteNo || null,
			'Square Feet': data.squareFT || null,
			'No. of Employees': data.employeeNo || null,
			'Move-in Date': data.moveDate || null
		};

		return base('Office Profile').create(profileValues, { typecast: true }, (err, record) => {
			if (err) {
				Sentry.captureException(err);
				reject(err);
				return
			}
			let recordID = record.getId();
			officeProfileATID = recordID;
			resolve();
		});
	}

	const storeATID = () => {
		if (newOfficeUID === null) {
			throw Error("newOfficeUID is null. Can not store airtable IDs in database under office object.");
		}
		return db.collection('offices').doc(newOfficeUID).update({
			getStartedATID: getStartedATID,
			officeProfileATID: officeProfileATID,
			servicePlanATID: servicePlanATID
		});
	}

	return createUser()
		.then(() => new Promise((resolve, reject) => submitForm(resolve, reject)))
		.then(() => createUser())
		.then(() => createOffice())
		.then(() => createStripeCustomer())
		.then(() => createCompany())
		.then(() => createBuilding())
		.then(() => updateUserInfo())
		.then(() => updateOfficeInfo())
		.then(() => new Promise((resolve, reject) => createOfficeProfile(resolve, reject)))
		.then(() => new Promise((resolve, reject) => createServicePlan(resolve, reject)))
		.then(() => storeATID())
		.catch(err => {
			Sentry.captureException(err);
			throw err;
		});
});

exports.checkValidEmail = functions.https.onCall((data, context) => {
	const emailAdd = data.email || null;

	if (emailAdd === null) {
		return { valid: false };
	}

	return admin.auth().getUserByEmail(emailAdd)
		.then((userRecord) => {
			const userUID = userRecord.uid || null;
			if (userUID === null) {
				// This will go to the catch clause below and create user 
				return { valid: true }
			} else {
				return { valid: false }
			}
		})
		.catch(error => {
			if (error.code === 'auth/user-not-found') {
				return { valid: true }
			}
			return { valid: false }
		})
})


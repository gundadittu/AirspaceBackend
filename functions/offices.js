const functions = require('firebase-functions');

exports.getEmployeesForOffice = function(data, context, db) {
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
}

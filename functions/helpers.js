const functions = require('firebase-functions');

exports.getExpandedOfficeData = function(officeUIDs, db) {
			const officePromises = officeUIDs.map( y => {
				return db.collection('offices').doc(y).get()
				.then( docRef => {
					if (docRef.exists) {
						return docRef.data();
					} else {
						return {"officeUID": y};
					}
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

exports.getUserData = function(userUIDs, db) {
	if ((userUIDs === null) || (userUIDs.length === 0)) {
		return
	}
	console.log(userUIDs);
	var promises = userUIDs.map(x => {
		return db.collection('users').doc(x).get()
		.then( docRef => {
			if (docRef.exists) {
				return docRef.data()
			} else {
				return {'uid':x }
			}
		})
	})

	return Promise.all(promises)
	.then( usersData => {
		return usersData
	})
	.catch( error => {
		console.error(error);
		throw new functions.https.HttpsError(error);
	})
}

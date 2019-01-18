const functions = require('firebase-functions');

exports.getAllUsersForOffice = function(data, context, db) { 
    const officeUID = data.officeUID || null;
    const userUID = context.auth.uid || null;
    
    if ((officeUID === null) || (userUID === null)) { 
        throw new functions.https.HttpsError('invalid-argument','Need to provide officeUID and be logged in.');
    }

   return db.collection('offices').doc(officeUID).get()
    .then( docRef => { 
        if (docRef.exists) { 
            const data = docRef.data()
            const officeAdmin = data.officeAdmin || null; 
            // check that current user has permission to be admin for office
            if (officeAdmin.includes(userUID) === false) { 
                throw new functions.https.HttpsError('permission-denied','User is not a admin for this office.');
            }
            const employees = data.employees || []; 
            return employees
        } else { 
            throw new functions.https.HttpsError('not-found','Unable to find office.'); 
        }
    })
    .catch( error => { 
        console.error(error); 
        throw error;
    })
}
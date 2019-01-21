const functions = require('firebase-functions');
const helperFunctions = require('./helpers');

exports.removeUserFromOffice = function(data, context, db, admin) { 
    const selectedUserUID = data.selectedUserUID || null;
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const userUID = context.auth.uid || null;

    if ((selectedUserUID === null) || (selectedOfficeUID === null)) { 
        throw new functions.https.HttpsError('invalid-arguments','Must provide selectedUserUID and selectedOfficeUID.');
    }
    if (userUID === null) { 
        throw new functions.https.HttpsError('permission-denied', 'User must be logged in.');
    }

    return db.collection('users').doc(userUID).get()
    .then( docRef => { 
        const data = docRef.data(); 
        const officeAdmin = data.officeAdmin || null;
        if (officeAdmin.includes(selectedOfficeUID) === false) {
            throw new functions.https.HttpsError('permission-denied', 'User does not have permission to manage this office.');
        }
        return 
    })
    .then(() => { 
        const firstDict = { 
            'offices': admin.firestore.FieldValue.arrayRemove(selectedOfficeUID), 
            'officeAdmin': admin.firestore.FieldValue.arrayRemove(selectedOfficeUID)
        };
        const firstOp = db.collection('users').doc(userUID).update(firstDict);
    
        const secondDict = {
             'employees': admin.firestore.FieldValue.arrayRemove(selectedUserUID),
             'officeAdmin': admin.firestore.FieldValue.arrayRemove(selectedUserUID)
        };
        const secondOp = db.collection('offices').doc(selectedOfficeUID).update(secondDict);
    
        return Promise.all([firstOp, secondOp])
        .catch(error => { 
            console.error(error);
            throw error;
        })
    })
}

exports.addUserToOffice = function(data, context, db, admin) { 
    const userUID = context.auth.uid || null;
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const makeUserOfficeAdmin = data.makeUserOfficeAdmin || false;
    // Must also provide the below arguments
    //// const firstName = data.firstName || null;
	//// const lastName = data.lastName || null;
	//// const emailAdd = data.email;
	//// const userType = data.type;
    //// const pwrd = data.password || "Airspaceoffice2019";


    if (userUID === null) { 
        throw new functions.https.HttpsError('permission-denied', 'User must be logged in.');
    }
    if (selectedOfficeUID === null) { 
        throw new functions.https.HttpsError('invalid-arguments', 'Must provide an office to add user to.');
    }

    let selectedCompanyUID = null;
    return db.collection('offices').doc(selectedOfficeUID).get()
    .then( docRef => { 
        if (docRef.exists) { 
            const data = docRef.data();
            const officeAdmin = data.officeAdmin || null;
            selectedCompanyUID = data.companyUID || null;

            if (selectedCompanyUID === null) { 
                throw new functions.https.HttpsError('permission-denied', 'This office does not belong to a company.');
            }
            
            // CHECKs whether CURRENT USER IS AN ADMIN FOR SELECTED OFFICE 
            if (officeAdmin.includes(userUID) === false) { 
                throw new functions.https.HttpsError('permission-denied', 'User does not have permission to add uses for this office.');
            }
            return 
        } else { 
            throw new functions.https.HttpsError('not-found', 'Unable to find selected office.');
        }
    })
    .then(() => { 
        const newData = data; 
        newData.userType = 'regular';
        return helperFunctions.createUser(newData, context, db, admin);
    })
    .then( (newUserUID) => { 
        if (selectedCompanyUID === null) { 
            throw new functions.https.HttpsError('permission-denied', 'This office does not belong to a company.');
        }

        // add user to company, add company to user 
        const firstOpDict = {'companies': admin.firestore.FieldValue.arrayUnion(selectedCompanyUID)};
        const firstOp = db.collection('users').doc(newUserUID).update(firstOpDict);
        
        const secOpDict = {'employees': admin.firestore.FieldValue.arrayUnion(newUserUID)};
        const secOp = db.collection('companies').doc(selectedCompanyUID).update(secOpDict);
    
        return Promise.all([firstOp, secOp]); 
    })
    .then( (newUserUID) => { 
        if (makeUserOfficeAdmin === true) { 
           // also adds these users as office admins on both ends 
           const firstOpDict = {'offices': admin.firestore.FieldValue.arrayUnion(selectedOfficeUID), 'officeAdmin': admin.firestore.FieldValue.arrayUnion(selectedOfficeUID)};
           const firstOp = db.collection('users').doc(newUserUID).update(firstOpDict);
           const secOpDict = {'employees': admin.firestore.FieldValue.arrayUnion(newUserUID), 'officeAdmin': admin.firestore.FieldValue.arrayUnion(newUserUID)};
           const secOp = db.collection('offices').doc(selectedOfficeUID).update(secOpDict);
   
           return Promise.all([firstOp, secOp]);
        } else { 
            const firstOpDict = {'offices': admin.firestore.FieldValue.arrayUnion(selectedOfficeUID)};
            const firstOp = db.collection('users').doc(newUserUID).update(firstOpDict);
            const secOpDict = {'employees': admin.firestore.FieldValue.arrayUnion(newUserUID)};
            const secOp = db.collection('offices').doc(selectedOfficeUID).update(secOpDict);
    
            return Promise.all([firstOp, secOp]); 
        }
    })
    .catch(error => { 
        console.error(error);
        throw error;
    })
}

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
    .then( employees => { 
        return helperFunctions.getUserData(employees, db);
    })
    .catch( error => { 
        console.error(error); 
        throw error;
    })
}
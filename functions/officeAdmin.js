const functions = require('firebase-functions');
const helperFunctions = require('./helpers');
const storageFunctions = require('./storage');

exports.removeUserFromOffice = function (data, context, db, admin) {
    const selectedUserUID = data.selectedUserUID || null;
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const userUID = context.auth.uid || null;

    if ((selectedUserUID === null) || (selectedOfficeUID === null)) {
        throw new functions.https.HttpsError('invalid-arguments', 'Must provide selectedUserUID and selectedOfficeUID.');
    }
    if (userUID === null) {
        throw new functions.https.HttpsError('permission-denied', 'User must be logged in.');
    }

    return db.collection('users').doc(userUID).get()
        .then(docRef => {
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
            const firstOp = db.collection('users').doc(selectedUserUID).update(firstDict);

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

exports.addUserToOffice = function (data, context, db, admin) {
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
        .then(docRef => {
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
        .then((newUserUID) => {
            if (selectedCompanyUID === null) {
                throw new functions.https.HttpsError('permission-denied', 'This office does not belong to a company.');
            }

            // add user to company, add company to user 
            const firstOpDict = { 'companies': admin.firestore.FieldValue.arrayUnion(selectedCompanyUID) };
            const firstOp = db.collection('users').doc(newUserUID).update(firstOpDict);

            const secOpDict = { 'employees': admin.firestore.FieldValue.arrayUnion(newUserUID) };
            const secOp = db.collection('companies').doc(selectedCompanyUID).update(secOpDict);

            return Promise.all([firstOp, secOp])
                .then(() => {
                    return newUserUID;
                })
        })
        .then((newUserUID) => {
            if (makeUserOfficeAdmin === true) {
                // also adds these users as office admins on both ends 
                const firstOpDict = { 'offices': admin.firestore.FieldValue.arrayUnion(selectedOfficeUID), 'officeAdmin': admin.firestore.FieldValue.arrayUnion(selectedOfficeUID) };
                const firstOp = db.collection('users').doc(newUserUID).update(firstOpDict);
                const secOpDict = { 'employees': admin.firestore.FieldValue.arrayUnion(newUserUID), 'officeAdmin': admin.firestore.FieldValue.arrayUnion(newUserUID) };
                const secOp = db.collection('offices').doc(selectedOfficeUID).update(secOpDict);

                return Promise.all([firstOp, secOp]);
            } else {
                const firstOpDict = { 'offices': admin.firestore.FieldValue.arrayUnion(selectedOfficeUID) };
                const firstOp = db.collection('users').doc(newUserUID).update(firstOpDict);
                const secOpDict = { 'employees': admin.firestore.FieldValue.arrayUnion(newUserUID) };
                const secOp = db.collection('offices').doc(selectedOfficeUID).update(secOpDict);

                return Promise.all([firstOp, secOp]);
            }
        })
        .catch(error => {
            console.error(error);
            throw error;
        })
}

exports.getAllUsersForOffice = function (data, context, db) {
    const officeUID = data.officeUID || null;
    const userUID = context.auth.uid || null;

    if ((officeUID === null) || (userUID === null)) {
        throw new functions.https.HttpsError('invalid-argument', 'Need to provide officeUID and be logged in.');
    }

    return db.collection('offices').doc(officeUID).get()
        .then(docRef => {
            if (docRef.exists) {
                const data = docRef.data()
                const officeAdmin = data.officeAdmin || null;
                // check that current user has permission to be admin for office
                if (officeAdmin.includes(userUID) === false) {
                    throw new functions.https.HttpsError('permission-denied', 'User is not a admin for this office.');
                }
                const employees = data.employees || [];
                return employees
            } else {
                throw new functions.https.HttpsError('not-found', 'Unable to find office.');
            }
        })
        .then(employees => {
            return helperFunctions.getUserData(employees, db);
        })
        .catch(error => {
            console.error(error);
            throw error;
        })
}

exports.editUserForOffice = function (data, context, db, admin) {
    const userUID = context.auth.uid || null;
    const selectedUserUID = data.selectedUserUID || null;
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const firstName = data.firstName || null;
    const lastName = data.lastName || null;
    const emailAddress = data.emailAddress || null;
    const makeUserOfficeAdmin = data.makeUserOfficeAdmin || null;

    if (userUID === null) {
        throw new functions.https.HttpsError('permission-denied', 'User must be signed in.');
    }
    if ((selectedUserUID === null) || (selectedOfficeUID === null)) {
        throw new functions.https.HttpsError('invalid-arguments', 'Must provide a selectedUserUID and selectedOfficeUID.');
    }

    return db.collection('offices').doc(selectedOfficeUID).get()
        .then(docRef => {
            if (docRef.exists) {
                const data = docRef.data();
                const employees = data.employees;
                const officeAdmin = data.officeAdmin;
                if (officeAdmin.includes(userUID) === false) {
                    throw new functions.https.HttpsError('permission-denied', 'User is not a office admin for this office.');
                }
                console.log(selectedUserUID);
                if (employees.includes(selectedUserUID) === false) {
                    throw new functions.https.HttpsError('permission-denied', 'Cannot edit info for a user not a part of the selected office.');
                }
                return
            } else {
                throw new functions.https.HttpsError('not-found', 'no office found with the selectedOfficeUID.');
            }
        })
        .then(() => {
            let updateDict = {};
            if (firstName !== null) {
                updateDict['firstName'] = firstName;
            }
            if (lastName !== null) {
                updateDict['lastName'] = lastName;
            }
            if (emailAddress !== null) {
                updateDict['email'] = emailAddress;

                // Need to check that a current user with the same email address does not already exist
                return admin.auth().getUserByEmail(emailAddress)
                    .then(function (userRecord) {
                        throw new functions.https.HttpsError('permission-denied', 'User already exists with this email address.');
                    })
                    .catch(function (error) {
                        // user with this email address does not exist already 
                        return db.collection('users').doc(selectedUserUID).update(updateDict)
                    });
            } else {
                return db.collection('users').doc(selectedUserUID).update(updateDict)
            }
        })
        .then(() => {
            if (makeUserOfficeAdmin === null) {
                return
            } else if (makeUserOfficeAdmin === true) {
                // also adds these users as office admins on both ends 
                const firstOpDict = { 'offices': admin.firestore.FieldValue.arrayUnion(selectedOfficeUID), 'officeAdmin': admin.firestore.FieldValue.arrayUnion(selectedOfficeUID) };
                const firstOp = db.collection('users').doc(selectedUserUID).update(firstOpDict);
                const secOpDict = { 'employees': admin.firestore.FieldValue.arrayUnion(selectedUserUID), 'officeAdmin': admin.firestore.FieldValue.arrayUnion(selectedUserUID) };
                const secOp = db.collection('offices').doc(selectedOfficeUID).update(secOpDict);

                return Promise.all([firstOp, secOp]);
            } else if (makeUserOfficeAdmin === true) {
                const firstOpDict = { 'offices': admin.firestore.FieldValue.arrayUnion(selectedOfficeUID), 'officeAdmin': admin.firestore.FieldValue.arrayRemove(selectedOfficeUID) };
                const firstOp = db.collection('users').doc(selectedUserUID).update(firstOpDict);
                const secOpDict = { 'employees': admin.firestore.FieldValue.arrayUnion(selectedUserUID), 'officeAdmin': admin.firestore.FieldValue.arrayRemove(selectedUserUID) };
                const secOp = db.collection('offices').doc(selectedOfficeUID).update(secOpDict);

                return Promise.all([firstOp, secOp]);
            } else {
                return
            }
        })
        .catch(error => {
            console.log(error);
            throw error;
        })
}

exports.getAllHotDesksForOffice = function (data, context, db) {
    const userUID = context.auth.uid || null;
    const selectedOfficeUID = data.selectedOfficeUID || null;

    if (userUID === null) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }
    if (selectedOfficeUID === null) {
        throw new functions.https.HttpsError('invalid-arguments', 'Must provide selectedOfficeUID.');
    }

    return db.collection('users').doc(userUID).get()
        .then(docRef => {
            if (docRef.exists) {
                const data = docRef.data();
                const officeAdmin = data.officeAdmin;
                if (officeAdmin.includes(selectedOfficeUID) === false) {
                    throw new functions.https.HttpsError('permission-denied', 'User is not a admin for this office.');
                }
                return
            } else {
                throw new functions.https.HttpsError('permission-denied', 'No such user found.');
            }
        })
        .then(() => {
            return db.collection('hotDesks').where('officeUIDs', 'array-contains', selectedOfficeUID).get()
                .then(docSnapshots => {
                    let hotDesks = [];
                    const docsData = docSnapshots.docs.map(x => x.data());
                    var deskPromises = docsData.map(x => {

                        return helperFunctions.getExpandedOfficeData(x.officeUIDs, db)
                            .then(officeData => {
                                x.offices = officeData;
                                hotDesks.push(x);
                                return
                            })
                            .catch(error => {
                                throw error;
                            })

                    })
                    return Promise.all(deskPromises)
                        .then(() => {
                            return hotDesks;
                        })
                })
                .then(hotDesks => {
                    let activeDesks = [];
                    let inactiveDesks = [];
                    hotDesks.forEach(x => {
                        if (x.active === true) {
                            activeDesks.push(x);
                        } else {
                            inactiveDesks.push(x);
                        }
                    })
                    return { 'active': activeDesks, 'inactive': inactiveDesks }
                })
        })
}

exports.getAllConferenceRoomsForOffice = function (data, context, db, admin) {
    const userUID = context.auth.uid || null;
    const selectedOfficeUID = data.selectedOfficeUID || null;

    if (userUID === null) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }
    if (selectedOfficeUID === null) {
        throw new functions.https.HttpsError('invalid-arguments', 'Must provide selectedOfficeUID.');
    }

    return db.collection('users').doc(userUID).get()
        .then(docRef => {
            if (docRef.exists) {
                const data = docRef.data();
                const officeAdmin = data.officeAdmin;
                if (officeAdmin.includes(selectedOfficeUID) === false) {
                    throw new functions.https.HttpsError('permission-denied', 'User is not a admin for this office.');
                }
                return
            } else {
                throw new functions.https.HttpsError('permission-denied', 'No such user found.');
            }
        })
        .then(() => {
            return db.collection('conferenceRooms').where('shared', '==', false).where('officeUID', 'array-contains', selectedOfficeUID).get()
                .then(docSnapshots => {
                    let conferenceRooms = [];
                    const docsData = docSnapshots.docs.map(x => x.data());
                    var roomPromises = docsData.map(x => {

                        return helperFunctions.getExpandedOfficeData(x.officeUID, db)
                            .then(officeData => {
                                x.offices = officeData;
                                conferenceRooms.push(x);
                                return
                            })
                            .catch(error => {
                                throw error;
                            })

                    })
                    return Promise.all(roomPromises)
                        .then(() => {
                            return conferenceRooms;
                        })
                })
                .then(conferenceRooms => {
                    const promises = conferenceRooms.map(x => {
                        return storageFunctions.getConferenceRoomImageURL(x.uid, admin)
                            .then(url => {
                                x.imageURL = url;
                                return x;
                            })
                            .catch(error => {
                                return x;
                            })
                    });

                    return Promise.all(promises);
                })
                .then(conferenceRooms => {
                    let activeRooms = [];
                    let inactiveRooms = [];
                    conferenceRooms.forEach(x => {
                        if (x.active === true) {
                            activeRooms.push(x);
                        } else {
                            inactiveRooms.push(x);
                        }
                    })
                    return { 'active': activeRooms, 'inactive': inactiveRooms }
                })
        })
        .catch(error => {
            console.error(error);
            throw error;
        })
}

function validateRoomAmenity(type) {
    const amenityTypes = ['whiteBoard', 'videoConferencing', 'screenSharing'];
    return amenityTypes.includes(type);
}

exports.addHotDeskForOfficeAdmin = function (data, context, db) {
    const userUID = context.auth.uid || null;
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const name = data.deskName || null;
    const reserveable = data.reserveable || true;
    const active = data.activeStatus || true;
    // let buildingUID = null;
    let address = null;

    if (userUID === null) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    if (selectedOfficeUID === null) {
        throw new functions.https.HttpsError('invalid-argument', 'Must provide selectedOfficeUID.');
    }

    return db.collection('users').doc(userUID).get()
        .then(docRef => {
            if (docRef.exists) {
                const data = docRef.data();
                const officeAdmin = data.officeAdmin;
                if (officeAdmin.includes(selectedOfficeUID) === false) {
                    throw new functions.https.HttpsError('permission-denied', 'User is not a admin for this office.');
                }
                return
            } else {
                throw new functions.https.HttpsError('permission-denied', 'No such user found.');
            }
        })
        .then(() => {
            return db.collection('offices').doc(selectedOfficeUID).get()
                .then(docRef => {
                    if (docRef.exists) {
                        const data = docRef.data();
                        const buildingUID = data.buildingUID;
                        if (buildingUID === null) {
                            throw new functions.https.HttpsError('not-found', 'The office with selectedOfficeUID does not belong to a building currently.');
                        }
                        return buildingUID;
                    } else {
                        throw new functions.https.HttpsError('not-found', 'No office exists with selectedOfficeUID.');
                    }
                })
        })
        .then((localBuildingUID) => {
            return db.collection('buildings').doc(localBuildingUID).get()
                .then(docRef => {
                    if (docRef.exists) {
                        const data = docRef.data();
                        // buildingUID = localBuildingUID;
                        address = data.address;
                        return
                    } else {
                        throw new functions.https.HttpsError('not-found', 'No office exists with selectedOfficeUID.');
                    }
                })
        })
        .then(() => {

            let dict = {};
            if (name !== null) {
                dict['name'] = name;
            }
         
            if (address !== null) {
                dict['address'] = address;
            }
            // if (buildingUID !== null) {
            //     dict['buildingUID'] = buildingUID;
            // }

            if (reserveable !== null) {
                dict['reserveable'] = reserveable;
            }
            if (active !== null) {
                dict['active'] = active;
            }

            if (selectedOfficeUID !== null) {
                dict['officeUIDs'] = [selectedOfficeUID];
            }


            return db.collection('hotDesks').add(dict)
                .then(docRef => {
                    const uid = docRef.id;
                    return uid;
                })
        })
        .then(uid => {
            return db.collection('hotDesks').doc(uid).update({ uid: uid })
                .then(() => {
                    return uid;
                })
        })
        .catch(error => {
            console.error(error);
            throw error;
        })

}

exports.addConferenceRoomForOfficeAdmin = function (data, context, db) {
    const userUID = context.auth.uid || null;
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const name = data.roomName || null;
    const amenitiesRaw = data.amenities || null; // [String]
    const reserveable = data.reserveable || true;
    const active = data.activeStatus || true;
    const shared = false;
    const capacity = data.capacity || null;
    let buildingUID = null;
    let address = null;

    // Need to deal with custom amenities 

    let amenities = (amenitiesRaw || []).filter(x => {
        return validateRoomAmenity(x);
    })

    if (userUID === null) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    if (selectedOfficeUID === null) {
        throw new functions.https.HttpsError('invalid-argument', 'Must provide selectedOfficeUID.');
    }

    return db.collection('users').doc(userUID).get()
        .then(docRef => {
            if (docRef.exists) {
                const data = docRef.data();
                const officeAdmin = data.officeAdmin;
                if (officeAdmin.includes(selectedOfficeUID) === false) {
                    throw new functions.https.HttpsError('permission-denied', 'User is not a admin for this office.');
                }
                return
            } else {
                throw new functions.https.HttpsError('permission-denied', 'No such user found.');
            }
        })
        .then(() => {
            return db.collection('offices').doc(selectedOfficeUID).get()
                .then(docRef => {
                    if (docRef.exists) {
                        const data = docRef.data();
                        const buildingUID = data.buildingUID;
                        if (buildingUID === null) {
                            throw new functions.https.HttpsError('not-found', 'The office with selectedOfficeUID does not belong to a building currently.');
                        }
                        return buildingUID;
                    } else {
                        throw new functions.https.HttpsError('not-found', 'No office exists with selectedOfficeUID.');
                    }
                })
        })
        .then((localBuildingUID) => {
            return db.collection('buildings').doc(localBuildingUID).get()
                .then(docRef => {
                    if (docRef.exists) {
                        const data = docRef.data();
                        buildingUID = localBuildingUID;
                        address = data.address;
                        return
                    } else {
                        throw new functions.https.HttpsError('not-found', 'No office exists with selectedOfficeUID.');
                    }
                })
        })
        .then(() => {

            let dict = {};
            if (name !== null) {
                dict['name'] = name;
            }
            if (address !== null) {
                dict['address'] = address;
            }
            if (buildingUID !== null) {
                dict['buildingUID'] = buildingUID;
            }
            if (amenities !== null) {
                dict['amenities'] = amenities;
            }
            if (reserveable !== null) {
                dict['reserveable'] = reserveable;
            }
            if (active !== null) {
                dict['active'] = active;
            }
            if (shared !== null) {
                dict['shared'] = shared;
            }
            if (selectedOfficeUID !== null) {
                dict['officeUID'] = [selectedOfficeUID];
            }
            if (capacity !== null) {
                dict['capacity'] = capacity;
            }

            return db.collection('conferenceRooms').add(dict)
                .then(docRef => {
                    const uid = docRef.id;
                    return uid;
                })
        })
        .then(uid => {
            return db.collection('conferenceRooms').doc(uid).update({ uid: uid })
                .then(() => {
                    return uid;
                })
        })
        .catch(error => {
            console.error(error);
            throw error;
        })
}

exports.editHotDeskForOfficeAdmin = function (data, context, db) {
    const userUID = context.auth.uid || null;
    const selectedDeskUID = data.selectedDeskUID || null;
    const deskName = data.deskName || null;
    const reserveable = data.reserveable || false;
    const active = (data.activeStatus === true) ? true : false;

    if (userUID === null) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    if (selectedDeskUID === null) {
        throw new functions.https.HttpsError('invalid-arguments', 'Must provide selectedDeskUID.');
    }

    return db.collection('hotDesks').doc(selectedDeskUID).get()
    .then(docRef => {
        if (docRef.exists) {
            const data = docRef.data();
            const officeUIDs = data.officeUIDs || null;
            if (officeUIDs === null) {
                throw new functions.https.HttpsError('not-found', 'No office associated with hot desk of selectedDeskUID.');
            }
            return officeUIDs;
        } else {
            throw new functions.https.HttpsError('not-found', 'No hot desk with selectedDeskUID found.');
        }
    })
    .then(officeUIDs => {
        return db.collection('users').doc(userUID).get()
            .then(docRef => {
                if (docRef.exists) {
                    const data = docRef.data();
                    const adminOfficeUIDs = data.officeAdmin || null;
                    if (adminOfficeUIDs === null) {
                        throw new functions.https.HttpsError('permission-denied', 'This user does not have permission to modify this office.');
                    }
                    let found = false;
                    officeUIDs.forEach(x => {
                        if (adminOfficeUIDs.includes(x) === true) {
                            found = true;
                        }
                    })

                    if (found === false) {
                        throw new functions.https.HttpsError('permission-denied', 'This user does not have permission to modify this office.');
                    }

                    return
                } else {
                    throw new functions.https.HttpsError('not-found', 'This user was not found in the database.');
                }
            })
    })
    .then(() => {
        let dict = {};

        if (deskName !== null) {
            dict['name'] = deskName;
        }
        if (reserveable !== null) {
            dict['reserveable'] = reserveable;
        }
        if (active !== null) {
            dict['active'] = active;
        }
        return db.collection('hotDesks').doc(selectedDeskUID).update(dict);
    })
}

exports.editConferenceRoomForOfficeAdmin = function (data, context, db) {
    const userUID = context.auth.uid || null;
    const selectedRoomUID = data.selectedRoomUID || null;
    const roomName = data.roomName || null;
    const capacity = data.capacity || null;
    const standardAmenities = data.standardAmenities || null;
    const reserveable = data.reserveable || false;
    const active = (data.activeStatus === true) ? true : false;

    // need to handle custom amenities 

    if (userUID === null) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    if (selectedRoomUID === null) {
        throw new functions.https.HttpsError('invalid-arguments', 'Must provide selectedRoomUID.');
    }

    return db.collection('conferenceRooms').doc(selectedRoomUID).get()
        .then(docRef => {
            if (docRef.exists) {
                const data = docRef.data();
                const officeUIDs = data.officeUID || null;
                if (officeUIDs === null) {
                    throw new functions.https.HttpsError('not-found', 'No office associated with conference room of selectedRoomUID.');
                }
                return officeUIDs;
            } else {
                throw new functions.https.HttpsError('not-found', 'No conference room with selectedRoomUID found.');
            }
        })
        .then(officeUIDs => {
            return db.collection('users').doc(userUID).get()
                .then(docRef => {
                    if (docRef.exists) {
                        const data = docRef.data();
                        const adminOfficeUIDs = data.officeAdmin || null;
                        if (adminOfficeUIDs === null) {
                            throw new functions.https.HttpsError('permission-denied', 'This user does not have permission to modify this office.');
                        }
                        let found = false;
                        officeUIDs.forEach(x => {
                            if (adminOfficeUIDs.includes(x) === true) {
                                found = true;
                            }
                        })

                        if (found === false) {
                            throw new functions.https.HttpsError('permission-denied', 'This user does not have permission to modify this office.');
                        }

                        return
                    } else {
                        throw new functions.https.HttpsError('not-found', 'This user was not found in the database.');
                    }
                })
        })
        .then(() => {
            let dict = {};

            const amenities = (standardAmenities || []).filter(x => {
                return validateRoomAmenity(x);
            })

            if (roomName !== null) {
                dict['name'] = roomName;
            }
            if (capacity !== null) {
                dict['capacity'] = capacity;
            }
            if (amenities !== null) {
                dict['amenities'] = amenities;
            }
            if (reserveable !== null) {
                dict['reserveable'] = reserveable;
            }
            if (active !== null) {
                dict['active'] = active;
            }
            return db.collection('conferenceRooms').doc(selectedRoomUID).update(dict);
        })
}   

exports.getAllRegisteredGuestsForOfficeAdmin = function(data, context, db) { 
    const userUID = context.auth.uid || null; 
    const selectedOfficeUID = data.selectedOfficeUID || null; 

    if (userUID === null) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    if (selectedOfficeUID === null) {
        throw new functions.https.HttpsError('invalid-arguments', 'Must provide selectedOfficeUID.');
    }

    return db.collection('users').doc(userUID).get()
    .then(docRef => {
        if (docRef.exists) {
            const data = docRef.data();
            const officeAdmin = data.officeAdmin;
            if (officeAdmin.includes(selectedOfficeUID) === false) {
                throw new functions.https.HttpsError('permission-denied', 'User is not a admin for this office.');
            }
            return
        } else {
            throw new functions.https.HttpsError('permission-denied', 'No such user found.');
        }
    })
    .then( () => { 
        return db.collection('registeredGuests').where('visitingOfficeUID','==',selectedOfficeUID).get()    
        .then( (docSnapshots) => { 
            const docsData = docSnapshots.docs.map(x => x.data());
            return docsData;
        })
    })
}
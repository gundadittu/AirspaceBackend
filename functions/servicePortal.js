/* eslint-disable promise/no-nesting */
const functions = require('firebase-functions');

const checkPermissions = (resolve, reject, db, userUID, selectedOfficeUID) => {
    return db.collection('users').doc(userUID).get()
        .then(docRef => {
            const data = docRef.data();
            const officeAdminList = data.officeAdmin || null;
            if (officeAdminList === null) {
                // console.log(selectedOfficeUID);
                let error = new functions.https.HttpsError('permission-denied', 'User is not admin for any offices.');
                reject(error);
                return
            }
            if (officeAdminList.includes(selectedOfficeUID) === false) {
                // console.log(selectedOfficeUID);
                let error = new functions.https.HttpsError('permission-denied', 'User is not an admin for this office');
                reject(error);
                return
            }
            resolve()
            return
        })
}


exports.confirmPendingPackage = (data, context, db, airtable) => {
    const userUID = context.auth.uid || null;
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const recordID = data.recordID || null;

    if ((userUID === null) || (selectedOfficeUID === null) || (recordID === null)) {
        throw new functions.https.HttpsError("invalid-argument", "User must be logged in. And recordID + selectedOfficeUID must be provided.");
    }

    const validateUserPermission = (resolve, reject) => checkPermissions(resolve, reject, db, userUID, selectedOfficeUID);

    const updateRecord = (res, rej) => {
        airtable('Pending Service Packages').update(recordID, {
            "Status": "Confirmed by User",
        }, function (err, record) {
            if (err) {
                console.error(err);
                rej(error);
                return;
            }
            res();
        });
    }

    return new Promise((resolve, reject) => validateUserPermission(resolve, reject))
        .then(() => new Promise((res, rej) => updateRecord(res, rej)))
}


exports.rejectPendingPackage = (data, context, db, airtable) => {
    const userUID = context.auth.uid || null;
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const recordID = data.recordID || null;

    if ((userUID === null) || (selectedOfficeUID === null) || (recordID === null)) {
        throw new functions.https.HttpsError("invalid-argument", "User must be logged in. And recordID + selectedOfficeUID must be provided.");
    }

    const validateUserPermission = (resolve, reject) => checkPermissions(resolve, reject, db, userUID, selectedOfficeUID);

    const updateRecord = (res, rej) => {
        airtable('Pending Service Packages').update(recordID, {
            "Status": "Rejected by User",
        }, function (err, record) {
            if (err) {
                console.error(err);
                rej(error);
                return;
            }
            res();
        });
    }

    return new Promise((resolve, reject) => validateUserPermission(resolve, reject))
        .then(() => new Promise((res, rej) => updateRecord(res, rej)))
}

exports.acceptServicePlanOption = (data, context, db, airtable) => {
    const userUID = context.auth.uid || null;
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const recordID = data.recordID || null;

    if ((userUID === null) || (selectedOfficeUID === null) || (recordID === null)) {
        throw new functions.https.HttpsError("invalid-argument", "User must be logged in. And recordID + selectedOfficeUID must be provided.");
    }

    const validateUserPermission = (resolve, reject) => checkPermissions(resolve, reject, db, userUID, selectedOfficeUID);

    const updateRecord = (res, rej) => {
        airtable('Pending Service Package Options + Add-ons').update(recordID, {
            "Status": "Needs to be Added to Service Plan",
        }, function (err, record) {
            if (err) {
                console.error(err);
                rej(error);
                return;
            }
            res();
        });
    }

    return new Promise((resolve, reject) => validateUserPermission(resolve, reject))
        .then(() => new Promise((res, rej) => updateRecord(res, rej)))
}

// exports.acceptServicePlanAddOn = (data, context, db, airtable) => {
//     const userUID = context.auth.uid || null;
//     const selectedOfficeUID = data.selectedOfficeUID || null;
//     const recordID = data.recordID || null;

//     if ((userUID === null) || (selectedOfficeUID === null) || (recordID === null)) {
//         throw new functions.https.HttpsError("invalid-argument", "User must be logged in. And recordID + selectedOfficeUID must be provided.");
//     }

//     const validateUserPermission = (resolve, reject) => checkPermissions(resolve, reject, db, userUID, selectedOfficeUID);

//     const updateRecord = (res, rej) => {
//         airtable('Pend. Package Add Ons').update(recordID, {
//             "Status": "Needs to be Added to Service Plan",
//         }, function (err, record) {
//             if (err) {
//                 console.error(err);
//                 rej(error);
//                 return;
//             }
//             res();
//         });
//     }

//     return new Promise((resolve, reject) => validateUserPermission(resolve, reject))
//         .then(() => new Promise((res, rej) => updateRecord(res, rej)))
// }

exports.pendingServicePlanOption = (data, context, db, airtable) => {
    const userUID = context.auth.uid || null;
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const recordID = data.recordID || null;

    if ((userUID === null) || (selectedOfficeUID === null) || (recordID === null)) {
        throw new functions.https.HttpsError("invalid-argument", "User must be logged in. And recordID + selectedOfficeUID must be provided.");
    }

    const validateUserPermission = (resolve, reject) => checkPermissions(resolve, reject, db, userUID, selectedOfficeUID);

    const updateRecord = (res, rej) => {
        airtable('Pending Service Package Options + Add-ons').update(recordID, {
            "Status": "Pending",
        }, function (err, record) {
            if (err) {
                console.error(err);
                rej(error);
                return;
            }
            res();
        });
    }

    return new Promise((resolve, reject) => validateUserPermission(resolve, reject))
        .then(() => new Promise((res, rej) => updateRecord(res, rej)))
}

// exports.pendingServicePlanAddOn = (data, context, db, airtable) => {
//     const userUID = context.auth.uid || null;
//     const selectedOfficeUID = data.selectedOfficeUID || null;
//     const recordID = data.recordID || null;

//     if ((userUID === null) || (selectedOfficeUID === null) || (recordID === null)) {
//         throw new functions.https.HttpsError("invalid-argument", "User must be logged in. And recordID + selectedOfficeUID must be provided.");
//     }

//     const validateUserPermission = (resolve, reject) => checkPermissions(resolve, reject, db, userUID, selectedOfficeUID);

//     const updateRecord = (res, rej) => {
//         airtable('Pend. Package Add Ons').update(recordID, {
//             "Status": "Pending",
//         }, function (err, record) {
//             if (err) {
//                 console.error(err);
//                 rej(error);
//                 return;
//             }
//             res();
//         });
//     }

//     return new Promise((resolve, reject) => validateUserPermission(resolve, reject))
//         .then(() => new Promise((res, rej) => updateRecord(res, rej)))
// }

exports.submitSupportTicket = (data, context, db, airtable) => {
    const userUID = context.auth.uid || null;
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const details = data.details || null;

    let officeAtid = null;

    if ((userUID === null) || (selectedOfficeUID === null) || (details === null)) {
        throw new functions.https.HttpsError("invalid-argument", "User must be logged in. And details + selectedOfficeUID must be provided.");
    }

    const getATID = () => {
        return db.collection('offices').doc(selectedOfficeUID).get()
            .then(docRef => {
                const officeData = docRef.data() || null;
                if (officeData === null) {
                    throw Error("No data found for office.");
                }
                const atid = officeData.officeProfileATID || null;
                if (atid === null) {
                    throw Error("No atid found for this office.");
                }
                officeAtid = atid;
                return atid
            })
    }

    const submitTicket = (res, rej) => {
        airtable('Support Tickets')
            .create({
                "Status": "Open",
                "Details": details,
                "Office": [
                    officeAtid
                ]
            }, function (err, record) {
                if (err) {
                    console.error(err);
                    rej(err);
                    return
                }
                res(record);
                return
            });
    }

    return getATID()
        .then(() => new Promise((res, rej) => submitTicket(res, rej)))
}

exports.addRequestFromPortal = (data, context, db, airtable) => {

    const userUID = context.auth.uid || null;

    const serviceType = data.serviceType || null;
    const serviceDescriptionRaw = data.serviceDescription || [];
    const onlyInterestedValue = data.onlyInterested || null;
    const onlyInterested = (onlyInterestedValue === true) ? "Interest" : "Request";
    const selectedOfficeUID = data.selectedOfficeUID || null;

    const serviceDescription = ((serviceDescriptionRaw.map(x => {
        return x.question + ": " + x.response
    }))).join(" || ");

    let officeAtid = null;

    if ((userUID === null) || (serviceType === null) || (selectedOfficeUID === null)) {
        throw new functions.https.HttpsError("invalid-argument", "User must be logged in. And issue + selectedOfficeUID must be provided.");
    }

    const getATID = () => {
        return db.collection('offices').doc(selectedOfficeUID).get()
            .then(docRef => {
                const officeData = docRef.data() || null;
                if (officeData === null) {
                    throw Error("No data found for office.");
                }
                const atid = officeData.officeProfileATID || null;
                if (atid === null) {
                    throw Error("No atid found for this office.");
                }
                officeAtid = atid;
                return atid
            })
    }

    const addRequest = (res, rej) => {
        airtable('Requested Services')
            .create({
                "Type": serviceType,
                "Details": serviceDescription,
                "Interest or Request": onlyInterested,
                "Office": [
                    officeAtid
                ],
                "Status": "Open"
            }, function (err, record) {
                if (err) {
                    console.error(err);
                    rej(err);
                    return
                }
                res(record);
                return
            });
    }

    return getATID()
        .then(() => new Promise((res, rej) => addRequest(res, rej)))
}


exports.addRequestFromAlexa = (data, context, db, airtable) => {

    const userUID = data.userUID || null;
    const issue = data.issue || null;
    let selectedOfficeUID = null;
    let officeAtid = null;

    if ((userUID === null) || (issue === null)) {
        throw new functions.https.HttpsError("invalid-argument", "User must be logged in. And issue must be provided.");
    }


    const getOfficeUID = () => {
        return db.collection('alexa-auth-codes').doc(userUID).get()
            .then(docRef => {
                const data = docRef.data() || null;
                if (data === null) {
                    throw Error("No such auth-code found for user.");
                }
                const officeUID = data.selectedOfficeUID || null;
                if (officeUID === null) {
                    // console.log("13.5");
                    throw Error("No officeUID found.");
                }
                selectedOfficeUID = officeUID;
                return officeUID;
            })
    }

    const getATID = () => {
        return db.collection('offices').doc(selectedOfficeUID).get()
            .then(docRef => {
                const officeData = docRef.data() || null;
                if (officeData === null) {
                    throw Error("No data found for office.");
                }
                const atid = officeData.officeProfileATID || null;
                if (atid === null) {
                    throw Error("No atid found for this office.");
                }
                officeAtid = atid;
                return atid
            })
    }

    const addIssue = (res, rej) => {
        airtable('Alexa Requests')
            .create({
                "Notes": issue,
                "Office": [
                    officeAtid
                ],
                "Status": "Open"
            }, function (err, record) {
                if (err) {
                    console.error(err);
                    rej(err);
                    return
                }
                res(record);
                return
            });
    }

    return getOfficeUID()
        .then(() => getATID())
        .then(() => new Promise((res, rej) => addIssue(res, rej)))
}

exports.getAlexaToken = (body, response, db, admin) => {

    console.log("body:");
    console.log(body);

    const authCode = body.code || null;
    const grantType = body.grant_type || null;
    const refreshToken = body.refresh_token || null;

    let userUID = null;
    let seconds = 60 * 6; // firebase access tokens last for an hour

    const createRefreshToken = () => {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    const getUserUID = () => {
        return db
            .collection("alexa-auth-codes")
            .where("authCode", "==", authCode)
            .get()
            .then(docSnapshots => {
                const docsData = docSnapshots.docs.map(x => x.data());
                if (docsData.length === 0) {
                    throw Error("Unable to find associated user account.");
                }
                const firstDoc = docsData[0];
                const uid = firstDoc.userUID;
                if (uid === null) {
                    throw Error("Unable to find associated user account.");
                }
                userUID = uid;
                return uid
            })
    }

    const checkRefreshToken = (refreshToken) => {

        if (refreshToken === null) {
            throw Error("No Refresh token found with grant.");
        }

        return db
            .collection("alexa-auth-codes")
            .where("refreshToken", 'array-contains', refreshToken)
            .get()
            .then(docSnapshots => {
                const docsData = docSnapshots.docs.map(x => x.data());
                if (docsData.length === 0) {
                    throw Error("Unable to find associated user account.");
                }
                const firstDoc = docsData[0];
                const currRefreshToken = firstDoc.refreshToken || null;
                if (currRefreshToken === null) {
                    throw Error("Unable to find associated refresh token.");
                }
                if (currRefreshToken.includes(refreshToken) === false) {
                    throw Error("Invalid refresh token.");
                }
                const uid = firstDoc.userUID || null;
                if (uid === null) {
                    throw Error("Unable to find associated user account.");
                }

                // const lastRefresh = firstDoc.lastRefresh || null;
                // if (lastRefresh !== null) {
                //     const lastRefreshDate = lastRefresh.toDate();
                //     lastRefreshDate.setSeconds(lastRefreshDate.getSeconds() + seconds);

                //     let current = new Date();
                //     if (current < lastRefreshDate) {
                //         throw Error("Token is still valid. No need to refresh.");
                //     }
                // }
                console.log("userUID :" + uid);

                userUID = uid;
                return
            })

    }

    const createNewTokens = (res, rej, refreshToken, update) => {
        return admin.auth().createCustomToken(userUID)
            .then((token) => {
                // let lastRefresh = admin.firestore.FieldValue.serverTimestamp();

                const dict = {
                    access_token: token,
                    refresh_token: refreshToken,
                    token_type: "Bearer",
                    expires_in: seconds,
                    id_token: ""
                }


                console.log("return dict");
                console.log(dict);


                if (update === true) {
                    return db.collection('alexa-auth-codes').doc(userUID).update({ refreshToken: admin.firestore.FieldValue.arrayUnion(refreshToken) })
                        .then(() => {
                            res(dict);
                            return
                        })
                } else {
                    res(dict);
                    return
                }
            })
            .catch(error => {
                rej(error);
            })
    }

    const handleGrantType = (res, rej) => {
        if (grantType === "authorization_code") {
            if ((authCode === null) || (grantType === null)) {
                throw new functions.https.HttpsError("invalid-argument", "Must provide authCode and grantType.");
            }

            getUserUID()
                .then(() => {
                    let newRefreshToken = createRefreshToken();
                    return createNewTokens(res, rej, newRefreshToken, true);
                })
                .catch(error => {
                    rej(error);
                    return
                })

        } else if (grantType === "refresh_token") {
            if (refreshToken === null) {
                throw new functions.https.HttpsError("invalid-argument", "Must provide refreshToken.");
            }
            checkRefreshToken(refreshToken)
                .then(() => {
                    return createNewTokens(res, rej, refreshToken, false);
                })
                .catch(error => {
                    rej(error);
                    return
                })

        } else {
            rej(Error("Unknown grant_type."));
        }
    }

    return new Promise((res, rej) => handleGrantType(res, rej))
        .then((dict) => {
            response.status(200).send(dict)
            return
        })
        .catch(error => {
            console.error(error);
            console.log(body);
            throw error;
        })
}

exports.linkAlexa = (data, context, db) => {
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const authCode = data.authCode || null;
    const userUID = context.auth.uid || null;

    if ((selectedOfficeUID === null) || (userUID === null) || (authCode === null)) {
        throw new functions.https.HttpsError("invalid-argument", "Must provide selectedOfficeUID and userUID (be logged in) and authCode.");
    }

    // const validateUserPermission = (resolve, reject) => checkPermissions(resolve, reject, db, userUID, selectedOfficeUID);

    const storeAuthCode = () => {
        return db.collection("alexa-auth-codes").doc(userUID).set({
            authCode: authCode,
            selectedOfficeUID: selectedOfficeUID,
            userUID: userUID
        })
    }

    return storeAuthCode()
        .catch((error) => {
            console.error(error);
        })

    // new Promise((resolve, reject) => validateUserPermission(resolve, reject))
    //     .then(() => storeAuthCode())
    //     .catch((error) => {
    //         console.log(3);
    //         console.error(error);
    //     })
}

exports.getOfficeProfileForAdmin = (data, context, db, airtable) => {
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const userUID = context.auth.uid || null;
    let officeProfileATID = null;

    if ((selectedOfficeUID === null) || (userUID === null)) {
        throw new functions.https.HttpsError("invalid-argument", "Must provide selectedOfficeUID and userUID (be logged in).");
    }

    const validateUserPermission = (resolve, reject) => checkPermissions(resolve, reject, db, userUID, selectedOfficeUID);

    const getOfficeProfileATID = () => {
        return db.collection('offices').doc(selectedOfficeUID).get()
            .then(docRef => {
                if (docRef.exists) {
                    const data = docRef.data() || null;
                    if (data === null) {
                        throw new functions.https.HttpsError('not-found', 'Office obj for selectedOfficeUID not found.');
                    }
                    officeProfileATID = data.officeProfileATID || null;
                    if (officeProfileATID === null) {
                        throw new functions.https.HttpsError('not-found', 'officePlanATID for selectedOfficeUID not found.');
                    }
                    return
                } else {
                    throw new functions.https.HttpsError('not-found', 'Office obj for selectedOfficeUID not found.');
                }
            })
    }

    const getOfficeProfile = (resolve, reject) => {

        airtable('Office Profile').find(officeProfileATID, (err, record) => {
            if (err) {
                reject(err);
                return;
            }
            const fields = record.fields || null;
            resolve(fields);
        });
    }

    return new Promise((resolve, reject) => validateUserPermission(resolve, reject))
        .then(() => getOfficeProfileATID())
        .then(() => new Promise((res, rej) => getOfficeProfile(res, rej)))
}


exports.getExperienceManagerInfoForOffice = (data, context, db, airtable) => {
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const userUID = context.auth.uid || null;
    let officeProfileATID = null;
    let experienceManagerATID = null;

    if ((selectedOfficeUID === null) || (userUID === null)) {
        throw new functions.https.HttpsError("invalid-argument", "Must provide selectedOfficeUID and userUID (be logged in).");
    }

    const validateUserPermission = (resolve, reject) => checkPermissions(resolve, reject, db, userUID, selectedOfficeUID);

    const getOfficeProfileATID = () => {
        return db.collection('offices').doc(selectedOfficeUID).get()
            .then(docRef => {
                if (docRef.exists) {
                    const data = docRef.data() || null;
                    if (data === null) {
                        throw new functions.https.HttpsError('not-found', 'Office obj for selectedOfficeUID not found.');
                    }
                    officeProfileATID = data.officeProfileATID || null;
                    if (officeProfileATID === null) {
                        throw new functions.https.HttpsError('not-found', 'officePlanATID for selectedOfficeUID not found.');
                    }
                    return
                } else {
                    throw new functions.https.HttpsError('not-found', 'Office obj for selectedOfficeUID not found.');
                }
            })
    }

    const getExperienceManagerATID = (resolve, reject) => {
        if (officeProfileATID === null) {
            let error = Error("officeProfileATID is null. Can not get experience manager from airtable.");
            reject(error);
            return
        }

        airtable('Office Profile').find(officeProfileATID, (err, record) => {
            if (err) {
                reject(err);
                return;
            }
            const fields = record.fields || null;
            if (fields === null) {
                resolve(null);
                return
            }

            const emIDs = fields['Experience Manager'] || null;
            if ((emIDs === null) || (emIDs.length === 0)) {
                resolve(null);
                return
            }
            experienceManagerATID = emIDs[0];
            if (experienceManagerATID === null) {
                resolve(null);
                return
            }
            resolve(experienceManagerATID);
        })
    }

    const getEmInfo = (resolve, reject) => {
        if (experienceManagerATID === null) {
            // let error = Error("experienceManagerATID is null. Can not get experience manager from airtable.");
            // reject(error);
            resolve();
            return
        }

        airtable('Experience Manager').find(experienceManagerATID, (err, record) => {
            if (err) {
                reject(err);
                return;
            }

            const fields = record.fields || null;
            resolve(fields);
        });
    }

    return new Promise((resolve, reject) => validateUserPermission(resolve, reject))
        .then(() => getOfficeProfileATID())
        .then(() => new Promise((res, rej) => getExperienceManagerATID(res, rej)))
        .then(() => new Promise((res, rej) => getEmInfo(res, rej)))
}

exports.getServicePlanForOffice = (data, context, db, airtable) => {
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const userUID = context.auth.uid || null;
    let servicePlanATID = null;

    if ((selectedOfficeUID === null) || (userUID === null)) {
        throw new functions.https.HttpsError("invalid-argument", "Must provide selectedOfficeUID and userUID (be logged in).");
    }

    const validateUserPermission = (resolve, reject) => checkPermissions(resolve, reject, db, userUID, selectedOfficeUID);

    const getServicePlanATID = () => {
        return db.collection('offices').doc(selectedOfficeUID).get()
            .then(docRef => {
                if (docRef.exists) {
                    const data = docRef.data() || null;
                    if (data === null) {
                        // console.log(1);
                        throw new functions.https.HttpsError('not-found', 'Office obj for selectedOfficeUID not found.');
                    }
                    servicePlanATID = data.servicePlanATID || null;
                    if (servicePlanATID === null) {
                        // console.log(2);
                        throw new functions.https.HttpsError('not-found', 'servicePlanATID for selectedOfficeUID not found.');
                    }
                    return
                } else {
                    // console.log(3);
                    throw new functions.https.HttpsError('not-found', 'Office obj for selectedOfficeUID not found.');
                }
            })
    }

    let allPending = null;
    const getPending = () => {
        return getPendingPackages(selectedOfficeUID, db, airtable)
            .then(pending => {
                allPending = pending;
                return
            })
    }

    const getServicePlan = (resolve, reject) => {
        if (servicePlanATID === null) {
            let error = Error("servicePlanATID is null. Can not get service plan from airtable.");
            reject(error);
            return
        }

        airtable('Service Plans').find(servicePlanATID, (err, record) => {
            if (err) {
                reject(err);
                return;
            }

            const fields = record.fields || null;
            if (fields === null) {
                reject(Error("No fields found for service plan."));
                return
            }

            let packageIDS = fields['Service Packages'] || null;
            if ((packageIDS === null) || (packageIDS.length === 0)) {
                packageIDS = [];
            }

            const packageList = packageIDS.map(x => { // map returns an array of promises, each promise is fetching the full record for each service package 
                return new Promise((res, rej) => {
                    airtable('Service Packages').find(x, (err, record) => {
                        if (err) {
                            rej(err);
                            return
                        }
                        const fields = record.fields || null;
                        res(fields);
                    });
                });
            });

            const sortPackages = (packages) => {
                let active = [];
                let inactive = [];

                packages.forEach(x => {
                    if (x['Active'] === "Active") {
                        active.push(x);
                    } else if (x['Active'] === "Inactive") {
                        inactive.push(x)
                    }
                })
                let dict = {
                    active: active,
                    inactive: inactive,
                    pending: allPending
                }

                resolve(dict);
            }

            // eslint-disable-next-line consistent-return
            return Promise.all(packageList) // wait for array of packages to finish
                .then((packages) => sortPackages(packages))
                .catch(error => {
                    reject(error);
                })
        });
    }

    return new Promise((resolve, reject) => validateUserPermission(resolve, reject))
        .then(() => getPending())
        .then(() => getServicePlanATID())
        .then(() => new Promise((res, rej) => getServicePlan(res, rej)))
}

function getPendingPackages(selectedOfficeUID, db, airtable) {
    let officeAtid = null;

    if (selectedOfficeUID === null) {
        throw new functions.https.HttpsError("invalid-argument", "SelectedOfficeUID must be provided.");
    }

    const getATID = () => {
        return db.collection('offices').doc(selectedOfficeUID).get()
            .then(docRef => {
                const officeData = docRef.data() || null;
                if (officeData === null) {
                    throw Error("No data found for office.");
                }
                const atid = officeData.officeProfileATID || null;
                if (atid === null) {
                    throw Error("No atid found for this office.");
                }
                officeAtid = atid;
                return atid
            })
    }

    let allPendingPackages = [];
    const getAllPendingPackages = (res, rej) => {
        airtable('Pending Service Packages').select({
            filterByFormula: "AND(OfficeATID = '" + officeAtid + "'" + "," + "Status = 'Waiting for Response'" + ")"
            // eslint-disable-next-line prefer-arrow-callback
        }).eachPage(function page(records, fetchNextPage) {
            // This function (`page`) will get called for each page of records.

            records.forEach((record) => {
                // console.log('Retrieved', record.get('Record ID'));
                const fields = record.fields || null;
                if (fields !== null) {
                    allPendingPackages.push(fields);
                }
            });

            // To fetch the next page of records, call `fetchNextPage`.
            // If there are more records, `page` will get called again.
            // If there are no more records, `done` will get called.

            fetchNextPage();
            // eslint-disable-next-line prefer-arrow-callback
        }, function done(err) {
            if (err) {
                console.error(err);
                rej(err);
                return;
            }
            res(allPendingPackages);
        });
    }

    const getAllPendingOptions = (res, rej) => {
        if (allPendingPackages === null) {
            rej(Error("No Pending Packages"));
            return
        }

        const topPromises = allPendingPackages.filter((x) => {
            const allOptionsIDs = x["Options + Add-ons"] || null;
            if (allOptionsIDs === null) {
                return false
            }
            return true
        }).map(x => {
            const allOptionsIDs = x["Options + Add-ons"];

            let allOptions = [];
            let allAddOns = [];
            const promises = allOptionsIDs.map(y => {
                return new Promise((res, rej) =>
                    airtable('Pending Service Package Options + Add-ons').find(y, (err, record) => {
                        if (err) {
                            console.error(err);
                            res();
                            return;
                        }
                        const fields = record.fields || null;
                        if (fields !== null) {
                            const type = fields["Type"] || null;
                            if (type === "Option") {
                                allOptions.push(fields);
                            } else if (type === "Add-on") {
                                allAddOns.push(fields);
                            }
                        }
                        res();
                    }));
            });

            // eslint-disable-next-line consistent-return
            return Promise.all(promises)
                .then(() => {
                    allOptions.sort((a, b) => {
                        let first = new Date(a["Created At"]);
                        let second = new Date(b["Created At"]);
                        return first - second;
                    });

                    allAddOns.sort((a, b) => {
                        let first = new Date(a["Created At"]);
                        let second = new Date(b["Created At"]);
                        return first - second;
                    });

                    x["options"] = allOptions;
                    x["addOns"] = allAddOns;

                    return x
                })
        })

        // eslint-disable-next-line consistent-return
        return Promise.all(topPromises)
            .then(packages => {
                res(packages);
                return
            })
            .catch(error => {
                rej(error);
                return
            })
    }

    // const getAllPendingAddOns = (res, rej) => {
    //     if (allPendingPackages === null) {
    //         rej(Error("No Pending Packages"));
    //         return
    //     }

    //     const topPromises = allPendingPackages.filter((x) => {
    //         const allOptionsIDs = x["Add-ons"] || null;
    //         if (allOptionsIDs === null) {
    //             return false
    //         }
    //         return true
    //     }).map(x => {
    //         const allOptionsIDs = x["Add-ons"];

    //         let allOptions = [];
    //         const promises = allOptionsIDs.map(y => {
    //             return new Promise((res, rej) =>
    //                 airtable('Pend. Package Add Ons').find(y, (err, record) => {
    //                     if (err) {
    //                         console.error(err);
    //                         res();
    //                         return;
    //                     }
    //                     const fields = record.fields || null;
    //                     if (fields !== null) {
    //                         allOptions.push(fields);
    //                     }
    //                     res();
    //                 }));
    //         });

    //         // eslint-disable-next-line consistent-return
    //         return Promise.all(promises)
    //             .then(() => {
    //                 x["addOns"] = allOptions;
    //                 return x
    //             })
    //     })

    //     // eslint-disable-next-line consistent-return
    //     return Promise.all(topPromises)
    //         .then(packages => {
    //             console.log("finished: " + packages);
    //             res(packages);
    //             return
    //         })
    //         .catch(error => {
    //             rej(error);
    //             return
    //         })
    // }

    return getATID()
        .then(() => new Promise((res, rej) => getAllPendingPackages(res, rej)))
        .then(() => new Promise((res, rej) => getAllPendingOptions(res, rej)))
    // .then(() => new Promise((res, rej) => getAllPendingAddOns(res, rej)))
}

exports.getAllInvoicesForOffice = (data, context, db, stripe) => {
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const userUID = context.auth.uid || null;
    let stripeID = null;

    if ((selectedOfficeUID === null) || (userUID === null)) {
        throw new functions.https.HttpsError('invalid-arguments', 'Must provide selectedOfficeUID and userUID (be logged in).');
    }

    const validateUserPermission = (resolve, reject) => checkPermissions(resolve, reject, db, userUID, selectedOfficeUID);

    const getStripeID = () => {
        return db.collection('offices').doc(selectedOfficeUID).get()
            .then(docRef => {
                const data = docRef.data();
                const stripeIdent = data.stripeID || null;
                if (stripeIdent === null) {
                    throw new functions.https.HttpsError('not-found', 'This office is not registered with Stripe.');
                }
                stripeID = stripeIdent;
                return stripeIdent;
            })
    }

    const getInvoices = (resolve, reject) => {
        if (stripeID === null) {
            let error = new functions.https.HttpsError('not-found', 'StripeID is null. unable to find invoices.');
            reject(error);
            return;
        }

        // eslint-disable-next-line consistent-return
        return stripe.invoices.list(
            { customer: stripeID },
            (err, invoices) => {
                if (err) {
                    if (err.type === "StripeInvalidRequestError") {
                        // let dict = {
                        //     outstanding: [],
                        //     paid: [],
                        //     all: []
                        // }
                        // resolve(dict);
                        // return
                        // throw new functions.https.HttpsError('not-found', 'No invoices found for this office.');
                        throw err;
                    }
                    reject(err);
                    return
                }
                const rawData = invoices.data;
                const data = rawData.filter(x => {
                    const status = x.status || null;
                    if (status === null) {
                        return true
                    } else if ((status === "void") || (status === "draft")) {
                        return false
                    } else {
                        return true
                    }
                })
                let all = data;
                let outstanding = [];
                let paid = [];

                // console.log(data);

                data.forEach(x => {
                    if (x.amount_remaining > 0) {
                        outstanding.push(x);
                    } else if (x.amount_remaining === 0) {
                        paid.push(x)
                    }
                });

                outstanding.sort((a, b) => {
                    var keyA = new Date(a.due_date),
                        keyB = new Date(b.due_date);
                    // Compare the 2 dates
                    if (keyA < keyB) return -1;
                    if (keyA > keyB) return 1;
                    return 0;
                });

                let dict = {
                    outstanding: outstanding,
                    paid: paid,
                    all: all
                }
                // console.log(dict);
                resolve(dict);
            }
        );
    }

    // console.log(5);
    return new Promise((resolve, reject) => {
        validateUserPermission(resolve, reject);
    }).then(() => getStripeID())
        .then(() => new Promise((resolve, reject) => getInvoices(resolve, reject)))
        .catch(error => {
            let dict = {
                outstanding: [],
                paid: [],
                all: []
            }
            resolve(dict);
            return
        })
}
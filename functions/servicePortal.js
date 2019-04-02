const functions = require('firebase-functions');


const checkPermissions = (resolve, reject, db, userUID, selectedOfficeUID) => {
    return db.collection('users').doc(userUID).get()
        .then(docRef => {
            const data = docRef.data();
            const officeAdminList = data.officeAdmin || null;
            if (officeAdminList === null) {
                let error = new functions.https.HttpsError('permission-denied', 'Office has not admin.');
                reject(error);
                return
            }
            if (officeAdminList.includes(selectedOfficeUID) === false) {
                let error = new functions.https.HttpsError('permission-denied', 'Office has not admin.');
                reject(error);
                return
            }
            resolve()
            return
        })
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
                let error = Error("experienceManagerATID is null. Can not get experience manager from airtable.");
                reject(error);
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
                            console.log(1);
                            throw new functions.https.HttpsError('not-found', 'Office obj for selectedOfficeUID not found.');
                        }
                        servicePlanATID = data.servicePlanATID || null;
                        if (servicePlanATID === null) {
                            console.log(2);
                            throw new functions.https.HttpsError('not-found', 'servicePlanATID for selectedOfficeUID not found.');
                        }
                        return
                    } else {
                        console.log(3);
                        throw new functions.https.HttpsError('not-found', 'Office obj for selectedOfficeUID not found.');
                    }
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
                    resolve(null);
                    return
                }

                const packageIDS = fields['Service Packages'] || null;
                if ((packageIDS === null) || (packageIDS.length === 0)) {
                    resolve(null);
                    return
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
                        inactive: inactive
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
            .then(() => getServicePlanATID())
            .then(() => new Promise((res, rej) => getServicePlan(res, rej)))
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
                        reject(err);
                        return
                    }
                    const data = invoices.data;
                    let all = data;
                    let outstanding = [];
                    let paid = [];

                    console.log(data);

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
                    console.log(dict);
                    resolve(dict);
                }
            );
        }

        console.log(5);
        return new Promise((resolve, reject) => {
            validateUserPermission(resolve, reject);
        }).then(() => getStripeID())
            .then(() => new Promise((resolve, reject) => getInvoices(resolve, reject)))
    }
const functions = require('firebase-functions');

exports.getAllInvoicesForOffice = (data, context, db, stripe) => {
    const selectedOfficeUID = data.selectedOfficeUID || null;
    const userUID = context.auth.uid || null;
    let stripeID = null;

    if ((selectedOfficeUID === null) || (userUID === null)) {
        throw new functions.https.Https('invalid-arguments', 'Must provide selectedOfficeUID and userUID (be logged in).');
    }

    const validateUserPermission = () => {
        return db.collection('users').doc(userUID).get()
            .then(docRef => {
                const data = docRef.data();
                const officeAdminList = data.officeAdmin || null;
                if (officeAdminList === null) {
                    throw new functions.https.Https('permission-denied', 'Office has not admin.');
                }
                if (officeAdminList.includes(userUID) === false) {
                    throw new functions.https.Https('permission-denied', 'Office has not admin.');
                }
                return
            })
    }

    const getStripeID = () => {
        return db.collection('offices').doc(selectedOfficeUID).get()
            .then(docRef => {
                const data = docRef.data();
                const stripeIdent = data.stripeID || null;
                if (stripeIdent === null) {
                    throw new functions.https.Https('not-found', 'This office is not registered with Stripe.');
                }
                stripeID = stripeIdent;
                return stripeIdent;
            })
    }

    const getInvoices = () => {
        return stripe.invoices.list(
            { customer: stripeID },
            (err, invoices) => {
                if (err) {
                    throw err;
                }
                return invoices;
            }
        );
    }

    return validateUserPermission()
        .then(getStripeID)
        .then(getInvoices)
}
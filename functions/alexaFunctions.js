


function buildResponse(options) {
    // options.speechText
    // options.endSession
    // options.repromptText (optional)

    var response = {
        version: "1.0",
        response: {
            outputSpeech: {
                type: "PlainText",
                text: options.speechText
            },
            shouldEndSession: options.endSession
        }
    }

    if (options.repromptText) {
        response.response.reprompt = {
            outputSpeech: {
                type: "PlainText",
                text: options.repromptText
            }
        }
    }

    return response;
}

const handler = (req) => {

    // LaunchRequest
    // IntentRequest 
    // SessionEndedRequest
    const context = req.context;
    try {
        console.log(req);
        const request = req.request;
        const type = request.type;
        consple.log(request);

        if (type === "LaunchRequest") {
            const options = {
                speechText: "Welcome to Airspace Assitant. Using our skill you can tell us what you like or don't like about your office.",
                repromptText: "For example, you can say tell air space we should have RXBars in the snack room or the sink is broken.",
                endSession: false
            };
            const response = buildResponse(options);
            context.succeed(response);
            return
        } else if (type === "IntentRequest") {
            let options = {};
            const intent = request.intent;
            const intentName = intent.name;
            const slots = intent.slots;
            if (intentName === "ServiceRequest") {
                const issue = slots.issue.value;
                console.log("issue: " + issue);
                options = {
                    speechText: "Got it!",
                    endSession: true
                };
                const response = buildResponse(options);
                context.succeed(response);
                return
            } else {
                throw Error("Unknown intent type.");
            }
        } else if (type === "SessionEndedRequest") {
            const options = {
                speechText: "",
                endSession: true
            };
            const response = buildResponse(options);
            context.succeed(response);
            return
        } else {
            throw Error("Unknown intent type.");
        }
    } catch (error) {
        context.fail("Exception: " + error);
        throw error;
    }
}

exports.handler = (req) => handler(req);




// const Alexa = require("ask-sdk-core");

// const firebase = require('firebase');
// require("firebase/auth");
// require("firebase/firestore");

// var config = {
//     apiKey: "AIzaSyBPUBLiY-FCuqpJLVibdr-RoiUt4wzbaLE",
//     authDomain: "airspace-management-app.firebaseapp.com",
//     databaseURL: "https://airspace-management-app.firebaseio.com",
//     projectId: "airspace-management-app",
//     storageBucket: "airspace-management-app.appspot.com",
//     messagingSenderId: "927508779333"
// };

// firebase.initializeApp(config);
// let db = null;

// const LaunchRequestHandler = {
//     canHandle(handlerInput) {
//         return handlerInput.requestEnvelope.request.type === "LaunchRequest";
//     },
//     handle(handlerInput) {
//         console.log("LaunchRequest");

//         var speechText = "Welcome to Airspace Assistant! Please link your Airspace account in the Alexa App to continue.";

//         const accessToken =
//             handlerInput.requestEnvelope.context.System.user.accessToken;

//         // Test if user has linked his account.
//         if (!accessToken) {
//             return handlerInput.responseBuilder.speak(speechText).getResponse();
//         }

//         // Alexa will save our custom token in the access token field, so we can use it here.
//         return firebase
//             .auth()
//             .signInWithCustomToken(accessToken)
//             .then(() => {
//                 let user = firebase.auth().currentUser;

//                 if (user) {
//                     // login successful
//                     speechText = `Welcome to Airspace Assistant! You can easily submit service requests to your office administrator.`;
//                     const repromptText = "For example, you can say Tell Air space we're out of granola bars or we need cleaning and food for an event tomorrow.";

//                     // ATTENTION: This is very important. Without this the function will time out.
//                     return firebase.auth().signOut()
//                         .then(() => {
//                             return handlerInput.responseBuilder.speak(speechText).reprompt(repromptText).getResponse();
//                         })
//                 } else {
//                     // No user is signed in.
//                     speechText = "Welcome to Airspace Assistant! Please link your Airspace account in the Alexa App to continue.";

//                     // ATTENTION: This is very important. Without this the function will time out.
//                     return firebase.auth().signOut()
//                         .then(() => {
//                             return handlerInput.responseBuilder.speak(speechText).getResponse();
//                         })
//                 }
//             })
//             .catch((error) => {
//                 // Handle Errors here.
//                 var errorCode = error.code;
//                 var errorMessage = error.message;
//                 console.log(errorMessage);
//                 return handlerInput.responseBuilder.speak(speechText).getResponse();
//             });
//     }
// };

// const addRequestHandler = {
//     canHandle(handlerInput) {
//         return handlerInput.requestEnvelope.request.type === 'IntentRequest'
//             && handlerInput.requestEnvelope.request.intent.name === 'ServiceRequest';
//     },
//     handle(handlerInput) {

//         var speechText = "Please link your Airspace account in the Alexa App to continue.";

//         const accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;

//         // Test if user has linked his account.
//         if (!accessToken) {
//             return handlerInput.responseBuilder.speak(speechText).getResponse();
//         }

//         let promise = firebase.auth().signInWithCustomToken(accessToken)
//             .catch((error) => {
//                 // Handle Errors here.
//                 var errorCode = error.code;
//                 var errorMessage = error.message;
//                 console.log(errorMessage);
//                 return handlerInput.responseBuilder.speak(speechText).getResponse();
//             });

//         return Promise.all([promise])
//             .then(() => {

//                 let user = firebase.auth().currentUser;

//                 try {
//                     if (user) {
//                         // login successful
//                         speechText = 'Got it!';

//                         const userUID = user.uid;

//                         return db.collection('alexa-auth-codes').doc(userUID).get()
//                             .then(docRef => {
//                                 const data = docRef.data() || null;
//                                 if (data === null) {
//                                     throw Error(speechText);

//                                 }
//                                 const officeUID = data.selectedOfficeUID || null;
//                                 if (officeUID === null) {
//                                     throw Error(speechText);
//                                 }
//                                 return officeUID;
//                             })
//                             .then(officeUID => {
                                // return db.collection('offices').doc(officeUID).get()
                                //     .then(docRef => {
                                //         const data = docRef.data() || null;
                                //         if (data === null) {
                                //             throw Error(speechText);

                                //         }
                                //         const atid = data.officeProfileATID || null;
                                //         if (atid === null) {
                                //             throw Error(speechText);
                                //         }
                                //         return atid;
                                //     })
//                             })
//                             .then(officeProfileATID => {
                                // var issueNote = handlerInput.resuestEnvelope.request.intent.slots.issue.value;

                                // return base('Alexa Requests').create({
                                //     "Notes": issueNote,
                                //     "Office": [
                                //         officeProfileATID
                                //     ]
                                // }, function (err, record) {
                                //     if (err) {
                                //         console.error(err);
                                //         throw err;
                                //     }
                                //     return
                                // });

//                             })
//                             .then(() => {
//                                 // ATTENTION: This is very important. Without this the function will time out.
//                                 return firebase.auth().signOut();
//                             })
//                             .then(() => {

//                                 return handlerInput.responseBuilder
//                                     .speak(speechText)
//                                     .withShouldEndSession(true)
//                                     .getResponse();
//                             })
//                     } else {

//                         throw Error("Unable to find user.");
//                     }
//                 } catch (error) {

//                     // ATTENTION: This is very important. Without this the function will time out.
//                     return firebase.auth().signOut()
//                         .then(() => {
//                             return handlerInput.responseBuilder.speak(error.message).getResponse();
//                         })
//                 }
//             })
//     }
// };

// const SessionEndedRequestHandler = {
//     canHandle(handlerInput) {
//         return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
//     },
//     handle(handlerInput) {
//         //any cleanup logic goes here
//         return handlerInput.responseBuilder.getResponse();
//     }
// };

// const ErrorHandler = {
//     canHandle() {
//         return true;
//     },
//     handle(handlerInput, error) {
//         console.log(`Error handled: ${error.message}`);

//         return handlerInput.responseBuilder
//             .speak('Sorry, I can\'t understand the command. Please say again.')
//             .reprompt('Sorry, I can\'t understand the command. Please say again.')
//             .getResponse();
//     },
// };

// const skillBuilder = Alexa.SkillBuilders.custom();

// exports.handler = skillBuilder
//     .addRequestHandlers(
//         LaunchRequestHandler,
//         addRequestHandler,
//         SessionEndedRequestHandler
//     )
//     .addErrorHandlers(ErrorHandler)
//     .lambda();

// // var skill;

// // const handler = (event, context, database) => {

// //     db = database;

// //     if (!skill) {
// //         skill = Alexa.SkillBuilders.custom()
// //             .addRequestHandlers(
// //                 LaunchRequestHandler,
// //                 addRequestHandler,
// //                 SessionEndedRequestHandler
// //             )
// //             .addErrorHandlers(ErrorHandler)
// //             .create();
// //     }

// //     return skill.invoke(event, context);
// //     // console.log(`RESPONSE++++${JSON.stringify(response)}`);
// //     // return response;
// // }

// // exports.handler = (events, context) => handler(events, context);
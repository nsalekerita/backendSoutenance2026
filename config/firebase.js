"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessaging = getMessaging;

const admin = require("firebase-admin");
const { env } = require("./env");

let app = null;

/** Initialise lazy le SDK Firebase Admin à partir du JSON de compte de
 * service stocké dans .env (jamais commité). Retourne null si absent, pour
 * ne pas planter le serveur si les notifications push ne sont pas encore
 * configurées (voir notifications.service.js qui ignore l'envoi si null). */
function initFirebaseApp() {
    if (app) return app;
    if (!env.firebaseServiceAccountJson) return null;
    const serviceAccount = JSON.parse(env.firebaseServiceAccountJson);
    app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    return app;
}

function getMessaging() {
    const initialized = initFirebaseApp();
    return initialized ? admin.messaging() : null;
}

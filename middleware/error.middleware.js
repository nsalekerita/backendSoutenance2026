"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
exports.notFoundMiddleware = notFoundMiddleware;
const response_1 = require("../utils/response");
const env_1 = require("../config/env");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorMiddleware(err, _req, res, _next) {
    console.error('[error]', err);
    const status = err?.status ?? 500;
    // En production, ne jamais renvoyer le message brut d'une erreur 500 au client
    // (peut exposer des détails internes: schéma SQL, contraintes, stack, etc.).
    // Les erreurs métier (4xx) ont un message volontairement rédigé pour l'utilisateur.
    const exposeMessage = status < 500 || env_1.env.nodeEnv !== 'production';
    const message = exposeMessage ? (err?.message ?? 'Erreur interne du serveur') : 'Erreur interne du serveur';
    const details = exposeMessage ? err?.details : undefined;
    return (0, response_1.fail)(res, message, status, details);
}
function notFoundMiddleware(_req, res) {
    return (0, response_1.fail)(res, 'Route introuvable', 404);
}

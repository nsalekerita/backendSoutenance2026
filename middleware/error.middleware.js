"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
exports.notFoundMiddleware = notFoundMiddleware;
const response_1 = require("../utils/response");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorMiddleware(err, _req, res, _next) {
    console.error('[error]', err);
    const status = err?.status ?? 500;
    const message = err?.message ?? 'Erreur interne du serveur';
    return (0, response_1.fail)(res, message, status);
}
function notFoundMiddleware(_req, res) {
    return (0, response_1.fail)(res, 'Route introuvable', 404);
}

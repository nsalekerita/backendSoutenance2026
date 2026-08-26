"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
/** Vérifie le JWT envoyé dans Authorization: Bearer <token> */
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return (0, response_1.fail)(res, 'Authentification requise', 401);
    }
    try {
        const token = header.slice('Bearer '.length);
        req.user = (0, jwt_1.verifyToken)(token);
        return next();
    }
    catch {
        return (0, response_1.fail)(res, 'Session invalide ou expirée', 401);
    }
}
/** Restreint l'accès à certains rôles (à utiliser après requireAuth) */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user)
            return (0, response_1.fail)(res, 'Authentification requise', 401);
        const role = req.user.role === 'admin' ? 'administrateur' : req.user.role;
        if (!roles.includes(role)) {
            return (0, response_1.fail)(res, 'Accès refusé pour ce rôle', 403);
        }
        return next();
    };
}

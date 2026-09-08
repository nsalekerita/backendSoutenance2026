"use strict";
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jwt = require("jsonwebtoken");
const env_1 = require("../config/env");
function signToken(payload) {
    return jwt.sign(payload, env_1.env.jwtSecret, { expiresIn: env_1.env.jwtExpiresIn });
}
function verifyToken(token) {
    return jwt.verify(token, env_1.env.jwtSecret);
}

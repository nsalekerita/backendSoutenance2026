"use strict";
exports.enregistrerToken = exports.supprimerToken = exports.mesNotifications = exports.marquerLue = void 0;
const { z } = require("zod");
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const service = require("./notifications.service");

const tokenSchema = z.object({
    token: z.string().min(10),
    plateforme: z.enum(['android', 'ios', 'web']).optional(),
});

exports.enregistrerToken = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = tokenSchema.safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.fail)(res, 'Token invalide', 422);
    const data = await service.enregistrerToken(req.user.id, parsed.data.token, parsed.data.plateforme);
    return (0, response_1.ok)(res, data);
});

exports.supprimerToken = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = tokenSchema.pick({ token: true }).safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.fail)(res, 'Token invalide', 422);
    const data = await service.supprimerToken(req.user.id, parsed.data.token);
    return (0, response_1.ok)(res, data);
});

exports.mesNotifications = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await service.mesNotifications(req.user.id);
    return (0, response_1.ok)(res, data);
});

exports.marquerLue = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await service.marquerLue(req.user.id, req.params.id);
    if (!data)
        return (0, response_1.fail)(res, 'Notification introuvable', 404);
    return (0, response_1.ok)(res, data);
});

"use strict";
exports.refuser = exports.accepter = exports.candidaturesPourOffre = exports.mesCandidatures = exports.postuler = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const service = require("./candidatures.service");
const { z } = require("zod");
const postulerSchema = z.object({
    offreId: z.string().uuid('offreId invalide'),
    cv_url: z.string().url().optional().nullable(),
    message: z.string().max(2000).optional().nullable(),
});
exports.postuler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'etudiant' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux étudiants', 403);
    const parsed = postulerSchema.safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.fail)(res, 'Informations invalides ou manquantes', 422, parsed.error.flatten());
    const { offreId, cv_url, message } = parsed.data;
    const data = await service.postuler(req.user.profileId, offreId, cv_url, message);
    return (0, response_1.ok)(res, data, 201);
});
exports.mesCandidatures = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'etudiant' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux étudiants', 403);
    const data = await service.mesCandidatures(req.user.profileId);
    return (0, response_1.ok)(res, data);
});
exports.candidaturesPourOffre = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'entreprise' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux entreprises', 403);
    const data = await service.candidaturesPourOffre(req.params.offreId, req.user.profileId);
    return (0, response_1.ok)(res, data);
});
exports.accepter = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'entreprise' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux entreprises', 403);
    const data = await service.accepter(req.params.id, req.user.profileId);
    return (0, response_1.ok)(res, data);
});
exports.refuser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'entreprise' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux entreprises', 403);
    const data = await service.refuser(req.params.id, req.user.profileId);
    return (0, response_1.ok)(res, data);
});

"use strict";
exports.matching = exports.mesOffres = exports.getById = exports.listerPubliques = exports.publier = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const service = require("./offres.service");
const { z } = require("zod");
const publierOffreSchema = z.object({
    titre: z.string().min(1),
    type: z.enum(['stage', 'emploi']),
    description: z.string().max(5000).optional().nullable(),
    competences_requises: z.array(z.string()).optional().nullable(),
    filieres_ciblees: z.array(z.string().uuid()).optional().nullable(),
    localisation: z.string().max(200).optional().nullable(),
    date_limite: z.string().optional().nullable(),
});
exports.publier = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'entreprise' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux entreprises', 403);
    const parsed = publierOffreSchema.safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.fail)(res, 'Informations invalides ou manquantes', 422, parsed.error.flatten());
    const data = await service.publierOffre(req.user.profileId, parsed.data);
    return (0, response_1.ok)(res, data, 201);
});
exports.listerPubliques = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { type, filiereId } = req.query;
    const data = await service.listerOffresValidees({ type, filiereId });
    return (0, response_1.ok)(res, data);
});
exports.getById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await service.getOffre(req.params.id);
    if (!data)
        return (0, response_1.fail)(res, "Aucune offre n'a été trouvée", 404);
    return (0, response_1.ok)(res, data);
});
exports.mesOffres = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'entreprise' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux entreprises', 403);
    const data = await service.listerOffresEntreprise(req.user.profileId);
    return (0, response_1.ok)(res, data);
});
exports.matching = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'entreprise' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux entreprises', 403);
    const data = await service.matchingEtudiants(req.params.id, req.user.profileId);
    return (0, response_1.ok)(res, data);
});

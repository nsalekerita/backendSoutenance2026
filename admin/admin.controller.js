"use strict";
exports.validerEntreprise = exports.changerStatutOffre = exports.offres = exports.comptes = exports.stats = void 0;
exports.bloquerCompte = void 0;
exports.debloquerCompte = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const service = require("./admin.service");
const { z } = require("zod");
const statutOffreSchema = z.object({
    statut: z.enum(['en_attente', 'validee', 'rejetee', 'cloturee']),
});
exports.stats = (0, asyncHandler_1.asyncHandler)(async (_req, res) => (0, response_1.ok)(res, await service.statistiquesGlobales()));
exports.comptes = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const role = req.query.role;
    return (0, response_1.ok)(res, await service.listerComptes(role));
});
exports.offres = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const statut = req.query.statut;
    return (0, response_1.ok)(res, await service.listerOffresPourAdmin(statut));
});
exports.changerStatutOffre = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = statutOffreSchema.safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.fail)(res, 'statut invalide', 422, parsed.error.flatten());
    const data = await service.changerStatutOffre(req.params.id, parsed.data.statut);
    return (0, response_1.ok)(res, data);
});
exports.validerEntreprise = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await service.validerEntreprise(req.params.id);
    return (0, response_1.ok)(res, data);
});
exports.bloquerCompte = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await service.bloquerCompte(req.params.id);
    return (0, response_1.ok)(res, data);
});
exports.debloquerCompte = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await service.debloquerCompte(req.params.id);
    return (0, response_1.ok)(res, data);
});

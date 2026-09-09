"use strict";
exports.ajouterCritere = exports.creer = exports.getById = exports.lister = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const service = require("./filieres.service");
const { z } = require("zod");
const filiereSchema = z.object({
    nom: z.string().min(1),
    description: z.string().max(5000).optional().nullable(),
    debouches: z.string().max(5000).optional().nullable(),
    niveau_requis: z.string().max(200).optional().nullable(),
});
const critereSchema = z.object({
    type: z.enum(['competence', 'interet', 'matiere']),
    nom: z.string().min(1),
    poids: z.number().optional(),
});
exports.lister = (0, asyncHandler_1.asyncHandler)(async (_req, res) => (0, response_1.ok)(res, await service.listerFilieres()));
exports.getById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await service.getFiliere(req.params.id);
    if (!data)
        return (0, response_1.fail)(res, 'Filière introuvable', 404);
    return (0, response_1.ok)(res, data);
});
exports.creer = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'administrateur')
        return (0, response_1.fail)(res, 'Réservé aux administrateurs', 403);
    const parsed = filiereSchema.safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.fail)(res, 'Informations invalides ou manquantes', 422, parsed.error.flatten());
    const data = await service.creerFiliere(parsed.data);
    return (0, response_1.ok)(res, data, 201);
});
exports.ajouterCritere = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'administrateur')
        return (0, response_1.fail)(res, 'Réservé aux administrateurs', 403);
    const parsed = critereSchema.safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.fail)(res, 'Informations invalides ou manquantes', 422, parsed.error.flatten());
    const data = await service.ajouterCritere(req.params.id, parsed.data);
    return (0, response_1.ok)(res, data, 201);
});

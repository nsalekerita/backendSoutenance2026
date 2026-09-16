"use strict";
exports.publicUrl = exports.demandeUpload = exports.toutesPourEntreprise = exports.refuser = exports.accepter = exports.candidaturesPourOffre = exports.mesCandidatures = exports.postuler = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const service = require("./candidatures.service");
const { z } = require("zod");
const postulerSchema = z.object({
    offreId: z.string().uuid('offreId invalide'),
    cv_url: z.string().url().optional().nullable(),
    message: z.string().max(2000).optional().nullable(),
    email: z.string().email().optional(),
    telephone: z.string().max(50).optional(),
    localisation: z.string().max(200).optional(),
    lettre_motivation_url: z.string().url().optional().nullable(),
    lettre_recommandation_url: z.string().url().optional().nullable(),
    certification_exactitude: z.literal(true).optional(),
});
const uploadSchema = z.object({
    bucket: z.enum(['cvs', 'lettres-motivation', 'recommandations']),
    nom_fichier: z.string().min(1).max(255),
});
exports.demandeUpload = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) return (0, response_1.fail)(res, 'Document invalide', 422, parsed.error.flatten());
    return (0, response_1.ok)(res, await service.getSignedUploadUrl(req.user.profileId, parsed.data.bucket, parsed.data.nom_fichier));
});
exports.publicUrl = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = z.object({ bucket: uploadSchema.shape.bucket, path: z.string().min(1) }).safeParse(req.query);
    if (!parsed.success) return (0, response_1.fail)(res, 'Chemin invalide', 422);
    return (0, response_1.ok)(res, service.getPublicUrl(req.user.profileId, parsed.data.bucket, parsed.data.path));
});
exports.postuler = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'etudiant' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux étudiants', 403);
    const parsed = postulerSchema.safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.fail)(res, 'Informations invalides ou manquantes', 422, parsed.error.flatten());
    const { offreId, cv_url, message, email, telephone, localisation, lettre_motivation_url, lettre_recommandation_url } = parsed.data;
    const data = await service.postuler(req.user.profileId, offreId, cv_url, message, {
        email_contact: email, telephone_contact: telephone, localisation,
        lettre_motivation_url, lettre_recommandation_url,
    });
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
exports.toutesPourEntreprise = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await service.candidaturesPourEntreprise(req.user.profileId);
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

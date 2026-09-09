"use strict";
exports.me = exports.googleAuth = exports.login = exports.registerEntreprise = exports.registerEtudiant = void 0;
const { z } = require("zod");
const authService = require("./auth.service");
const response_1 = require("../utils/response");
const asyncHandler_1 = require("../utils/asyncHandler");
const registerEtudiantSchema = z.object({
    nom: z.string().min(1),
    prenom: z.string().min(1),
    email: z.string().email(),
    telephone: z.string().optional(),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});
const registerEntrepriseSchema = z.object({
    nom: z.string().min(1),
    email: z.string().email(),
    telephone: z.string().optional(),
    secteur: z.string().optional(),
    password: z.string().min(6),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
exports.registerEtudiant = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = registerEtudiantSchema.safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.fail)(res, 'Informations invalides ou manquantes', 422, parsed.error.flatten());
    const result = await authService.registerEtudiant(parsed.data);
    return (0, response_1.ok)(res, result, 201);
});
exports.registerEntreprise = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = registerEntrepriseSchema.safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.fail)(res, 'Informations invalides ou manquantes', 422, parsed.error.flatten());
    const result = await authService.registerEntreprise(parsed.data);
    return (0, response_1.ok)(res, result, 201);
});
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
        return (0, response_1.fail)(res, 'E-mail ou mot de passe manquant', 422);
    const result = await authService.login(parsed.data.email, parsed.data.password);
    return (0, response_1.ok)(res, result);
});
exports.googleAuth = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { idToken, role } = req.body ?? {};
    if (!idToken || !['etudiant', 'entreprise'].includes(role)) {
        return (0, response_1.fail)(res, 'idToken et role (etudiant|entreprise) requis', 422);
    }
    const result = await authService.loginOrRegisterWithGoogle(idToken, role);
    return (0, response_1.ok)(res, result);
});
exports.me = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    return (0, response_1.ok)(res, req.user);
});

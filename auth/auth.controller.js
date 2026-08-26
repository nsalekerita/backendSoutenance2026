"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.googleAuth = exports.login = exports.registerEntreprise = exports.registerEtudiant = void 0;
const zod_1 = require("zod");
const authService = __importStar(require("./auth.service"));
const response_1 = require("../utils/response");
const asyncHandler_1 = require("../utils/asyncHandler");
const registerEtudiantSchema = zod_1.z.object({
    nom: zod_1.z.string().min(1),
    prenom: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    telephone: zod_1.z.string().optional(),
    password: zod_1.z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});
const registerEntrepriseSchema = zod_1.z.object({
    nom: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    telephone: zod_1.z.string().optional(),
    secteur: zod_1.z.string().optional(),
    password: zod_1.z.string().min(6),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
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

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
exports.ajouterCritere = exports.creer = exports.getById = exports.lister = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const service = __importStar(require("./filieres.service"));
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
    const { nom } = req.body ?? {};
    if (!nom)
        return (0, response_1.fail)(res, 'nom requis', 422);
    const data = await service.creerFiliere(req.body);
    return (0, response_1.ok)(res, data, 201);
});
exports.ajouterCritere = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'administrateur')
        return (0, response_1.fail)(res, 'Réservé aux administrateurs', 403);
    const { type, nom } = req.body ?? {};
    if (!type || !nom)
        return (0, response_1.fail)(res, 'type et nom requis', 422);
    const data = await service.ajouterCritere(req.params.id, req.body);
    return (0, response_1.ok)(res, data, 201);
});

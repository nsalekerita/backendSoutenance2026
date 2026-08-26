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
exports.validerEntreprise = exports.changerStatutOffre = exports.offres = exports.comptes = exports.stats = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const service = __importStar(require("./admin.service"));
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
    const data = await service.changerStatutOffre(req.params.id, req.body.statut);
    return (0, response_1.ok)(res, data);
});
exports.validerEntreprise = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await service.validerEntreprise(req.params.id);
    return (0, response_1.ok)(res, data);
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenirAideContextuelle = obtenirAideContextuelle;
const gemini_client_1 = require("./gemini.client");

async function obtenirAideContextuelle(contexteEcran, question) {
    const reponse = await (0, gemini_client_1.callGemini)([{ role: 'user', content: question }], `Tu fournis une aide brève et contextuelle sur l'écran "${contexteEcran}" de l'application IAI Horizon.
Réponds en français en 2-3 phrases maximum, de façon directe et utile.`, 250);
    return reponse;
}
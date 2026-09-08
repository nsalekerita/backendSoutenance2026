"use strict";
exports.aideContextuelle = exports.historiqueConversation = exports.discuter = exports.derniereRecommandation = exports.genererRecommandation = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const response_1 = require("../utils/response");
const recommendationService = require("./recommendation.service");
const chatbotService = require("./chatbot.service");
const aideService = require("./aide-contextuelle.service");
exports.genererRecommandation = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'etudiant' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux étudiants', 403);
    const data = await recommendationService.genererRecommandation(req.user.profileId);
    return (0, response_1.ok)(res, data, 201);
});
exports.derniereRecommandation = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'etudiant' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux étudiants', 403);
    const data = await recommendationService.derniereRecommandation(req.user.profileId);
    return (0, response_1.ok)(res, data);
});
exports.discuter = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.role !== 'etudiant' || !req.user.profileId)
        return (0, response_1.fail)(res, 'Réservé aux étudiants', 403);
    const { conversationId, message } = req.body ?? {};
    if (!message)
        return (0, response_1.fail)(res, 'message requis', 422);
    const data = await chatbotService.envoyerMessage(req.user.profileId, conversationId ?? null, message);
    return (0, response_1.ok)(res, data);
});
exports.historiqueConversation = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await chatbotService.historiqueConversation(req.params.conversationId);
    return (0, response_1.ok)(res, data);
});
exports.aideContextuelle = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { ecran, question } = req.body ?? {};
    if (!ecran || !question)
        return (0, response_1.fail)(res, 'ecran et question requis', 422);
    const reponse = await aideService.obtenirAideContextuelle(ecran, question);
    return (0, response_1.ok)(res, { reponse });
});

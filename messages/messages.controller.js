"use strict";
const { z } = require('zod');
const { asyncHandler } = require('../utils/asyncHandler');
const { ok, fail } = require('../utils/response');
const service = require('./messages.service');

exports.historique = asyncHandler(async (req, res) => ok(res,
  await service.historique(req.user.profileId, req.params.etudiantId)));
exports.envoyer = asyncHandler(async (req, res) => {
  const parsed = z.object({ destinataire_id: z.string().uuid(), contenu: z.string().trim().min(1).max(4000) }).safeParse(req.body);
  if (!parsed.success) return fail(res, 'Message invalide', 422, parsed.error.flatten());
  return ok(res, await service.envoyer(req.user.profileId, parsed.data.destinataire_id, parsed.data.contenu), 201);
});

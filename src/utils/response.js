// Reponses HTTP uniformes pour toute l'API

function ok(res, data, message = 'OK', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, message = 'Une erreur est survenue', status = 400, details = null) {
  return res.status(status).json({ success: false, message, details });
}

module.exports = { ok, fail };

const { fail } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);
  return fail(res, err.message || 'Erreur serveur', err.status || 500);
}

module.exports = errorHandler;

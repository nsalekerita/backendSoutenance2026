jest.mock('../config/database', () => ({
  query: jest.fn((sql, params) => {
    if (sql.startsWith('INSERT INTO offres')) {
      // Les colonnes insérées suivent l'ordre : entreprise_id, statut, puis les champs de la liste blanche fournis.
      const colonnesMatch = sql.match(/INSERT INTO offres \(([^)]+)\)/);
      const colonnes = colonnesMatch[1].split(',').map((c) => c.trim());
      const row = {};
      colonnes.forEach((col, i) => { row[col] = params[i]; });
      return Promise.resolve({ rows: [row] });
    }
    return Promise.resolve({ rows: [] });
  }),
}));

jest.mock('../notifications/notifications.service', () => ({
  notifierAdminsNouvelleOffre: jest.fn(),
}));

const { publierOffre } = require('../offres/offres.service');

describe('offres.service publierOffre (protection mass-assignment)', () => {
  test("ignore un entreprise_id fourni dans le body et utilise celui de l'entreprise authentifiée", async () => {
    const data = await publierOffre('entreprise-legitime', {
      titre: 'Stage backend',
      type: 'stage',
      entreprise_id: 'entreprise-usurpee',
      statut: 'validee',
    });
    expect(data.entreprise_id).toBe('entreprise-legitime');
    expect(data.statut).toBe('en_attente');
  });

  test('ne transmet que les champs de la liste blanche', async () => {
    const data = await publierOffre('entreprise-legitime', {
      titre: 'Stage backend',
      type: 'stage',
      colonne_arbitraire: 'valeur-malveillante',
    });
    expect(data.colonne_arbitraire).toBeUndefined();
    expect(data.titre).toBe('Stage backend');
  });
});

const OFFRE = { id: 'offre-1', entreprise_id: 'entreprise-proprietaire' };
const CANDIDATURE_AVEC_OFFRE = { id: 'candidature-1', offre_id: 'offre-1', etudiant_id: 'etudiant-1', offres: { entreprise_id: 'entreprise-proprietaire', titre: 'Stage' } };

jest.mock('../config/database', () => ({
  query: jest.fn((sql) => {
    if (sql.includes('FROM offres') && !sql.includes('JOIN')) {
      return Promise.resolve({ rows: [OFFRE] });
    }
    if (sql.includes('FROM candidatures c JOIN offres o') && sql.includes('WHERE c.id')) {
      return Promise.resolve({ rows: [CANDIDATURE_AVEC_OFFRE] });
    }
    if (sql.includes('FROM candidatures c JOIN etudiants e')) {
      return Promise.resolve({ rows: [] });
    }
    if (sql.startsWith('UPDATE candidatures')) {
      return Promise.resolve({ rows: [{ id: 'candidature-1', etudiant_id: 'etudiant-1', statut: 'acceptee' }] });
    }
    return Promise.resolve({ rows: [] });
  }),
}));

jest.mock('../notifications/notifications.service', () => ({
  notifierEtudiantDeCandidature: jest.fn(),
  notifierEntrepriseDeOffre: jest.fn(),
}));

const { candidaturesPourOffre, accepter } = require('../candidatures/candidatures.service');

describe('candidatures.service (protection IDOR)', () => {
  test("refuse l'accès aux candidatures d'une offre appartenant à une autre entreprise", async () => {
    await expect(candidaturesPourOffre('offre-1', 'entreprise-attaquante')).rejects.toMatchObject({ status: 403 });
  });

  test("autorise l'entreprise propriétaire de l'offre à consulter ses candidatures", async () => {
    await expect(candidaturesPourOffre('offre-1', 'entreprise-proprietaire')).resolves.toEqual([]);
  });

  test("refuse d'accepter une candidature n'appartenant pas à l'entreprise authentifiée", async () => {
    await expect(accepter('candidature-1', 'entreprise-attaquante')).rejects.toMatchObject({ status: 403 });
  });
});

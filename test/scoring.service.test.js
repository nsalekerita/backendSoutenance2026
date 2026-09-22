process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const FILIERES = [
  {
    id: 'genie-logiciel',
    nom: 'Génie logiciel',
    filiere_criteres: [{ id: 'c1', type: 'interet', nom: 'Génie logiciel', poids: 5 }],
  },
  {
    id: 'systemes-reseaux',
    nom: 'Systèmes et réseaux',
    filiere_criteres: [{ id: 'c2', type: 'interet', nom: 'Systèmes et réseaux', poids: 5 }],
  },
];

jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn((table) => {
      if (table === 'etudiant_competences') {
        return { select: () => ({ eq: async () => ({ data: [], error: null }) }) };
      }
      if (table === 'etudiant_interets') {
        return { select: () => ({ eq: async () => ({ data: [], error: null }) }) };
      }
      if (table === 'wizard_reponses') {
        return {
          select: () => ({
            eq: async () => ({
              data: [{ question_id: 'q1', reponse: { label: 'Génie logiciel' } }],
              error: null,
            }),
          }),
        };
      }
      if (table === 'filieres') {
        return { select: async () => ({ data: FILIERES, error: null }) };
      }
      throw new Error(`table non mockée: ${table}`);
    }),
  },
}));

const { calculerScoresFilieres } = require('../scoring/scoring.service');

describe('scoring.service (réponses du test d’orientation)', () => {
  test('classe la filière correspondant à une réponse en première position', async () => {
    const scores = await calculerScoresFilieres('etudiant-1');

    expect(scores[0]).toMatchObject({ filiere_id: 'genie-logiciel', score: 100 });
    expect(scores[1]).toMatchObject({ filiere_id: 'systemes-reseaux', score: 0 });
  });
});
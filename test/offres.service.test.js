process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

jest.mock('../config/supabase', () => {
  const insertedPayloads = [];
  const supabaseAdmin = {
    from: jest.fn((table) => ({
      insert: jest.fn((payload) => {
        insertedPayloads.push(payload);
        return {
          select: () => ({
            single: async () => ({ data: payload, error: null }),
          }),
        };
      }),
      select: jest.fn(() => table === 'administrateurs'
        ? Promise.resolve({ data: [], error: null })
        : Promise.resolve({ data: [], error: null })),
    })),
    __insertedPayloads: insertedPayloads,
  };
  return { supabaseAdmin };
});

const { supabaseAdmin } = require('../config/supabase');
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

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const OFFRE = { id: 'offre-1', entreprise_id: 'entreprise-proprietaire' };
const CANDIDATURE = { id: 'candidature-1', offre_id: 'offre-1', offres: { entreprise_id: 'entreprise-proprietaire' } };

jest.mock('../config/supabase', () => {
  const supabaseAdmin = {
    from: jest.fn((table) => {
      if (table === 'offres') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: OFFRE, error: null }),
            }),
          }),
        };
      }
      if (table === 'candidatures') {
        return {
          select: (cols) => {
            // getCandidatureAvecOffre joins offres(entreprise_id) ; candidaturesPourOffre liste juste
            if (typeof cols === 'string' && cols.includes('offres(')) {
              return {
                eq: () => ({
                  maybeSingle: async () => ({ data: CANDIDATURE, error: null }),
                }),
              };
            }
            return {
              eq: () => ({
                order: async () => ({ data: [], error: null }),
              }),
            };
          },
        };
      }
      throw new Error(`table non mockée: ${table}`);
    }),
  };
  return { supabaseAdmin };
});

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

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
let mockAttachmentSize = 7;

function mockQuery(data) {
  const request = {
    select: () => request,
    eq: () => request,
    order: () => request,
    limit: () => request,
    single: () => request,
    maybeSingle: () => request,
    then: (resolve, reject) => Promise.resolve({ data, error: null }).then(resolve, reject),
  };
  return request;
}

jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn((table) => {
      const results = {
        etudiants: {
          nom: 'Ndiaye',
          prenom: 'Awa',
          niveau: 'II',
          filiere: 'Informatique',
          specialite: 'Développement',
          cv_chemin: 'etudiant-1/cv.pdf',
          cv_nom_fichier: 'cv-awa.pdf',
        },
        etudiant_competences: [{ competence_nom: 'JavaScript', niveau: 'avance' }],
        etudiant_interets: [{ domaine: 'Génie logiciel' }],
        wizard_reponses: [{ question_id: 'q1', reponse: { label: 'Génie logiciel' } }],
        etudiant_notes: [{ nom_fichier: 'bulletin-s3.png', semestre: 'S3', chemin_fichier: 'etudiant-1/bulletin.png' }],
        offres: [{ titre: 'Stage développeuse web', type: 'stage', localisation: 'Yaoundé' }],
        recommandations: { scores_filieres: [{ score: 82, filieres: { nom: 'Génie logiciel' } }] },
      };
      return mockQuery(results[table] ?? []);
    }),
    storage: {
      from: jest.fn(() => ({
        download: async () => ({ data: { arrayBuffer: async () => Buffer.alloc(mockAttachmentSize) }, error: null }),
      })),
    },
  },
}));

const { construireContexteProfil } = require('../ia/chatbot.service');

describe('chatbot.service (contexte étudiant)', () => {
  test('assemble le profil, les recommandations, les offres et les fichiers disponibles', async () => {
    const contexte = await construireContexteProfil('etudiant-1');

    expect(contexte.texte).toContain("Réponses au test d'orientation");
    expect(contexte.texte).toContain('Stage développeuse web');
    expect(contexte.texte).toContain('Génie logiciel (82%)');
    expect(contexte.piecesJointes).toHaveLength(2);
    expect(contexte.piecesJointes.map((piece) => piece.mimeType)).toEqual([
      'image/png',
      'application/pdf',
    ]);
  });

  test('limite à 5 Mio le volume total de pièces jointes transmis', async () => {
    mockAttachmentSize = 3 * 1024 * 1024;

    const contexte = await construireContexteProfil('etudiant-1');

    expect(contexte.piecesJointes).toHaveLength(1);
    expect(contexte.piecesJointes[0].mimeType).toBe('image/png');
    mockAttachmentSize = 7;
  });
});
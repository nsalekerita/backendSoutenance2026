// Encapsule tous les appels a l'API Claude (Anthropic) utilises par la plateforme :
// - score de compatibilite etudiant <-> specialisation + explication
// - recommandations (technologies, certifications, metiers)
// - chatbot conversationnel
require('dotenv').config();

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

async function callClaude(system, userMessage, maxTokens = 1024) {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erreur API Claude (${response.status}): ${text}`);
  }

  const data = await response.json();
  const textBlock = data.content.find((b) => b.type === 'text');
  return textBlock ? textBlock.text : '';
}

// Calcule un score de compatibilite (0-100) + explication, pour une specialisation donnee
async function computeCompatibilityScore(profil, specialisation) {
  const system = `Tu es le moteur d'orientation academique d'IAI Horizon. Tu recois un profil etudiant
(notes, competences, centres d'interet, objectifs) et une specialisation. Reponds UNIQUEMENT en JSON,
sans texte avant/apres, au format exact:
{"score": <entier 0-100>, "explication": "<2-3 phrases expliquant les criteres qui ont determine le score>"}`;

  const userMessage = `Profil etudiant: ${JSON.stringify(profil)}\nSpecialisation: ${JSON.stringify(specialisation)}`;

  const raw = await callClaude(system, userMessage, 400);
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// Genere des recommandations (technologies, certifications, formations, metiers)
async function generateRecommendations(profil) {
  const system = `Tu es le moteur de recommandation d'IAI Horizon. A partir du profil etudiant fourni,
propose des recommandations personnalisees. Reponds UNIQUEMENT en JSON, format exact:
{"technologies": ["..."], "certifications": ["..."], "formations": ["..."], "metiers": ["..."]}`;

  const raw = await callClaude(system, JSON.stringify(profil), 600);
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// Reponse du chatbot conversationnel (orientation / questions generales)
async function chatbotReply(profil, historique, message) {
  const system = `Tu es l'assistant IA d'IAI Horizon, une plateforme d'orientation academique et
d'insertion professionnelle pour les etudiants de l'Institut Africain d'Informatique (Cameroun).
Reponds de facon concise, bienveillante et utile, en tenant compte du profil de l'etudiant.
Profil: ${JSON.stringify(profil)}`;

  const conversation = [
    ...(historique || []),
    { role: 'user', content: message },
  ];

  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      system,
      messages: conversation,
    }),
  });

  if (!response.ok) throw new Error(`Erreur API Claude (${response.status})`);
  const data = await response.json();
  const textBlock = data.content.find((b) => b.type === 'text');
  return textBlock ? textBlock.text : '';
}

// Score de matching etudiant <-> offre (utilise pour le matching automatique)
async function computeOfferMatchScore(profil, offre) {
  const system = `Tu evalues la compatibilite entre un profil etudiant et une offre de stage/emploi.
Reponds UNIQUEMENT en JSON: {"score": <entier 0-100>, "raison": "<1-2 phrases>"}`;
  const raw = await callClaude(system, JSON.stringify({ profil, offre }), 300);
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

module.exports = {
  computeCompatibilityScore,
  generateRecommendations,
  chatbotReply,
  computeOfferMatchScore,
};

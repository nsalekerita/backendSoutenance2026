"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publierOffre = publierOffre;
exports.listerOffresValidees = listerOffresValidees;
exports.getOffre = getOffre;
exports.listerOffresEntreprise = listerOffresEntreprise;
exports.matchingEtudiants = matchingEtudiants;
exports.supprimerOffre = supprimerOffre;
const { query } = require("../config/database");
const notifications_1 = require("../notifications/notifications.service");
/** Liste blanche des champs acceptés à la création d'une offre : évite le mass-assignment. */
const CHAMPS_OFFRE_AUTORISES = [
    'titre',
    'description',
    'type',
    'competences_requises',
    'filieres_ciblees',
    'localisation',
    'date_limite',
];
function dbValue(champ, valeur) {
    if (champ === 'competences_requises' && valeur !== null && valeur !== undefined) return JSON.stringify(valeur);
    return valeur;
}
async function publierOffre(entrepriseId, input) {
    const colonnes = ['entreprise_id', 'statut'];
    const valeurs = [entrepriseId, 'en_attente'];
    for (const champ of CHAMPS_OFFRE_AUTORISES) {
        if (input?.[champ] !== undefined) {
            colonnes.push(champ);
            valeurs.push(dbValue(champ, input[champ]));
        }
    }
    const placeholders = valeurs.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await query(
        `INSERT INTO offres (${colonnes.join(',')}) VALUES (${placeholders}) RETURNING *`,
        valeurs
    );
    const data = rows[0];
    await notifications_1.notifierAdminsNouvelleOffre({
        titre: 'Nouvelle offre à valider',
        corps: `Une nouvelle offre "${data.titre}" attend votre validation.`,
        type: 'offre_a_valider',
        data: { offreId: data.id },
    });
    return data;
}
async function attacherEntreprise(offres) {
    for (const offre of offres) {
        const { rows } = await query('SELECT nom, secteur FROM entreprises WHERE id = $1', [offre.entreprise_id]);
        offre.entreprises = rows[0] ?? null;
    }
    return offres;
}
/** Liste publique (étudiants) : uniquement les offres validées */
async function listerOffresValidees(filters) {
    const params = ['validee'];
    let sql = `SELECT * FROM offres WHERE statut = $1`;
    if (filters.type) {
        params.push(filters.type);
        sql += ` AND type = $${params.length}`;
    }
    if (filters.filiereId) {
        params.push([filters.filiereId]);
        sql += ` AND filieres_ciblees @> $${params.length}::uuid[]`;
    }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await query(sql, params);
    return attacherEntreprise(rows);
}
async function getOffre(id) {
    const { rows } = await query('SELECT * FROM offres WHERE id = $1', [id]);
    if (!rows[0]) return null;
    const [offre] = await attacherEntreprise(rows);
    return offre;
}
async function listerOffresEntreprise(entrepriseId) {
    const { rows } = await query(
        `SELECT * FROM offres WHERE entreprise_id = $1 ORDER BY created_at DESC`,
        [entrepriseId]
    );
    return rows;
}
async function supprimerOffre(offreId, entrepriseId) {
    const { rows } = await query(
        `DELETE FROM offres WHERE id = $1 AND entreprise_id = $2 RETURNING id`,
        [offreId, entrepriseId]
    );
    const data = rows[0];
    if (!data) {
        const err = new Error('Offre introuvable ou non autorisée');
        err.status = 404;
        throw err;
    }
    return data;
}
/**
 * "Matching auto via API" : calcule les étudiants compatibles avec une offre
 * en comparant compétences requises <-> compétences de chaque étudiant ayant
 * une des filières ciblées. Version simple par intersection ; peut être
 * enrichie par le même moteur de scoring que scoring.service.
 */
async function matchingEtudiants(offreId, entrepriseId) {
    const offre = await getOffre(offreId);
    if (!offre)
        return [];
    if (entrepriseId && offre.entreprise_id !== entrepriseId) {
        const err = new Error("Cette offre n'appartient pas à votre entreprise");
        err.status = 403;
        throw err;
    }
    const competencesRequises = Array.isArray(offre.competences_requises)
        ? offre.competences_requises
        : [];
    const params = [];
    let sql = 'SELECT id, nom, prenom, filiere_actuelle_id FROM etudiants';
    if (offre.filieres_ciblees?.length) {
        params.push(offre.filieres_ciblees);
        sql += ` WHERE filiere_actuelle_id = ANY($${params.length}::uuid[])`;
    }
    const { rows: etudiants } = await query(sql, params);
    for (const e of etudiants) {
        const { rows: competences } = await query(
            'SELECT competence_nom FROM etudiant_competences WHERE etudiant_id = $1',
            [e.id]
        );
        e.etudiant_competences = competences;
    }
    return etudiants
        .map((e) => {
        const comps = (e.etudiant_competences ?? []).map((c) => c.competence_nom.toLowerCase());
        const matches = competencesRequises.filter((c) => comps.includes(c.toLowerCase()));
        return { ...e, matchScore: competencesRequises.length ? matches.length / competencesRequises.length : 0.5 };
    })
        .sort((a, b) => b.matchScore - a.matchScore);
}

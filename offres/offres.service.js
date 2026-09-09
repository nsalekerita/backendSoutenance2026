"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publierOffre = publierOffre;
exports.listerOffresValidees = listerOffresValidees;
exports.getOffre = getOffre;
exports.listerOffresEntreprise = listerOffresEntreprise;
exports.matchingEtudiants = matchingEtudiants;
const supabase_1 = require("../config/supabase");
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
async function publierOffre(entrepriseId, input) {
    const payload = {};
    for (const champ of CHAMPS_OFFRE_AUTORISES) {
        if (input?.[champ] !== undefined) {
            payload[champ] = input[champ];
        }
    }
    const { data, error } = await supabase_1.supabaseAdmin
        .from('offres')
        .insert({ ...payload, entreprise_id: entrepriseId, statut: 'en_attente' })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
/** Liste publique (étudiants) : uniquement les offres validées */
async function listerOffresValidees(filters) {
    let query = supabase_1.supabaseAdmin.from('offres').select('*, entreprises(nom, secteur)').eq('statut', 'validee');
    if (filters.type)
        query = query.eq('type', filters.type);
    if (filters.filiereId)
        query = query.contains('filieres_ciblees', [filters.filiereId]);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
}
async function getOffre(id) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('offres')
        .select('*, entreprises(nom, secteur)')
        .eq('id', id)
        .maybeSingle();
    if (error)
        throw error;
    return data;
}
async function listerOffresEntreprise(entrepriseId) {
    const { data, error } = await supabase_1.supabaseAdmin
        .from('offres')
        .select('*')
        .eq('entreprise_id', entrepriseId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data ?? [];
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
    let query = supabase_1.supabaseAdmin.from('etudiants').select('id, nom, prenom, filiere_actuelle_id, etudiant_competences(competence_nom)');
    if (offre.filieres_ciblees?.length) {
        query = query.in('filiere_actuelle_id', offre.filieres_ciblees);
    }
    const { data: etudiants, error } = await query;
    if (error)
        throw error;
    return (etudiants ?? [])
        .map((e) => {
        const comps = (e.etudiant_competences ?? []).map((c) => c.competence_nom.toLowerCase());
        const matches = competencesRequises.filter((c) => comps.includes(c.toLowerCase()));
        return { ...e, matchScore: competencesRequises.length ? matches.length / competencesRequises.length : 0.5 };
    })
        .sort((a, b) => b.matchScore - a.matchScore);
}

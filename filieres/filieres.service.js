"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listerFilieres = listerFilieres;
exports.getFiliere = getFiliere;
exports.creerFiliere = creerFiliere;
exports.ajouterCritere = ajouterCritere;
const { query } = require("../config/database");

function identifier(value) {
    if (!/^[a-z_][a-z0-9_]*$/i.test(value)) throw new Error(`Identifiant SQL invalide: ${value}`);
    return `"${value}"`;
}

async function attacherCriteres(filieres) {
    for (const filiere of filieres) {
        const { rows } = await query('SELECT * FROM filiere_criteres WHERE filiere_id = $1', [filiere.id]);
        filiere.filiere_criteres = rows;
    }
    return filieres;
}
async function listerFilieres() {
    const { rows } = await query('SELECT * FROM filieres ORDER BY nom');
    return attacherCriteres(rows);
}
async function getFiliere(id) {
    const { rows } = await query('SELECT * FROM filieres WHERE id = $1', [id]);
    if (!rows[0]) return null;
    const [filiere] = await attacherCriteres(rows);
    return filiere;
}
async function creerFiliere(input) {
    const colonnes = Object.keys(input);
    const valeurs = colonnes.map((c) => input[c]);
    const placeholders = valeurs.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await query(
        `INSERT INTO filieres (${colonnes.map(identifier).join(',')}) VALUES (${placeholders}) RETURNING *`,
        valeurs
    );
    return rows[0];
}
async function ajouterCritere(filiereId, input) {
    const colonnes = ['filiere_id', ...Object.keys(input)];
    const valeurs = [filiereId, ...Object.keys(input).map((c) => input[c])];
    const placeholders = valeurs.map((_, i) => `$${i + 1}`).join(',');
    const { rows } = await query(
        `INSERT INTO filiere_criteres (${colonnes.map(identifier).join(',')}) VALUES (${placeholders}) RETURNING *`,
        valeurs
    );
    return rows[0];
}

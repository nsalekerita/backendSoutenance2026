"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statistiquesGlobales = statistiquesGlobales;
exports.listerComptes = listerComptes;
exports.bloquerCompte = bloquerCompte;
exports.debloquerCompte = debloquerCompte;
exports.listerOffresPourAdmin = listerOffresPourAdmin;
exports.changerStatutOffre = changerStatutOffre;
exports.validerEntreprise = validerEntreprise;
exports.supprimerCompte = supprimerCompte;
const { query } = require("../config/database");
const notifications_1 = require("../notifications/notifications.service");

async function compter(table) {
    const { rows } = await query(`SELECT count(*)::int AS count FROM ${table}`);
    return rows[0].count;
}

async function statistiquesGlobales() {
    const [nbEtudiants, nbEntreprises, nbOffres, nbCandidatures] = await Promise.all([
        compter('etudiants'),
        compter('entreprises'),
        compter('offres'),
        compter('candidatures'),
    ]);
    const { rows: offresParStatut } = await query('SELECT statut FROM offres');
    const repartitionStatuts = offresParStatut.reduce((acc, o) => {
        acc[o.statut] = (acc[o.statut] ?? 0) + 1;
        return acc;
    }, {});
    return {
        nbEtudiants,
        nbEntreprises,
        nbOffres,
        nbCandidatures,
        repartitionStatutsOffres: repartitionStatuts,
    };
}
async function listerComptes(role) {
    const params = [];
    let sql = 'SELECT id, email, role, actif, created_at FROM users';
    if (role) {
        params.push(role);
        sql += ` WHERE role = $${params.length}`;
    }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await query(sql, params);
    return rows;
}
async function setCompteActif(userId, actif) {
    const { rows } = await query(
        `UPDATE users SET actif = $1 WHERE id = $2 RETURNING id, email, role, actif`,
        [actif, userId]
    );
    const data = rows[0];
    if (!data) {
        const err = new Error('Compte introuvable');
        err.status = 404;
        throw err;
    }
    return data;
}
async function bloquerCompte(userId) {
    return setCompteActif(userId, false);
}
async function debloquerCompte(userId) {
    return setCompteActif(userId, true);
}
async function supprimerCompte(userId, adminUserId) {
    if (userId === adminUserId) {
        const err = new Error('Vous ne pouvez pas supprimer votre propre compte');
        err.status = 409;
        throw err;
    }
    // Les contraintes "on delete cascade" du schéma nettoient automatiquement
    // etudiants/entreprises/administrateurs et toutes leurs dépendances.
    const { rows } = await query(`DELETE FROM users WHERE id = $1 RETURNING id`, [userId]);
    const data = rows[0];
    if (!data) {
        const err = new Error('Compte introuvable'); err.status = 404; throw err;
    }
    return data;
}
async function listerOffresPourAdmin(statut) {
    const params = [];
    let sql = `SELECT o.*, json_build_object('nom', e.nom) AS entreprises
               FROM offres o JOIN entreprises e ON e.id = o.entreprise_id`;
    if (statut) {
        params.push(statut);
        sql += ` WHERE o.statut = $${params.length}`;
    }
    sql += ' ORDER BY o.created_at DESC';
    const { rows } = await query(sql, params);
    return rows;
}
const LIBELLES_STATUT_OFFRE = {
    validee: 'a été validée et est désormais visible par les étudiants',
    rejetee: 'a été rejetée',
    cloturee: 'a été clôturée',
};
async function changerStatutOffre(offreId, statut) {
    const { rows } = await query(
        `UPDATE offres SET statut = $1 WHERE id = $2 RETURNING *`,
        [statut, offreId]
    );
    const data = rows[0];
    if (!data) {
        const err = new Error('Offre introuvable');
        err.status = 404;
        throw err;
    }
    const { rows: entrepriseRows } = await query('SELECT id FROM entreprises WHERE id = $1', [data.entreprise_id]);
    if (entrepriseRows[0]) {
        await notifications_1.notifierEntrepriseDeOffre(entrepriseRows[0].id, {
            titre: 'Statut de votre offre mis à jour',
            corps: `Votre offre "${data.titre}" ${LIBELLES_STATUT_OFFRE[statut] ?? `est passée au statut "${statut}"`}.`,
            type: 'offre_statut',
            data: { offreId, statut },
        });
    }
    return data;
}
async function validerEntreprise(entrepriseId) {
    const { rows } = await query(
        `UPDATE entreprises SET statut_verification = 'validee' WHERE id = $1 RETURNING *`,
        [entrepriseId]
    );
    const data = rows[0];
    if (!data) {
        const err = new Error('Entreprise introuvable');
        err.status = 404;
        throw err;
    }
    return data;
}

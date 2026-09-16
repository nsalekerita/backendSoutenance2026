"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEtudiant = registerEtudiant;
exports.registerEntreprise = registerEntreprise;
exports.login = login;
exports.loginOrRegisterWithGoogle = loginOrRegisterWithGoogle;
exports.renvoyerCodeInscription = renvoyerCodeInscription;
exports.verifierCodeInscription = verifierCodeInscription;
exports.demanderReinitialisationMotDePasse = demanderReinitialisationMotDePasse;
exports.reinitialiserMotDePasse = reinitialiserMotDePasse;
const { query } = require("../config/database");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const otp_1 = require("../utils/otp");
const { OAuth2Client } = require("google-auth-library");
class HttpError extends Error {
    constructor(message, status = 400, details) {
        super(message);
        this.status = status;
        this.details = details;
    }
}
const TABLE_PROFIL_PAR_ROLE = { etudiant: 'etudiants', entreprise: 'entreprises', administrateur: 'administrateurs' };
async function assertEmailAvailable(email) {
    const { rows } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (rows.length) throw new HttpError('Cette adresse e-mail est déjà utilisée', 409);
}
async function createBaseUser(email, password, role) {
    const password_hash = await (0, password_1.hashPassword)(password);
    const { rows } = await query(
        `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role`,
        [email, password_hash, role]
    );
    return rows[0];
}
async function registerEtudiant(input) {
    await assertEmailAvailable(input.email);
    const user = await createBaseUser(input.email, input.password, 'etudiant');
    const { rows } = await query(
        `INSERT INTO etudiants (user_id, nom, prenom) VALUES ($1, $2, $3) RETURNING id`,
        [user.id, input.nom, input.prenom]
    );
    const etudiant = rows[0];
    // Crée le suivi de wizard d'orientation (étape 0, en_cours)
    await query(`INSERT INTO profils_wizard (etudiant_id) VALUES ($1)`, [etudiant.id]);
    await (0, otp_1.genererEtEnvoyerOtp)(user.email, 'inscription');
    return { requiresOtp: true, email: user.email };
}
async function registerEntreprise(input) {
    await assertEmailAvailable(input.email);
    const user = await createBaseUser(input.email, input.password, 'entreprise');
    // NB (cf. spec) : l'entreprise n'a PAS besoin de validation administrateur pour créer
    // un compte ; statut_verification reste indicatif pour un futur badge "vérifiée".
    await query(
        `INSERT INTO entreprises (user_id, nom, secteur, statut_verification) VALUES ($1, $2, $3, 'en_attente')`,
        [user.id, input.nom, input.secteur ?? null]
    );
    await (0, otp_1.genererEtEnvoyerOtp)(user.email, 'inscription');
    return { requiresOtp: true, email: user.email };
}
async function login(email, password) {
    const { rows } = await query(
        `SELECT id, email, password_hash, role, actif, email_verifie FROM users WHERE email = $1`,
        [email]
    );
    const user = rows[0];
    if (!user)
        throw new HttpError('E-mail ou mot de passe incorrect', 401);
    const valid = await (0, password_1.comparePassword)(password, user.password_hash);
    if (!valid)
        throw new HttpError('E-mail ou mot de passe incorrect', 401);
    if (user.actif === false)
        throw new HttpError('Ce compte a été désactivé', 403);
    const role = user.role === 'admin' ? 'administrateur' : user.role;
    const profileId = await resolveProfileId(user.id, role);
    const authUser = { id: user.id, email: user.email, role, profileId };
    return { token: (0, jwt_1.signToken)(authUser), user: authUser };
}
async function resolveProfileId(userId, role) {
    const table = TABLE_PROFIL_PAR_ROLE[role] ?? 'administrateurs';
    const { rows } = await query(`SELECT id FROM ${table} WHERE user_id = $1`, [userId]);
    return rows[0]?.id;
}
/**
 * Connexion / inscription via Google : à brancher sur Google OAuth côté Flutter
 * (google_sign_in) qui renvoie un id_token vérifié ici, puis on crée le compte
 * users + etudiants/entreprises s'il n'existe pas encore (mot de passe aléatoire).
 * Squelette fourni ; l'implémentation de la vérification du id_token Google
 * dépend du package choisi côté client (google_sign_in / googleapis côté back).
 */
async function loginOrRegisterWithGoogle(googleIdToken, role) {
    const { env } = require('../config/env');
    if (!env.googleClientId)
        throw new HttpError('Connexion Google non configurée', 503);
    if (!['etudiant', 'entreprise'].includes(role))
        throw new HttpError('Rôle Google invalide', 422);
    let ticket;
    try {
        ticket = await new OAuth2Client(env.googleClientId).verifyIdToken({
            idToken: googleIdToken,
            audience: env.googleClientId,
        });
    }
    catch {
        throw new HttpError('Jeton Google invalide ou expiré', 401);
    }
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified)
        throw new HttpError('Compte Google non vérifié', 401);
    let { rows } = await query(
        `SELECT id, email, role, actif FROM users WHERE email = $1`,
        [payload.email]
    );
    let user = rows[0];
    if (!user) {
        user = await createBaseUser(payload.email, require('crypto').randomBytes(32).toString('hex'), role);
        await query(`UPDATE users SET email_verifie = true WHERE id = $1`, [user.id]);
        if (role === 'etudiant') {
            const names = String(payload.name ?? '').trim().split(/\s+/);
            const { rows: profilRows } = await query(
                `INSERT INTO etudiants (user_id, prenom, nom) VALUES ($1, $2, $3) RETURNING id`,
                [user.id, payload.given_name ?? names.shift() ?? 'Utilisateur', payload.family_name ?? names.join(' ') ?? '']
            );
            await query(`INSERT INTO profils_wizard (etudiant_id) VALUES ($1)`, [profilRows[0].id]);
        } else {
            await query(
                `INSERT INTO entreprises (user_id, nom, statut_verification) VALUES ($1, $2, 'en_attente')`,
                [user.id, payload.name ?? payload.email]
            );
        }
    }
    if (user.actif === false) throw new HttpError('Ce compte a été désactivé', 403);
    const normalizedRole = user.role === 'admin' ? 'administrateur' : user.role;
    const profileId = await resolveProfileId(user.id, normalizedRole);
    const authUser = { id: user.id, email: user.email, role: normalizedRole, profileId };
    return { token: (0, jwt_1.signToken)(authUser), user: authUser };
}
async function renvoyerCodeInscription(email) {
    const { rows } = await query(`SELECT id, email_verifie FROM users WHERE email = $1`, [email]);
    const user = rows[0];
    if (!user)
        throw new HttpError('Aucun compte associé à cet e-mail', 404);
    if (user.email_verifie)
        throw new HttpError('Cette adresse e-mail est déjà vérifiée', 409);
    await (0, otp_1.genererEtEnvoyerOtp)(email, 'inscription');
    return { message: 'Un nouveau code a été envoyé.' };
}
async function verifierCodeInscription(email, code) {
    const resultat = await (0, otp_1.verifierOtp)(email, code, 'inscription');
    if (!resultat.valide)
        throw new HttpError(resultat.raison, 400);
    const { rows } = await query(
        `UPDATE users SET email_verifie = true WHERE email = $1 RETURNING id, email, role`,
        [email]
    );
    const user = rows[0];
    const role = user.role === 'admin' ? 'administrateur' : user.role;
    const profileId = await resolveProfileId(user.id, role);
    const authUser = { id: user.id, email: user.email, role, profileId };
    return { token: (0, jwt_1.signToken)(authUser), user: authUser };
}
async function demanderReinitialisationMotDePasse(email) {
    const { rows } = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (rows.length) {
        await (0, otp_1.genererEtEnvoyerOtp)(email, 'reinitialisation');
    }
    return { message: 'Si un compte existe pour cet e-mail, un code de réinitialisation a été envoyé.' };
}
async function reinitialiserMotDePasse(email, code, nouveauMotDePasse) {
    const resultat = await (0, otp_1.verifierOtp)(email, code, 'reinitialisation');
    if (!resultat.valide)
        throw new HttpError(resultat.raison, 400);
    const password_hash = await (0, password_1.hashPassword)(nouveauMotDePasse);
    await query(`UPDATE users SET password_hash = $1 WHERE email = $2`, [password_hash, email]);
    return { message: 'Mot de passe réinitialisé avec succès.' };
}

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
const supabase_1 = require("../config/supabase");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const otp_1 = require("../utils/otp");
class HttpError extends Error {
    constructor(message, status = 400, details) {
        super(message);
        this.status = status;
        this.details = details;
    }
}
async function assertEmailAvailable(email) {
    const { data } = await supabase_1.supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle();
    if (data)
        throw new HttpError('Cette adresse e-mail est déjà utilisée', 409);
}
async function createBaseUser(email, password, role) {
    const password_hash = await (0, password_1.hashPassword)(password);
    const { data, error } = await supabase_1.supabaseAdmin
        .from('users')
        .insert({ email, password_hash, role })
        .select('id, email, role')
        .single();
    if (error)
        throw new HttpError(error.message, 500);
    return data;
}
async function registerEtudiant(input) {
    await assertEmailAvailable(input.email);
    const user = await createBaseUser(input.email, input.password, 'etudiant');
    const { data: etudiant, error } = await supabase_1.supabaseAdmin
        .from('etudiants')
        .insert({ user_id: user.id, nom: input.nom, prenom: input.prenom })
        .select('id')
        .single();
    if (error)
        throw new HttpError(error.message, 500);
    // Crée le suivi de wizard d'orientation (étape 0, en_cours)
    await supabase_1.supabaseAdmin.from('profils_wizard').insert({ etudiant_id: etudiant.id });
    await (0, otp_1.genererEtEnvoyerOtp)(user.email, 'inscription');
    return { requiresOtp: true, email: user.email };
}
async function registerEntreprise(input) {
    await assertEmailAvailable(input.email);
    const user = await createBaseUser(input.email, input.password, 'entreprise');
    // NB (cf. spec) : l'entreprise n'a PAS besoin de validation administrateur pour créer
    // un compte ; statut_verification reste indicatif pour un futur badge "vérifiée".
    const { data: entreprise, error } = await supabase_1.supabaseAdmin
        .from('entreprises')
        .insert({ user_id: user.id, nom: input.nom, secteur: input.secteur ?? null, statut_verification: 'en_attente' })
        .select('id')
        .single();
    if (error)
        throw new HttpError(error.message, 500);
    await (0, otp_1.genererEtEnvoyerOtp)(user.email, 'inscription');
    return { requiresOtp: true, email: user.email };
}
async function login(email, password) {
    const { data: user } = await supabase_1.supabaseAdmin
        .from('users')
        .select('id, email, password_hash, role, actif, email_verifie')
        .eq('email', email)
        .maybeSingle();
    if (!user)
        throw new HttpError('E-mail ou mot de passe incorrect', 401);
    const valid = await (0, password_1.comparePassword)(password, user.password_hash);
    if (!valid)
        throw new HttpError('E-mail ou mot de passe incorrect', 401);
    if (user.actif === false)
        throw new HttpError('Ce compte a été désactivé', 403);
    if (user.email_verifie === false) {
        throw new HttpError('Veuillez vérifier votre adresse e-mail avant de vous connecter.', 403, { requiresOtp: true, email: user.email });
    }
    const role = user.role === 'admin' ? 'administrateur' : user.role;
    const profileId = await resolveProfileId(user.id, role);
    const authUser = { id: user.id, email: user.email, role, profileId };
    return { token: (0, jwt_1.signToken)(authUser), user: authUser };
}
async function resolveProfileId(userId, role) {
    const table = role === 'etudiant' ? 'etudiants' : role === 'entreprise' ? 'entreprises' : 'administrateurs';
    const { data } = await supabase_1.supabaseAdmin.from(table).select('id').eq('user_id', userId).maybeSingle();
    return data?.id;
}
/**
 * Connexion / inscription via Google : à brancher sur Google OAuth côté Flutter
 * (google_sign_in) qui renvoie un id_token vérifié ici, puis on crée le compte
 * users + etudiants/entreprises s'il n'existe pas encore (mot de passe aléatoire).
 * Squelette fourni ; l'implémentation de la vérification du id_token Google
 * dépend du package choisi côté client (google_sign_in / googleapis côté back).
 */
async function loginOrRegisterWithGoogle(_googleIdToken, role) {
    throw new HttpError(`Connexion Google non configurée (role demandé: ${role}). Voir README.`, 501);
}
async function renvoyerCodeInscription(email) {
    const { data: user } = await supabase_1.supabaseAdmin
        .from('users')
        .select('id, email_verifie')
        .eq('email', email)
        .maybeSingle();
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
    const { data: user, error } = await supabase_1.supabaseAdmin
        .from('users')
        .update({ email_verifie: true })
        .eq('email', email)
        .select('id, email, role')
        .single();
    if (error)
        throw new HttpError(error.message, 500);
    const role = user.role === 'admin' ? 'administrateur' : user.role;
    const profileId = await resolveProfileId(user.id, role);
    const authUser = { id: user.id, email: user.email, role, profileId };
    return { token: (0, jwt_1.signToken)(authUser), user: authUser };
}
async function demanderReinitialisationMotDePasse(email) {
    const { data: user } = await supabase_1.supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
    if (user) {
        await (0, otp_1.genererEtEnvoyerOtp)(email, 'reinitialisation');
    }
    return { message: 'Si un compte existe pour cet e-mail, un code de réinitialisation a été envoyé.' };
}
async function reinitialiserMotDePasse(email, code, nouveauMotDePasse) {
    const resultat = await (0, otp_1.verifierOtp)(email, code, 'reinitialisation');
    if (!resultat.valide)
        throw new HttpError(resultat.raison, 400);
    const password_hash = await (0, password_1.hashPassword)(nouveauMotDePasse);
    const { error } = await supabase_1.supabaseAdmin
        .from('users')
        .update({ password_hash })
        .eq('email', email);
    if (error)
        throw new HttpError(error.message, 500);
    return { message: 'Mot de passe réinitialisé avec succès.' };
}

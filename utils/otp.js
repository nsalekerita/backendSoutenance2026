"use strict";
exports.genererEtEnvoyerOtp = genererEtEnvoyerOtp;
exports.verifierOtp = verifierOtp;

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { query } = require("../config/database");
const { envoyerEmail } = require("./mailer");

const DUREE_VALIDITE_MINUTES = 10;
const TENTATIVES_MAX = 5;

function genererCode() {
    return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

/** Génère un code à 6 chiffres, invalide les codes précédents non utilisés
 * pour ce couple (email, purpose), puis envoie le nouveau code par e-mail. */
async function genererEtEnvoyerOtp(email, purpose) {
    const code = genererCode();
    const code_hash = await bcrypt.hash(code, 10);
    const expires_at = new Date(Date.now() + DUREE_VALIDITE_MINUTES * 60 * 1000).toISOString();

    await query(
        `UPDATE otp_codes SET consumed_at = now() WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL`,
        [email, purpose]
    );

    await query(
        `INSERT INTO otp_codes (email, code_hash, purpose, expires_at) VALUES ($1, $2, $3, $4)`,
        [email, code_hash, purpose, expires_at]
    );

    const sujet = purpose === 'inscription' ? 'Vérifiez votre adresse e-mail' : 'Réinitialisation de votre mot de passe';
    await envoyerEmail({
        to: email,
        subject: `${sujet} — IAI Horizon`,
        html: `
          <p>Bonjour,</p>
          <p>Voici votre code de vérification IAI Horizon :</p>
          <p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${code}</p>
          <p>Ce code expire dans ${DUREE_VALIDITE_MINUTES} minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
        `,
    });
}

/** Vérifie le dernier code non consommé pour (email, purpose) et le marque
 * consommé s'il est valide. Incrémente le compteur de tentatives sinon. */
async function verifierOtp(email, code, purpose) {
    const { rows } = await query(
        `SELECT * FROM otp_codes WHERE email = $1 AND purpose = $2 AND consumed_at IS NULL
         ORDER BY created_at DESC LIMIT 1`,
        [email, purpose]
    );
    const otp = rows[0] ?? null;

    if (!otp) return { valide: false, raison: 'Aucun code en attente. Demandez un nouveau code.' };
    if (new Date(otp.expires_at) < new Date()) {
        return { valide: false, raison: 'Ce code a expiré. Demandez un nouveau code.' };
    }
    if (otp.tentatives >= TENTATIVES_MAX) {
        return { valide: false, raison: 'Trop de tentatives. Demandez un nouveau code.' };
    }

    const correspond = await bcrypt.compare(code, otp.code_hash);
    if (!correspond) {
        await query(`UPDATE otp_codes SET tentatives = $1 WHERE id = $2`, [otp.tentatives + 1, otp.id]);
        return { valide: false, raison: 'Code incorrect.' };
    }

    await query(`UPDATE otp_codes SET consumed_at = now() WHERE id = $1`, [otp.id]);
    return { valide: true };
}

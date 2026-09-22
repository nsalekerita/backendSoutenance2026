"use strict";
require("dotenv").config();
function optional(name, fallback = '') {
    const value = process.env[name] ?? fallback;
    if (!value)
        console.warn(`[env] Variable manquante: ${name}`);
    return value;
}
function requiredInProduction(name, fallback = '') {
    const value = process.env[name] ?? fallback;
    if ((process.env.NODE_ENV ?? 'development') === 'production' && !value) {
        throw new Error(`[env] Variable obligatoire en production: ${name}`);
    }
    return value;
}
exports.env = {
    host: process.env.HOST ?? '0.0.0.0',
    port: Number(process.env.PORT ?? 4000),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    supabaseUrl: requiredInProduction('SUPABASE_URL'),
    supabaseServiceRoleKey: requiredInProduction('SUPABASE_SERVICE_ROLE_KEY'),
    supabaseAnonKey: optional('SUPABASE_ANON_KEY'),
    jwtSecret: requiredInProduction('JWT_SECRET', (process.env.NODE_ENV ?? 'development') === 'production' ? '' : 'dev-secret-change-me'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    geminiApiKey: optional('GEMINI_API_KEY'),
    geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    smtpHost: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    smtpPort: Number(process.env.SMTP_PORT ?? 587),
    smtpUser: optional('SMTP_USER'),
    smtpPass: optional('SMTP_PASS'),
    smtpFrom: process.env.SMTP_FROM ?? 'IAI Horizon <no-reply@iaihorizon.com>',
    firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '',
    corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
};
